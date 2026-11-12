import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BedDouble,
  CalendarCheck,
  Users,
  IndianRupee,
  Clock,
  TrendingUp,
  Building,
  ArrowUpRight,
  Plus,
  Receipt,
  Terminal,
  Download,
  Star,
  CheckCircle2,
  Sparkles,
  MapPin
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Loading Grand Horrizon Live Stats...</p>
        </div>
      </div>
    );
  }

  const roomStats = data?.roomStats || { total: 0, available: 0, occupied: 0, maintenance: 0 };
  const revStats = data?.revenueStats || { billed: 0, collected: 0, outstanding: 0 };
  const resvStats = data?.reservationStats || { total: 0, confirmed: 0, active: 0, completed: 0, cancelled: 0 };

  const occupancyRate = roomStats.total > 0
    ? Math.round((roomStats.occupied / roomStats.total) * 100)
    : 0;

  // Pie chart data for room occupancy
  const occupancyPieData = [
    { name: 'Available', value: roomStats.available, color: '#10B981' },
    { name: 'Occupied', value: roomStats.occupied, color: '#3B82F6' },
    { name: 'Maintenance', value: roomStats.maintenance, color: '#F59E0B' }
  ].filter(d => d.value > 0);

  // Bar chart data for room types
  const barData = data?.roomTypeDistribution?.map(t => ({
    name: t.category.split(' ')[0], // short name
    Total: t.total,
    Available: t.available || 0,
    Occupied: t.occupied || 0
  })) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Grand Luxury Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white p-7 shadow-xl border border-gold-500/30">
        {/* Decorative ambient elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-gold-400/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-1.5 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Heritage Suite & Ocean Promenade</span>
              <span className="text-white/40">•</span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-gold-400" />
                ))}
              </div>
            </div>

            <h2 className="font-serif-heading text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Welcome to Grand Horrizon, {user?.full_name?.split(' ')[0] || 'Administrator'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Operating on Plot 24, Demo Avenue, White Town, Puducherry. All reservation transactions and tariffs are committed permanently to SQLite.
            </p>
          </div>

          {/* Occupancy Rate Metric Pill */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0">
            <div>
              <p className="text-[10px] text-gold-400 uppercase font-bold tracking-wider">Live Occupancy</p>
              <p className="text-2xl font-extrabold text-white mt-0.5">{occupancyRate}%</p>
              <p className="text-[10px] text-slate-300">{roomStats.occupied} of {roomStats.total} suites occupied</p>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-gold-500/30 border-t-gold-400 flex items-center justify-center font-bold text-xs text-gold-300">
              {roomStats.available} free
            </div>
          </div>
        </div>

        {/* Quick Action Buttons Row */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold text-gold-400/80 uppercase tracking-wider mr-1">
            Quick Actions:
          </span>

          {hasRole('admin', 'receptionist') && (
            <button
              onClick={() => navigate('/reservations')}
              className="px-3.5 py-1.5 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Reservation</span>
            </button>
          )}

          {hasRole('admin', 'receptionist') && (
            <button
              onClick={() => navigate('/guests')}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/15 transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-gold-400" />
              <span>Register Guest</span>
            </button>
          )}

          {hasRole('admin', 'accountant') && (
            <button
              onClick={() => navigate('/billing')}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/15 transition-all flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5 text-gold-400" />
              <span>View Invoices</span>
            </button>
          )}

          {hasRole('admin') && (
            <button
              onClick={() => navigate('/database')}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/15 transition-all flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5 text-gold-400" />
              <span>SQL Console</span>
            </button>
          )}

          <button
            onClick={fetchStats}
            className="ml-auto px-3 py-1.5 text-xs text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            <Clock className="w-3 h-3 text-gold-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total & Available Rooms */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFD0] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suites Inventory</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-navy-900">{roomStats.total}</span>
            <span className="text-xs font-medium text-slate-500">Rooms in SQLite</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {roomStats.available} Available
            </span>
            <span className="text-blue-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {roomStats.occupied} Occupied
            </span>
          </div>
        </div>

        {/* Registered Guests */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFD0] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guest Directory</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-navy-900">{data?.guestsCount || 0}</span>
            <span className="text-xs font-medium text-slate-500">Registered Profiles</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Verified identities</span>
            <span className="text-gold-600 font-semibold font-mono">100% Persisted</span>
          </div>
        </div>

        {/* Reservations */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFD0] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reservations</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-navy-900">{resvStats.total}</span>
            <span className="text-xs font-medium text-slate-500">Bookings Logged</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-blue-600 font-medium">{resvStats.active} Active In-House</span>
            <span className="text-emerald-600 font-medium">{resvStats.confirmed} Confirmed</span>
          </div>
        </div>

        {/* Revenue Collected */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFD0] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-500 to-amber-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue Collected</span>
            <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-navy-900">
              ₹{Number(revStats.collected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Due: ₹{Number(revStats.outstanding).toLocaleString('en-IN')}</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Real-time
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Type Inventory Distribution */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E8DFD0] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif-heading text-base font-bold text-navy-900">
                Suite Inventory & Distribution by Category
              </h3>
              <p className="text-xs text-slate-500">Live breakdown of room availability by suite tier</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B132B',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
                  }}
                />
                <Bar dataKey="Total" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Available" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Occupied" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DFD0] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif-heading text-base font-bold text-navy-900">
              Live Room Occupancy
            </h3>
            <p className="text-xs text-slate-500">Current status of all rooms</p>
          </div>
          <div className="h-52 w-full my-auto flex items-center justify-center">
            {occupancyPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {occupancyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No room data recorded</p>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-around text-center text-xs">
            <div>
              <p className="text-slate-400">Available</p>
              <p className="font-bold text-emerald-600">{roomStats.available}</p>
            </div>
            <div>
              <p className="text-slate-400">Occupied</p>
              <p className="font-bold text-blue-600">{roomStats.occupied}</p>
            </div>
            <div>
              <p className="text-slate-400">Maintenance</p>
              <p className="font-bold text-amber-600">{roomStats.maintenance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DFD0] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif-heading text-base font-bold text-navy-900">
              Recent Reservations
            </h3>
            <span className="text-xs text-gold-600 font-mono font-semibold">SQL JOIN Query</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Guest</th>
                  <th className="pb-3">Rooms</th>
                  <th className="pb-3">Dates</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.recentReservations?.length > 0 ? (
                  data.recentReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F9F6F0] transition-colors">
                      <td className="py-3">
                        <p className="font-semibold text-slate-800">{r.guest_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.guest_phone}</p>
                      </td>
                      <td className="py-3 font-medium text-slate-600">
                        {r.assigned_rooms || 'None'}
                      </td>
                      <td className="py-3 text-slate-500">
                        {r.check_in_date} → {r.check_out_date}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            r.status === 'confirmed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : r.status === 'checked_in'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.status === 'checked_out'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No reservations recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DFD0] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif-heading text-base font-bold text-navy-900">
              Recent Payment Transactions
            </h3>
            <span className="text-xs text-gold-600 font-mono font-semibold">SQL Audit Trail</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 text-right">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.recentPayments?.length > 0 ? (
                  data.recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F9F6F0] transition-colors">
                      <td className="py-3">
                        <span className="font-mono font-semibold text-slate-800">{p.invoice_number}</span>
                        <p className="text-[10px] text-slate-400">{p.paid_at}</p>
                      </td>
                      <td className="py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 uppercase">
                          {p.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-navy-900">
                        ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right text-slate-600 font-medium">
                        {p.recorded_by_name || 'System'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No payments recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
