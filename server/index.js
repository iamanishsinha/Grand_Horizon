const express = require('express');
const cors = require('cors');
const path = require('path');

// Ensure database is initialized
require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/guests', require('./routes/guests'));
app.use('/api/room-types', require('./routes/roomTypes'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/db', require('./routes/db'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    hotel: 'Grand Horrizon',
    location: 'Plot 24, Demo Avenue, White Town, Puducherry – 605001',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error: ' + (err.message || 'Unknown error') });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏨 Grand Horrizon - Hotel Management System Backend`);
  console.log(`📍 Address: Plot 24, Demo Avenue, White Town, Puducherry – 605001`);
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
  console.log(`🗄️ Database: server/database/hotel.db`);
  console.log(`=======================================================`);
});
