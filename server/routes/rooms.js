const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// GET /api/rooms
router.get('/', authenticate, (req, res) => {
  try {
    const { status, type_id, floor } = req.query;
    let query = `
      SELECT 
        r.*,
        rt.name as type_name,
        rt.base_price,
        rt.capacity,
        rt.description as type_description
      FROM Rooms r
      JOIN Room_Types rt ON r.room_type_id = rt.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }
    if (type_id) {
      query += ` AND r.room_type_id = ?`;
      params.push(type_id);
    }
    if (floor) {
      query += ` AND r.floor = ?`;
      params.push(floor);
    }

    query += ` ORDER BY r.room_number ASC`;
    const rooms = db.prepare(query).all(...params);
    res.json(rooms);
  } catch (err) {
    console.error('Fetch rooms error:', err);
    res.status(500).json({ error: 'Failed to retrieve rooms' });
  }
});

// POST /api/rooms (admin only)
router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { room_number, room_type_id, status, floor } = req.body;
  if (!room_number || !room_type_id) {
    return res.status(400).json({ error: 'Room number and category are required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM Rooms WHERE room_number = ?').get(room_number.trim());
    if (existing) {
      return res.status(400).json({ error: `Room number "${room_number}" already exists` });
    }

    const tId = Number(room_type_id);
    const typeExists = db.prepare('SELECT id FROM Room_Types WHERE id = ?').get(tId);
    if (!typeExists) {
      return res.status(400).json({ error: 'Invalid room category selected' });
    }

    const info = db.prepare(`
      INSERT INTO Rooms (room_number, room_type_id, status, floor)
      VALUES (?, ?, ?, ?)
    `).run(room_number.trim(), tId, status || 'available', floor || '1st Floor');

    const newRoom = db.prepare(`
      SELECT r.*, rt.name as type_name, rt.base_price
      FROM Rooms r
      JOIN Room_Types rt ON r.room_type_id = rt.id
      WHERE r.id = ?
    `).get(info.lastInsertRowid);

    logAudit(req.user.id, 'CREATE', 'Rooms', info.lastInsertRowid, null, newRoom);
    res.status(201).json(newRoom);
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// PUT /api/rooms/:id (admin can update all; receptionist can update status)
router.put('/:id', authenticate, authorize('admin', 'receptionist'), (req, res) => {
  const { room_number, room_type_id, status, floor } = req.body;

  try {
    const oldRoom = db.prepare('SELECT * FROM Rooms WHERE id = ?').get(req.params.id);
    if (!oldRoom) return res.status(404).json({ error: 'Room not found' });

    if (req.user.role === 'admin') {
      // Admin can update all room attributes
      db.prepare(`
        UPDATE Rooms 
        SET room_number = ?, room_type_id = ?, status = ?, floor = ?
        WHERE id = ?
      `).run(
        room_number || oldRoom.room_number,
        room_type_id || oldRoom.room_type_id,
        status || oldRoom.status,
        floor || oldRoom.floor,
        req.params.id
      );
    } else {
      // Receptionist can only update room availability status
      if (!status) return res.status(400).json({ error: 'Status is required' });
      db.prepare('UPDATE Rooms SET status = ? WHERE id = ?').run(status, req.params.id);
    }

    const updatedRoom = db.prepare(`
      SELECT r.*, rt.name as type_name, rt.base_price
      FROM Rooms r
      JOIN Room_Types rt ON r.room_type_id = rt.id
      WHERE r.id = ?
    `).get(req.params.id);

    logAudit(req.user.id, 'UPDATE', 'Rooms', req.params.id, oldRoom, updatedRoom);
    res.json(updatedRoom);
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// DELETE /api/rooms/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const room = db.prepare('SELECT * FROM Rooms WHERE id = ?').get(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Check if room is linked to active or confirmed reservations
    const activeRes = db.prepare(`
      SELECT COUNT(*) as count 
      FROM Reservation_Rooms rr
      JOIN Reservations r ON rr.reservation_id = r.id
      WHERE rr.room_id = ? AND r.status IN ('confirmed', 'checked_in')
    `).get(req.params.id);

    if (activeRes.count > 0) {
      return res.status(400).json({
        error: `Cannot delete room "${room.room_number}" because it is currently assigned to an active or confirmed booking.`
      });
    }

    db.prepare('DELETE FROM Rooms WHERE id = ?').run(req.params.id);
    logAudit(req.user.id, 'DELETE', 'Rooms', req.params.id, room, null);

    res.json({ message: `Room "${room.room_number}" deleted successfully` });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;
