const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticate, (req, res) => {
  try {
    // 1. Total rooms, available rooms, occupied rooms, maintenance rooms
    const roomStats = db.prepare(`
      SELECT 
        COUNT(*) as total_rooms,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_rooms,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_rooms,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_rooms
      FROM Rooms
    `).get();

    // 2. Total registered guests
    const guestStats = db.prepare(`
      SELECT COUNT(*) as total_guests FROM Guests
    `).get();

    // 3. Total reservations & status breakdown
    const reservationStats = db.prepare(`
      SELECT 
        COUNT(*) as total_reservations,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_reservations,
        SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) as active_stays,
        SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) as completed_stays,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_reservations
      FROM Reservations
    `).get();

    // 4. Total revenue & outstanding balance
    const revenueStats = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_billed,
        COALESCE(SUM(amount_paid), 0) as total_collected,
        COALESCE(SUM(total_amount - amount_paid), 0) as total_outstanding
      FROM Invoices
    `).get();

    // 5. Room Type Distribution
    const roomTypeDistribution = db.prepare(`
      SELECT 
        rt.name as category,
        COUNT(r.id) as total,
        SUM(CASE WHEN r.status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN r.status = 'occupied' THEN 1 ELSE 0 END) as occupied
      FROM Room_Types rt
      LEFT JOIN Rooms r ON rt.id = r.room_type_id
      GROUP BY rt.id, rt.name
      ORDER BY rt.base_price ASC
    `).all();

    // 6. Recent 5 Reservations with Guest and Rooms info (JOIN query)
    const recentReservations = db.prepare(`
      SELECT 
        res.id,
        res.check_in_date,
        res.check_out_date,
        res.status,
        res.created_at,
        g.name as guest_name,
        g.phone as guest_phone,
        GROUP_CONCAT(r.room_number, ', ') as assigned_rooms
      FROM Reservations res
      JOIN Guests g ON res.guest_id = g.id
      LEFT JOIN Reservation_Rooms rr ON res.id = rr.reservation_id
      LEFT JOIN Rooms r ON rr.room_id = r.id
      GROUP BY res.id
      ORDER BY res.id DESC
      LIMIT 5
    `).all();

    // 7. Recent 5 Payments (JOIN query)
    const recentPayments = db.prepare(`
      SELECT 
        p.id,
        p.amount,
        p.payment_method,
        p.transaction_ref,
        p.paid_at,
        inv.invoice_number,
        u.full_name as recorded_by_name
      FROM Payments p
      JOIN Invoices inv ON p.invoice_id = inv.id
      LEFT JOIN Users u ON p.recorded_by = u.id
      ORDER BY p.id DESC
      LIMIT 5
    `).all();

    res.json({
      roomStats: {
        total: roomStats.total_rooms || 0,
        available: roomStats.available_rooms || 0,
        occupied: roomStats.occupied_rooms || 0,
        maintenance: roomStats.maintenance_rooms || 0
      },
      guestsCount: guestStats.total_guests || 0,
      reservationStats: {
        total: reservationStats.total_reservations || 0,
        confirmed: reservationStats.confirmed_reservations || 0,
        active: reservationStats.active_stays || 0,
        completed: reservationStats.completed_stays || 0,
        cancelled: reservationStats.cancelled_reservations || 0
      },
      revenueStats: {
        billed: revenueStats.total_billed || 0,
        collected: revenueStats.total_collected || 0,
        outstanding: revenueStats.total_outstanding || 0
      },
      roomTypeDistribution,
      recentReservations,
      recentPayments
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to generate dashboard statistics' });
  }
});

module.exports = router;
