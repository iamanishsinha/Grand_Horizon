import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Guests from './pages/Guests';
import Rooms from './pages/Rooms';
import Reservations from './pages/Reservations';
import Billing from './pages/Billing';
import Payments from './pages/Payments';
import Database from './pages/Database';

export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes inside Main Dashboard Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Dashboard available to all authenticated roles */}
          <Route path="/" element={<Dashboard />} />

          {/* Rooms viewable by all, editable by admin/receptionist */}
          <Route path="/rooms" element={<Rooms />} />

          {/* Guest Management (Admin & Receptionist) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'receptionist']} />}>
            <Route path="/guests" element={<Guests />} />
            <Route path="/reservations" element={<Reservations />} />
          </Route>

          {/* Billing & Payments (Admin & Accountant) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'accountant']} />}>
            <Route path="/billing" element={<Billing />} />
            <Route path="/payments" element={<Payments />} />
          </Route>

          {/* Database Management & Audit Logs (Admin only) */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/database" element={<Database />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
