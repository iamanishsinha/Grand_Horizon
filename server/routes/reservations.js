const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Helper: Calculate nights between dates
function calculateNights(checkIn, checkOut) {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

// GET /api/reservations
router.get('/', authenticate, authorize('admin', 'receptionist'), (req, res) => {
  try {
    const { status, guest_id } = req.query;
    let query = `
      SELECT 
        res.*,
        g.name as guest_name,
        g.phone as guest_phone,
        g.email as guest_email,
        u.full_name as created_by_name,
        inv.id as invoice_id,
        inv.invoice_number,
        inv.total_amount,
        inv.amount_paid,
        inv.status as invoice_status
      FROM Reservations res
      JOIN Guests g ON res.guest_id = g.id
      LEFT JOIN Users u ON res.created_by = u.id
      LEFT JOIN Invoices inv ON res.id = inv.reservation_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND res.status = ?`;
      params.push(status);
    }
    if (guest_id) {
      query += ` AND res.guest_id = ?`;
      params.push(guest_id);
    }

    query += ` ORDER BY res.id DESC`;
    const reservations = db.prepare(query).all(...params);

    // Attach room details to each reservation
    const getRoomsStmt = db.prepare(`
      SELECT r.id, r.room_number, r.floor, rt.name as type_name, rt.base_price
      FROM Reservation_Rooms rr
      JOIN Rooms r ON rr.room_id = r.id
      JOIN Room_Types rt ON r.room_type_id = rt.id
      WHERE rr.reservation_id = ?
    `);

    const enhanced = reservations.map(r => {
      const rooms = getRoomsStmt.all(r.id);
      const nights = calculateNights(r.check_in_date, r.check_out_date);
      const roomTotalPerNight = rooms.reduce((sum, rm) => sum + (rm.base_price || 0), 0);
      const estimatedTotal = roomTotalPerNight * nights;

      return {
        ...r,
        rooms,
        nights,
        roomTotalPerNight,
        estimatedTotal
      };
    });

    res.json(enhanced);
  } catch (err) {
    console.error('Fetch reservations error:', err);
    res.status(500).json({ error: 'Failed to retrieve reservations' });
  }
});

// GET /api/reservations/:id
router.get('/:id', authenticate, authorize('admin', 'receptionist'), (req, res) => {
  try {
    const resv = db.prepare(`
      SELECT 
        res.*,
        g.name as guest_name,
        g.phone as guest_phone,
        g.email as guest_email,
        g.id_proof_type,
        g.id_proof_number,
        g.address as guest_address,
        u.full_name as created_by_name
      FROM Reservations res
      JOIN Guests g ON res.guest_id = g.id
      LEFT JOIN Users u ON res.created_by = u.id
      WHERE res.id = ?
    `).get(req.params.id);

    if (!resv) return res.status(404).json({ error: 'Reservation not found' });

    const rooms = db.prepare(`
      SELECT r.id, r.room_number, r.floor, rt.name as type_name, rt.base_price
      FROM Reservation_Rooms rr
      JOIN Rooms r ON rr.room_id = r.id
      JOIN Room_Types rt ON r.room_type_id = rt.id
      WHERE rr.reservation_id = ?
    `).all(resv.id);

    const invoice = db.prepare('SELECT * FROM Invoices WHERE reservation_id = ?').get(resv.id);

    res.json({
      ...resv,
      rooms,
      nights: calculateNights(resv.check_in_date, resv.check_out_date),
      invoice
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve reservation details' });
  }
});

// POST /api/reservations (create booking)
router.post('/', authenticate, authorize('admin', 'receptionist'), (req, res) => {
  const { guest_id, check_in_date, check_out_date, room_ids, status } = req.body;

  if (!guest_id || !check_in_date || !check_out_date || !room_ids || !Array.isArray(room_ids) || room_ids.length === 0) {
    return res.status(400).json({ error: 'Guest, check-in date, check-out date, and at least one room are required' });
  }

  try {
    const gId = Number(guest_id);
    const guest = db.prepare('SELECT id, name FROM Guests WHERE id = ?').get(gId);
    if (!guest) return res.status(400).json({ error: 'Selected guest does not exist' });

    const numericRoomIds = room_ids.map(Number);
    // Validate that rooms are available
    for (const rId of numericRoomIds) {
      const room = db.prepare('SELECT room_number, status FROM Rooms WHERE id = ?').get(rId);
      if (!room) return res.status(400).json({ error: `Room ID ${rId} does not exist` });
      if (room.status === 'occupied') {
        return res.status(400).json({ error: `Room ${room.room_number} is already occupied` });
      }
    }

    const bookingStatus = status || 'confirmed';

    // Insert reservation
    const resvInfo = db.prepare(`
      INSERT INTO Reservations (guest_id, check_in_date, check_out_date, status, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(gId, check_in_date, check_out_date, bookingStatus, req.user.id);

    const reservationId = resvInfo.lastInsertRowid;

    // Insert room associations
    const insertRoomLink = db.prepare('INSERT INTO Reservation_Rooms (reservation_id, room_id) VALUES (?, ?)');
    for (const rId of numericRoomIds) {
      insertRoomLink.run(reservationId, rId);
      if (bookingStatus === 'checked_in') {
        db.prepare("UPDATE Rooms SET status = 'occupied' WHERE id = ?").run(rId);
      }
    }

    // Automatically generate invoice for the reservation
    const nights = calculateNights(check_in_date, check_out_date);
    let totalRoomCharges = 0;
    for (const rId of numericRoomIds) {
      const rInfo = db.prepare('SELECT rt.base_price FROM Rooms r JOIN Room_Types rt ON r.room_type_id = rt.id WHERE r.id = ?').get(rId);
      if (rInfo) {
        totalRoomCharges += (rInfo.base_price * nights);
      }
    }

    const taxAmount = Math.round(totalRoomCharges * 0.18 * 100) / 100; // 18% GST
    const totalAmount = totalRoomCharges + taxAmount;
    const invNumber = `GH-INV-${String(reservationId).padStart(4, '0')}`;

    db.prepare(`
      INSERT INTO Invoices (invoice_number, reservation_id, room_charges, tax_amount, discount_amount, total_amount, amount_paid, status)
      VALUES (?, ?, ?, ?, ?, ?, 0, 'pending')
    `).run(invNumber, reservationId, totalRoomCharges, taxAmount, 0, totalAmount);

    logAudit(req.user.id, 'CREATE', 'Reservations', reservationId, null, {
      guest_id,
      guest_name: guest.name,
      check_in_date,
      check_out_date,
      status: bookingStatus,
      rooms: room_ids
    });

    res.status(201).json({
      message: 'Reservation created successfully',
      reservationId,
      invoiceNumber: invNumber
    });
  } catch (err) {
    console.error('Create reservation error:', err);
    res.status(500).json({ error: 'Failed to create reservation: ' + err.message });
  }
});

// PATCH /api/reservations/:id/checkin
router.patch('/:id/checkin', authenticate, authorize('admin', 'receptionist'), (req, res) => {
  try {
    const resv = db.prepare('SELECT * FROM Reservations WHERE id = ?').get(req.params.id);
    if (!resv) return res.status(404).json({ error: 'Reservation not found' });

    if (resv.status === 'checked_in') {
      return res.status(400).json({ error: 'Reservation is already marked as checked in' });
    }
    if (resv.status === 'checked_out' || resv.status === 'cancelled') {
      return res.status(400).json({ error: `Cannot check in a ${resv.status} reservation` });
    }

    // Update reservation status
    db.prepare("UPDATE Reservations SET status = 'checked_in' WHERE id = ?").run(req.params.id);

    // Update rooms to occupied
    const roomLinks = db.prepare('SELECT room_id FROM Reservation_Rooms WHERE reservation_id = ?').all(req.params.id);
    for (const link of roomLinks) {
      db.prepare("UPDATE Rooms SET status = 'occupied' WHERE id = ?").run(link.room_id);
    }

    logAudit(req.user.id, 'UPDATE_STATUS', 'Reservations', req.params.id, { status: resv.status }, { status: 'checked_in' });

    res.json({ message: 'Guest successfully checked in. Rooms set to occupied.' });
  } catch (err) {
    console.error('Checkin error:', err);
    res.status(500).json({ error: 'Failed to check in reservation' });
  }
});

// PATCH /api/reservations/:id/checkout
router.patch('/:id/checkout', authenticate, authorize('admin', 'receptionist'), (req, res) => {
  try {
    const resv = db.prepare('SELECT * FROM Reservations WHERE id = ?').get(req.params.id);
    if (!resv) return res.status(404).json({ error: 'Reservation not found' });

    if (resv.status === 'checked_out') {
      return res.status(400).json({ error: 'Reservation is already checked out' });
    }

    // Update reservation status
    db.prepare("UPDATE Reservations SET status = 'checked_out' WHERE id = ?").run(req.params.id);

    // Free rooms back to available
    const roomLinks = db.prepare('SELECT room_id FROM Reservation_Rooms WHERE reservation_id = ?').all(req.params.id);
    for (const link of roomLinks) {
      db.prepare("UPDATE Rooms SET status = 'available' WHERE id = ?").run(link.room_id);
    }

    logAudit(req.user.id, 'UPDATE_STATUS', 'Reservations', req.params.id, { status: resv.status }, { status: 'checked_out' });

    res.json({ message: 'Guest successfully checked out. Rooms marked as available.' });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to check out reservation' });
  }
});

// DELETE /api/reservations/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const resv = db.prepare('SELECT * FROM Reservations WHERE id = ?').get(req.params.id);
    if (!resv) return res.status(404).json({ error: 'Reservation not found' });

    // Release rooms if occupied
    const roomLinks = db.prepare('SELECT room_id FROM Reservation_Rooms WHERE reservation_id = ?').all(req.params.id);
    for (const link of roomLinks) {
      db.prepare("UPDATE Rooms SET status = 'available' WHERE id = ?").run(link.room_id);
    }

    // Delete reservation (cascades reservation_rooms, check invoices)
    db.prepare('DELETE FROM Invoices WHERE reservation_id = ?').run(req.params.id);
    db.prepare('DELETE FROM Reservations WHERE id = ?').run(req.params.id);

    logAudit(req.user.id, 'DELETE', 'Reservations', req.params.id, resv, null);

    res.json({ message: 'Reservation and associated billing records deleted successfully' });
  } catch (err) {
    console.error('Delete reservation error:', err);
    res.status(500).json({ error: 'Failed to delete reservation' });
  }
});

module.exports = router;
