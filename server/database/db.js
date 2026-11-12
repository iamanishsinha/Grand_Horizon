const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Permanent database directory and file path
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'hotel.db');

// Create database connection using better-sqlite3 or Node's native node:sqlite
let db;
try {
  const BetterSqlite = require('better-sqlite3');
  db = new BetterSqlite(dbPath);
  db.pragma('foreign_keys = ON');
  // Use DELETE mode and FULL synchronous so every write is directly written into hotel.db
  db.pragma('journal_mode = DELETE');
  db.pragma('synchronous = FULL');
} catch (e) {
  // Use Node.js built-in sqlite (supported natively in Node 22+)
  const { DatabaseSync } = require('node:sqlite');
  const nativeDb = new DatabaseSync(dbPath);

  // Checkpoint any previous WAL data into hotel.db if existing
  try {
    nativeDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  } catch (err) {}

  nativeDb.exec('PRAGMA foreign_keys = ON;');
  // Set journal_mode to DELETE so changes are written directly into hotel.db immediately
  try {
    nativeDb.exec('PRAGMA journal_mode = DELETE;');
  } catch (err) {}
  nativeDb.exec('PRAGMA synchronous = FULL;');

  // Adapt to match standard better-sqlite3 API
  db = {
    exec(sql) {
      return nativeDb.exec(sql);
    },
    pragma(sql) {
      return nativeDb.exec(`PRAGMA ${sql};`);
    },
    prepare(sql) {
      const stmt = nativeDb.prepare(sql);
      return {
        run(...params) {
          const res = stmt.run(...params);
          return {
            changes: res.changes,
            lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0
          };
        },
        get(...params) {
          return stmt.get(...params);
        },
        all(...params) {
          return stmt.all(...params);
        }
      };
    }
  };
}

// Audit log helper function
function logAudit(userId, action, tableName, recordId, oldValues = null, newValues = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO Audit_Logs (user_id, action, table_name, record_id, old_values, new_values, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(
      userId ? Number(userId) : null,
      action,
      tableName,
      recordId ? Number(recordId) : null,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null
    );
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

// Initialize tables if they do not exist
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'receptionist', 'accountant')) NOT NULL,
      full_name TEXT NOT NULL,
      session_token TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      id_proof_type TEXT DEFAULT 'Aadhaar / ID',
      id_proof_number TEXT,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Room_Types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      base_price REAL NOT NULL,
      capacity INTEGER DEFAULT 2,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS Rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT UNIQUE NOT NULL,
      room_type_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('available', 'occupied', 'maintenance')) DEFAULT 'available',
      floor TEXT DEFAULT '1st Floor',
      FOREIGN KEY (room_type_id) REFERENCES Room_Types(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS Reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id INTEGER NOT NULL,
      check_in_date TEXT NOT NULL,
      check_out_date TEXT NOT NULL,
      status TEXT CHECK(status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled')) DEFAULT 'confirmed',
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (guest_id) REFERENCES Guests(id) ON DELETE RESTRICT,
      FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS Reservation_Rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      FOREIGN KEY (reservation_id) REFERENCES Reservations(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES Rooms(id) ON DELETE RESTRICT,
      UNIQUE(reservation_id, room_id)
    );

    CREATE TABLE IF NOT EXISTS Invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      reservation_id INTEGER NOT NULL,
      room_charges REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0,
      status TEXT CHECK(status IN ('pending', 'partial', 'paid')) DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (reservation_id) REFERENCES Reservations(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS Payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('cash', 'upi', 'card', 'bank_transfer')) NOT NULL,
      transaction_ref TEXT,
      paid_at TEXT DEFAULT (datetime('now')),
      recorded_by INTEGER,
      notes TEXT,
      FOREIGN KEY (invoice_id) REFERENCES Invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (recorded_by) REFERENCES Users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS Audit_Logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
    );
  `);

  // Seed default Users if none exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM Users').get().count;
  if (userCount === 0) {
    console.log('Seeding default users for Grand Horrizon...');
    const salt = bcrypt.genSaltSync(10);
    const insertUser = db.prepare(`
      INSERT INTO Users (username, password_hash, role, full_name)
      VALUES (?, ?, ?, ?)
    `);

    insertUser.run('admin', bcrypt.hashSync('admin123', salt), 'admin', 'Administrator (Rajesh Kumar)');
    insertUser.run('reception', bcrypt.hashSync('reception123', salt), 'receptionist', 'Reception Desk (Anjali Sharma)');
    insertUser.run('accounts', bcrypt.hashSync('accounts123', salt), 'accountant', 'Chief Accountant (Venkatesh S)');
  }

  // Seed default Room Types if none exist
  const typeCount = db.prepare('SELECT COUNT(*) as count FROM Room_Types').get().count;
  if (typeCount === 0) {
    console.log('Seeding initial Room Types and Rooms...');
    const insertType = db.prepare(`
      INSERT INTO Room_Types (name, base_price, capacity, description)
      VALUES (?, ?, ?, ?)
    `);

    const standard = insertType.run('Standard Room', 2499.00, 2, 'Cozy room with queen bed, ensuite bathroom, and high-speed Wi-Fi');
    const deluxe = insertType.run('Deluxe Ocean View', 4499.00, 3, 'Spacious room with balcony facing the Bay of Bengal, king bed, and mini-bar');
    const suite = insertType.run('Heritage Presidential Suite', 8999.00, 4, 'French colonial architecture suite with private living room and luxury amenities');

    const insertRoom = db.prepare(`
      INSERT INTO Rooms (room_number, room_type_id, status, floor)
      VALUES (?, ?, ?, ?)
    `);

    // Standard rooms
    insertRoom.run('101', standard.lastInsertRowid, 'available', '1st Floor');
    insertRoom.run('102', standard.lastInsertRowid, 'available', '1st Floor');
    insertRoom.run('103', standard.lastInsertRowid, 'available', '1st Floor');
    insertRoom.run('104', standard.lastInsertRowid, 'maintenance', '1st Floor');

    // Deluxe rooms
    insertRoom.run('201', deluxe.lastInsertRowid, 'available', '2nd Floor');
    insertRoom.run('202', deluxe.lastInsertRowid, 'available', '2nd Floor');
    insertRoom.run('203', deluxe.lastInsertRowid, 'available', '2nd Floor');

    // Presidential suites
    insertRoom.run('301', suite.lastInsertRowid, 'available', '3rd Floor');
    insertRoom.run('302', suite.lastInsertRowid, 'available', '3rd Floor');
  }

  // Seed initial sample guests if none exist
  const guestCount = db.prepare('SELECT COUNT(*) as count FROM Guests').get().count;
  if (guestCount === 0) {
    const insertGuest = db.prepare(`
      INSERT INTO Guests (name, email, phone, id_proof_type, id_proof_number, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertGuest.run(
      'Siddharth Menon',
      'siddharth.menon@example.com',
      '+91 98401 23456',
      'Passport',
      'Z8493012',
      '42, Green Park Avenue, Chennai, Tamil Nadu'
    );
    insertGuest.run(
      'Elena Rostova',
      'elena.travels@example.com',
      '+91 97890 54321',
      'Passport',
      'FR9821033',
      'Rue de Suffren, Paris / Visiting Puducherry'
    );
  }
}

// Run DB initialization
initDb();

module.exports = {
  db,
  logAudit,
  dbPath
};
