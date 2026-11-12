import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  CalendarCheck,
  Plus,
  LogIn,
  LogOut,
  Trash2,
  Calendar,
  BedDouble,
  User,
  Clock,
  CheckCircle2,
  Filter,
  IndianRupee,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    guest_id: '',
    check_in_date: new Date().toISOString().slice(0, 10),
    check_out_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    room_ids: [],
    status: 'confirmed'
  });

  const { hasRole } = useAuth();

  const fetchData = async () => {
    try {
      const [resvRes, gRes, rRes] = await Promise.all([
        api.get('/reservations', { params: { status: statusFilter } }),
        api.get('/guests'),
        api.get('/rooms', { params: { status: 'available' } })
      ]);
      setReservations(resvRes.data);
      setGuests(gRes.data);
      setAvailableRooms(rRes.data);
    } catch (err) {
      toast.error('Failed to load reservation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const openNewBooking = () => {
    const today = new Date().toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
    setFormData({
      guest_id: guests[0]?.id || '',
      check_in_date: today,
      check_out_date: dayAfter,
      room_ids: [],
      status: 'confirmed'
    });
    setModalOpen(true);
  };

  const handleRoomToggle = (roomId) => {
    setFormData((prev) => {
      const exists = prev.room_ids.includes(roomId);
      return {
        ...prev,
        room_ids: exists
          ? prev.room_ids.filter((id) => id !== roomId)
          : [...prev.room_ids, roomId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.guest_id) {
      toast.error('Please select a guest');
      return;
    }
    if (formData.room_ids.length === 0) {
      toast.error('Please select at least one room');
      return;
    }
    if (new Date(formData.check_out_date) <= new Date(formData.check_in_date)) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    try {
      await api.post('/reservations', formData);
      toast.success('Reservation created and invoice generated');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create reservation');
    }
  };

  const handleCheckIn = async (resv) => {
    try {
      await api.patch(`/reservations/${resv.id}/checkin`);
      toast.success(`Guest checked in! Room(s) marked occupied.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async (resv) => {
    if (!window.confirm(`Confirm check-out for ${resv.guest_name}? Assigned rooms will be marked available.`)) return;
    try {
      await api.patch(`/reservations/${resv.id}/checkout`);
      toast.success(`Guest checked out! Room(s) released.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-out failed');
    }
  };

  const handleDelete = async (resv) => {
    if (!window.confirm(`Delete reservation #${resv.id} for ${resv.guest_name}?`)) return;
    try {
      await api.delete(`/reservations/${resv.id}`);
      toast.success('Reservation removed');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-bold text-navy-900 tracking-tight">
            Reservation & Stay Operations
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Book suites, track in-house guests, and manage check-in/out workflows.
          </p>
        </div>

        <button
          onClick={openNewBooking}
          className="px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gold-600" />
          <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-cream-50/50 focus:outline-none focus:ring-1 focus:ring-gold-500 font-medium"
          >
            <option value="">All Bookings</option>
            <option value="confirmed">Confirmed (Upcoming)</option>
            <option value="checked_in">Checked In (Active In-House)</option>
            <option value="checked_out">Checked Out (Completed)</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {reservations.length} {reservations.length === 1 ? 'Booking' : 'Bookings'}
        </span>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-cream-100/70 border-b border-cream-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Booking Ref</th>
                <th className="py-3.5 px-4">Guest Info</th>
                <th className="py-3.5 px-4">Rooms</th>
                <th className="py-3.5 px-4">Stay Duration</th>
                <th className="py-3.5 px-4">Est. Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : reservations.length > 0 ? (
                reservations.map((r) => {
                  const isConf = r.status === 'confirmed';
                  const isIn = r.status === 'checked_in';
                  const isOut = r.status === 'checked_out';

                  return (
                    <tr key={r.id} className="hover:bg-cream-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-navy-900">
                          #GH-RES-{String(r.id).padStart(4, '0')}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          By {r.created_by_name?.split(' ')[0] || 'Staff'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 text-sm">{r.guest_name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{r.guest_phone}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {r.rooms?.map((rm) => (
                            <span
                              key={rm.id}
                              className="px-2 py-0.5 rounded bg-cream-200 text-navy-900 font-mono font-semibold text-[11px]"
                            >
                              Room {rm.room_number}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-700">
                            {r.check_in_date} → {r.check_out_date}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {r.nights} {r.nights === 1 ? 'Night' : 'Nights'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-navy-900 text-sm">
                        ₹{Number(r.estimatedTotal).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isConf
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isIn
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isOut
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isConf && (
                            <button
                              onClick={() => handleCheckIn(r)}
                              title="Check-In Guest"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>Check In</span>
                            </button>
                          )}
                          {isIn && (
                            <button
                              onClick={() => handleCheckOut(r)}
                              title="Check-Out Guest & Release Rooms"
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Check Out</span>
                            </button>
                          )}
                          {hasRole('admin') && (
                            <button
                              onClick={() => handleDelete(r)}
                              title="Delete reservation"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No reservations recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Reservation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Room Reservation"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Guest *
            </label>
            <select
              required
              value={formData.guest_id}
              onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none bg-white font-medium"
            >
              <option value="">-- Choose Registered Guest --</option>
              {guests.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Check-In Date *
              </label>
              <input
                type="date"
                required
                value={formData.check_in_date}
                onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Check-Out Date *
              </label>
              <input
                type="date"
                required
                value={formData.check_out_date}
                onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Assign Rooms * ({formData.room_ids.length} selected)
              </label>
              <span className="text-[11px] text-slate-400">Click to toggle</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl">
              {availableRooms.map((rm) => {
                const selected = formData.room_ids.includes(rm.id);
                return (
                  <button
                    type="button"
                    key={rm.id}
                    onClick={() => handleRoomToggle(rm.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-gold-500 bg-gold-50 text-navy-900 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Room {rm.room_number}</span>
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 text-gold-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{rm.type_name}</p>
                    <p className="text-[11px] font-semibold text-slate-800 mt-1">
                      ₹{rm.base_price}/nt
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Booking Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none bg-white font-medium"
            >
              <option value="confirmed">Confirmed (Guest arriving later)</option>
              <option value="checked_in">Immediate Check-In (Guest at desk)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors shadow-sm"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
