const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// GET /api/payments
router.get('/', authenticate, authorize('admin', 'accountant'), (req, res) => {
  try {
    const { method, invoice_id } = req.query;
    let query = `
      SELECT 
        p.*,
        inv.invoice_number,
        inv.total_amount,
        inv.amount_paid,
        g.name as guest_name,
        u.full_name as recorded_by_name
      FROM Payments p
      JOIN Invoices inv ON p.invoice_id = inv.id
      JOIN Reservations res ON inv.reservation_id = res.id
      JOIN Guests g ON res.guest_id = g.id
      LEFT JOIN Users u ON p.recorded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (method) {
      query += ` AND p.payment_method = ?`;
      params.push(method);
    }
    if (invoice_id) {
      query += ` AND p.invoice_id = ?`;
      params.push(invoice_id);
    }

    query += ` ORDER BY p.id DESC`;
    const payments = db.prepare(query).all(...params);
    res.json(payments);
  } catch (err) {
    console.error('Fetch payments error:', err);
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

// POST /api/payments (record payment)
router.post('/', authenticate, authorize('admin', 'accountant'), (req, res) => {
  const { invoice_id, amount, payment_method, transaction_ref, notes } = req.body;

  if (!invoice_id || !amount || Number(amount) <= 0 || !payment_method) {
    return res.status(400).json({ error: 'Valid invoice, positive amount, and payment method are required' });
  }

  const validMethods = ['cash', 'upi', 'card', 'bank_transfer'];
  if (!validMethods.includes(payment_method)) {
    return res.status(400).json({ error: `Invalid payment method. Allowed: ${validMethods.join(', ')}` });
  }

  try {
    const invId = Number(invoice_id);
    const invoice = db.prepare('SELECT * FROM Invoices WHERE id = ?').get(invId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const payAmount = Number(amount);
    const newPaidTotal = invoice.amount_paid + payAmount;
    let newStatus = 'partial';
    if (newPaidTotal >= invoice.total_amount) {
      newStatus = 'paid';
    }

    // Insert payment record
    const payInfo = db.prepare(`
      INSERT INTO Payments (invoice_id, amount, payment_method, transaction_ref, recorded_by, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      invId,
      payAmount,
      payment_method,
      transaction_ref || (payment_method === 'cash' ? 'CASH-REC-' + Date.now().toString().slice(-6) : null),
      req.user.id,
      notes || null
    );

    // Update invoice
    db.prepare(`
      UPDATE Invoices 
      SET amount_paid = ?, status = ?
      WHERE id = ?
    `).run(newPaidTotal, newStatus, invId);

    const paymentRecord = db.prepare('SELECT * FROM Payments WHERE id = ?').get(payInfo.lastInsertRowid);
    logAudit(req.user.id, 'RECORD_PAYMENT', 'Payments', payInfo.lastInsertRowid, null, {
      invoice_id,
      invoice_number: invoice.invoice_number,
      amount: payAmount,
      method: payment_method
    });

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: paymentRecord,
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        amount_paid: newPaidTotal,
        balance_due: Math.max(0, invoice.total_amount - newPaidTotal),
        status: newStatus
      }
    });
  } catch (err) {
    console.error('Record payment error:', err);
    res.status(500).json({ error: 'Failed to record payment: ' + err.message });
  }
});

// DELETE /api/payments/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const payment = db.prepare('SELECT * FROM Payments WHERE id = ?').get(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    const invoice = db.prepare('SELECT * FROM Invoices WHERE id = ?').get(payment.invoice_id);

    db.prepare('DELETE FROM Payments WHERE id = ?').run(req.params.id);

    if (invoice) {
      const remainingPaid = Math.max(0, invoice.amount_paid - payment.amount);
      const newStatus = remainingPaid >= invoice.total_amount && invoice.total_amount > 0 ? 'paid' : (remainingPaid > 0 ? 'partial' : 'pending');
      db.prepare('UPDATE Invoices SET amount_paid = ?, status = ? WHERE id = ?').run(remainingPaid, newStatus, invoice.id);
    }

    logAudit(req.user.id, 'DELETE_PAYMENT', 'Payments', req.params.id, payment, null);

    res.json({ message: 'Payment record deleted and invoice balance adjusted' });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Failed to delete payment record' });
  }
});

module.exports = router;
