#!/usr/bin/env node
/**
 * Grand Horrizon - Direct SQLite Query Runner CLI
 * 
 * Usage:
 *   node sql.js "SELECT * FROM Guests"
 *   node sql.js "INSERT INTO Guests (name, phone) VALUES ('Aarav Patel', '+91 98765 43210')"
 *   node sql.js   (starts interactive SQL console)
 */

const readline = require('readline');
const { db } = require('./server/database/db');

const query = process.argv.slice(2).join(' ').trim();

function executeSql(sql) {
  if (!sql || !sql.trim()) return;
  const trimmed = sql.trim().replace(/;+$/, '');

  try {
    const isSelect = /^(SELECT|PRAGMA|EXPLAIN)\b/i.test(trimmed);
    if (isSelect) {
      const rows = db.prepare(trimmed).all();
      if (rows.length === 0) {
        console.log('(0 rows returned)');
      } else {
        console.table(rows);
        console.log(`✓ ${rows.length} row(s) returned.`);
      }
    } else {
      const result = db.prepare(trimmed).run();
      console.log(`✓ Query executed successfully.`);
      console.log(`  Rows affected: ${result.changes}`);
      if (result.lastInsertRowid) {
        console.log(`  Last Insert ID: ${result.lastInsertRowid}`);
      }
    }
  } catch (err) {
    console.error('❌ SQLite Error:', err.message);
  }
}

if (query) {
  executeSql(query);
} else {
  console.log('====================================================');
  console.log('🏨 Grand Horrizon - Interactive SQLite Console');
  console.log('Database: server/database/hotel.db');
  console.log('Type your SQL query and press Enter. Type .exit to quit.');
  console.log('====================================================');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'sqlite> '
  });

  rl.prompt();

  rl.on('line', (line) => {
    const input = line.trim();
    if (input === '.exit' || input === 'exit' || input === 'quit') {
      rl.close();
      return;
    }
    if (input) {
      executeSql(input);
    }
    rl.prompt();
  }).on('close', () => {
    console.log('\nGoodbye!');
    process.exit(0);
  });
}
