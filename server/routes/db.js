const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db, logAudit, dbPath } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const ALLOWED_TABLES = [
  'Users',
  'Guests',
  'Rooms',
  'Room_Types',
  'Reservations',
  'Reservation_Rooms',
  'Invoices',
  'Payments',
  'Audit_Logs'
];

// GET /api/db/tables - List tables and record counts
router.get('/tables', authenticate, authorize('admin'), (req, res) => {
  try {
    const tables = ALLOWED_TABLES.map(table => {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      return { name: table, rowCount: count };
    });
    res.json(tables);
  } catch (err) {
    console.error('Fetch tables error:', err);
    res.status(500).json({ error: 'Failed to retrieve database tables' });
  }
});

// GET /api/db/table/:name - View schema and data for a specific table
router.get('/table/:name', authenticate, authorize('admin'), (req, res) => {
  const tableName = req.params.name;
  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid or restricted table name' });
  }

  try {
    // Get table column metadata
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();

    // Get rows (hide password hashes from Users table for security)
    let rows;
    if (tableName === 'Users') {
      rows = db.prepare('SELECT id, username, role, full_name, session_token, created_at FROM Users ORDER BY id ASC').all();
    } else {
      rows = db.prepare(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 200`).all();
    }

    res.json({
      tableName,
      columns,
      rows
    });
  } catch (err) {
    console.error('Fetch table data error:', err);
    res.status(500).json({ error: 'Failed to fetch table records' });
  }
});

// GET /api/db/audit-logs - View audit history
router.get('/audit-logs', authenticate, authorize('admin'), (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT 
        a.*,
        u.username,
        u.full_name,
        u.role
      FROM Audit_Logs a
      LEFT JOIN Users u ON a.user_id = u.id
      ORDER BY a.id DESC
      LIMIT 150
    `).all();

    const parsed = logs.map(l => ({
      ...l,
      old_values: l.old_values ? JSON.parse(l.old_values) : null,
      new_values: l.new_values ? JSON.parse(l.new_values) : null
    }));

    res.json(parsed);
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve audit trail' });
  }
});

// GET /api/db/backup - Download direct backup copy of hotel.db
router.get('/backup', authenticate, authorize('admin'), (req, res) => {
  try {
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database file not found' });
    }

    // Flush any pending journal/sync
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch (e) {}

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const downloadName = `grand_horrizon_backup_${timestamp}.db`;

    logAudit(req.user.id, 'BACKUP_DOWNLOAD', 'Database', null, null, { backup_file: downloadName });

    res.download(dbPath, downloadName, (err) => {
      if (err) {
        console.error('Error sending backup file:', err);
      }
    });
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({ error: 'Failed to generate database backup' });
  }
});

// POST /api/db/execute - Execute custom raw SQL query (Admin only, academic DBMS feature)
router.post('/execute', authenticate, authorize('admin'), (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'SQL query cannot be empty' });
  }

  const trimmed = query.trim().replace(/;+$/, ''); // Remove trailing semicolon
  try {
    const isSelect = /^(SELECT|PRAGMA|EXPLAIN)\b/i.test(trimmed);

    if (isSelect) {
      const rows = db.prepare(trimmed).all();
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      return res.json({
        type: 'SELECT',
        rowCount: rows.length,
        columns,
        rows
      });
    } else {
      const result = db.prepare(trimmed).run();

      logAudit(req.user.id, 'RAW_SQL_EXECUTE', 'Custom_Query', null, null, {
        sql: trimmed,
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid
      });

      return res.json({
        type: 'MUTATION',
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid,
        message: `Query executed successfully. ${result.changes} row(s) affected.`
      });
    }
  } catch (err) {
    console.error('SQL Execution Error:', err);
    return res.status(400).json({ error: 'SQLite Error: ' + err.message });
  }
});

module.exports = router;
