const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// GET /api/room-types
router.get('/', authenticate, (req, res) => {
  try {
    const types = db.prepare(`
      SELECT 
        rt.*,
        COUNT(r.id) as room_count
      FROM Room_Types rt
      LEFT JOIN Rooms r ON rt.id = r.room_type_id
      GROUP BY rt.id
      ORDER BY rt.base_price ASC
    `).all();
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve room categories' });
  }
});

// POST /api/room-types (admin only)
router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { name, base_price, capacity, description } = req.body;
  if (!name || base_price === undefined || base_price === '') {
    return res.status(400).json({ error: 'Category name and base price are required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM Room_Types WHERE name = ?').get(name.trim());
    if (existing) {
      return res.status(400).json({ error: 'A room category with this name already exists' });
    }

    const info = db.prepare(`
      INSERT INTO Room_Types (name, base_price, capacity, description)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), Number(base_price), Number(capacity) || 2, description || null);

    const newType = db.prepare('SELECT * FROM Room_Types WHERE id = ?').get(info.lastInsertRowid);
    logAudit(req.user.id, 'CREATE', 'Room_Types', info.lastInsertRowid, null, newType);

    res.status(201).json(newType);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create room category' });
  }
});

// PUT /api/room-types/:id (admin only)
router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const { name, base_price, capacity, description } = req.body;
  if (!name || base_price === undefined || base_price === '') {
    return res.status(400).json({ error: 'Category name and base price are required' });
  }

  try {
    const oldType = db.prepare('SELECT * FROM Room_Types WHERE id = ?').get(req.params.id);
    if (!oldType) return res.status(404).json({ error: 'Room category not found' });

    db.prepare(`
      UPDATE Room_Types 
      SET name = ?, base_price = ?, capacity = ?, description = ?
      WHERE id = ?
    `).run(name.trim(), Number(base_price), Number(capacity) || 2, description || null, req.params.id);

    const updated = db.prepare('SELECT * FROM Room_Types WHERE id = ?').get(req.params.id);
    logAudit(req.user.id, 'UPDATE', 'Room_Types', req.params.id, oldType, updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update room category' });
  }
});

// DELETE /api/room-types/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const type = db.prepare('SELECT * FROM Room_Types WHERE id = ?').get(req.params.id);
    if (!type) return res.status(404).json({ error: 'Room category not found' });

    const roomCount = db.prepare('SELECT COUNT(*) as count FROM Rooms WHERE room_type_id = ?').get(req.params.id).count;
    if (roomCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category "${type.name}" because ${roomCount} room(s) belong to it. Reassign or delete those rooms first.`
      });
    }

    db.prepare('DELETE FROM Room_Types WHERE id = ?').run(req.params.id);
    logAudit(req.user.id, 'DELETE', 'Room_Types', req.params.id, type, null);

    res.json({ message: `Room category "${type.name}" deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete room category' });
  }
});

module.exports = router;
