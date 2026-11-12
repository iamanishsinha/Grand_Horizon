const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// GET /api/invoices
router.get('/', authenticate, authorize('admin', 'accountant'), (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        inv.*,
        (inv.total_amount - inv.amount_paid) as balance_due,
        res.check_in_date,
        res.check_out_date,
        res.status as reservation_status,
        g.name as guest_name,
        g.phone as guest_phone,
        g.email as guest_email,
        GROUP_CONCAT(r.room_number, ', ') as room_numbers
      FROM Invoices inv
      JOIN Reservations res ON inv.reservation_id = res.id
      JOIN Guests g ON res.guest_id = g.id
      LEFT JOIN Reservation_Rooms rr ON res.id = rr.reservation_id
      LEFT JOIN Rooms r ON rr.room_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND inv.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY inv.id ORDER BY inv.id DESC`;
    const invoices = db.prepare(query).all(...params);
    res.json(invoices);
  } catch (err) {
    console.error('Fetch invoices error:', err);
    res.status(500).json({ error: 'Failed to retrieve invoices' });
  }
});

// GET /api/invoices/:id (printable details)
router.get('/:id', authenticate, authorize('admin', 'accountant'), (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT 
        inv.*,
        (inv.total_amount - inv.amount_paid) as balance_due,
        res.check_in_date,
        res.check_out_date,
        res.status as reservation_status,
        g.name as guest_name,
        g.phone as guest_phone,
        g.email as guest_email,
        g.id_proof_type,
        g.id_proof_number,
        g.address as guest_address
      FROM Invoices inv
      JOIN Reservations res ON inv.reservation_id = res.id
      JOIN Guests g ON res.guest_id = g.id
      WHERE inv.id = ?
    `).get(req.params.id);

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Itemized rooms
    const rooms = db.prepare(`
      SELECT r.room_number, r.floor, rt.name as type_name, rt.base_price
      FROM Reservation_Rooms rr
      JOIN Rooms r ON rr.room_id = r.id
      JOIN Room_Types rt ON r.room_type_id = rt.id
      WHERE rr.reservation_id = ?
    `).all(invoice.reservation_id);

    // Payments recorded for this invoice
    const payments = db.prepare(`
      SELECT p.*, u.full_name as recorded_by_name
      FROM Payments p
      LEFT JOIN Users u ON p.recorded_by = u.id
      WHERE p.invoice_id = ?
      ORDER BY p.id ASC
    `).all(invoice.id);

    const d1 = new Date(invoice.check_in_date);
    const d2 = new Date(invoice.check_out_date);
    const nights = Math.max(1, Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)));

    res.json({
      ...invoice,
      hotel: {
        name: 'Grand Horrizon',
        tagline: 'Luxury Living by the Promenade',
        address: 'Plot 24, Demo Avenue, White Town, Puducherry – 605001',
        phone: '+91 (0413) 223 4567 / 223 4568',
        email: 'reservations@grandhorrizon.com',
        gstin: '34AAACG1234F1Z8'
      },
      nights,
      rooms,
      payments
    });
  } catch (err) {
    console.error('Invoice details error:', err);
    res.status(500).json({ error: 'Failed to retrieve invoice details' });
  }
});

// PUT /api/invoices/:id (update discount or charges)
router.put('/:id', authenticate, authorize('admin', 'accountant'), (req, res) => {
  const { discount_amount } = req.body;

  try {
    const oldInv = db.prepare('SELECT * FROM Invoices WHERE id = ?').get(req.params.id);
    if (!oldInv) return res.status(404).json({ error: 'Invoice not found' });

    const discount = Math.max(0, Number(discount_amount) || 0);
    const taxableSubtotal = Math.max(0, oldInv.room_charges - discount);
    const tax = Math.round(taxableSubtotal * 0.18 * 100) / 100;
    const total = taxableSubtotal + tax;

    let status = 'pending';
    if (oldInv.amount_paid >= total && total > 0) {
      status = 'paid';
    } else if (oldInv.amount_paid > 0) {
      status = 'partial';
    }

    db.prepare(`
      UPDATE Invoices 
      SET discount_amount = ?, tax_amount = ?, total_amount = ?, status = ?
      WHERE id = ?
    `).run(discount, tax, total, status, req.params.id);

    const updated = db.prepare('SELECT * FROM Invoices WHERE id = ?').get(req.params.id);
    logAudit(req.user.id, 'UPDATE_INVOICE', 'Invoices', req.params.id, oldInv, updated);

    res.json(updated);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

module.exports = router;
