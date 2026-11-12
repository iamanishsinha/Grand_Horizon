const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// GET /api/guests (with search query)
router.get('/', authenticate, authorize('admin', 'receptionist'), (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        g.*,
        (SELECT COUNT(*) FROM Reservations WHERE guest_id = g.id) as reservation_count
      FROM Guests g
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` WHERE g.name LIKE ? OR g.phone LIKE ? OR g.email LIKE ? OR g.id_proof_number LIKE ?`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY g.id DESC`;
    const guests = db.prepare(query).all(...params);
    res.json(guests);
  } catch (err) {
    console.error('Fetch guests error:', err);
    res.status(500).json({ error: 'Failed to retrieve guest records' });
  }
});

// GET /api/guests/:id
router.get('/:id', authenticate, authorize('admin', 'receptionist'), (req, res) => {
  try {
    const guest = db.prepare('SELECT * FROM Guests WHERE id = ?').get(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    res.json(guest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve guest' });
  }
});

// POST /api/guests (add guest)
router.post('/', authenticate, authorize('admin', 'receptionist'), (req, res) => {
  const { name, email, phone, id_proof_type, id_proof_number, address } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Guest name and phone number are required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO Guests (name, email, phone, id_proof_type, id_proof_number, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, email || null, phone, id_proof_type || 'Aadhaar / ID', id_proof_number || null, address || null);

    const newGuest = db.prepare('SELECT * FROM Guests WHERE id = ?').get(info.lastInsertRowid);
    logAudit(req.user.id, 'CREATE', 'Guests', info.lastInsertRowid, null, newGuest);

    res.status(201).json(newGuest);
  } catch (err) {
    console.error('Create guest error:', err);
    res.status(500).json({ error: 'Failed to create guest record' });
  }
});

// PUT /api/guests/:id (update guest)
router.put('/:id', authenticate, authorize('admin', 'receptionist'), (req, res) => {
  const { name, email, phone, id_proof_type, id_proof_number, address } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Guest name and phone are required' });
  }

  try {
    const oldGuest = db.prepare('SELECT * FROM Guests WHERE id = ?').get(req.params.id);
    if (!oldGuest) return res.status(404).json({ error: 'Guest not found' });

    db.prepare(`
      UPDATE Guests 
      SET name = ?, email = ?, phone = ?, id_proof_type = ?, id_proof_number = ?, address = ?
      WHERE id = ?
    `).run(name, email || null, phone, id_proof_type || 'Aadhaar / ID', id_proof_number || null, address || null, req.params.id);

    const updatedGuest = db.prepare('SELECT * FROM Guests WHERE id = ?').get(req.params.id);
    logAudit(req.user.id, 'UPDATE', 'Guests', req.params.id, oldGuest, updatedGuest);

    res.json(updatedGuest);
  } catch (err) {
    console.error('Update guest error:', err);
    res.status(500).json({ error: 'Failed to update guest record' });
  }
});

// DELETE /api/guests/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const guest = db.prepare('SELECT * FROM Guests WHERE id = ?').get(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    // Check if guest has linked reservations
    const reservations = db.prepare('SELECT COUNT(*) as count FROM Reservations WHERE guest_id = ?').get(req.params.id);
    if (reservations.count > 0) {
      return res.status(400).json({
        error: `Cannot delete guest "${guest.name}" because ${reservations.count} reservation(s) are linked to this record.`
      });
    }

    db.prepare('DELETE FROM Guests WHERE id = ?').run(req.params.id);
    logAudit(req.user.id, 'DELETE', 'Guests', req.params.id, guest, null);

    res.json({ message: `Guest "${guest.name}" deleted successfully` });
  } catch (err) {
    console.error('Delete guest error:', err);
    res.status(500).json({ error: 'Failed to delete guest record' });
  }
});

module.exports = router;
