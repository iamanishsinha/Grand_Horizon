import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    id_proof_type: 'Aadhaar / ID',
    id_proof_number: '',
    address: ''
  });

  const { hasRole } = useAuth();

  const fetchGuests = async () => {
    try {
      const res = await api.get('/guests', { params: { search } });
      setGuests(res.data);
    } catch (err) {
      toast.error('Failed to load guest list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [search]);

  const openAddModal = () => {
    setEditingGuest(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      id_proof_type: 'Aadhaar / ID',
      id_proof_number: '',
      address: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (guest) => {
    setEditingGuest(guest);
    setFormData({
      name: guest.name || '',
      email: guest.email || '',
      phone: guest.phone || '',
      id_proof_type: guest.id_proof_type || 'Aadhaar / ID',
      id_proof_number: guest.id_proof_number || '',
      address: guest.address || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGuest) {
        await api.put(`/guests/${editingGuest.id}`, formData);
        toast.success(`Guest profile updated successfully`);
      } else {
        await api.post('/guests', formData);
        toast.success(`New guest "${formData.name}" registered`);
      }
      setModalOpen(false);
      fetchGuests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/guests/${deleteTarget.id}`);
      toast.success(`Guest "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchGuests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete guest');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-bold text-navy-900 tracking-tight">
            Guest Management Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Maintain guest records, identification documents, and stay histories in SQLite.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-gold-400" />
          <span>Register New Guest</span>
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests by name, phone (+91), email, or ID document..."
            className="w-full pl-10 pr-4 py-2 bg-cream-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all text-slate-800"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium px-2">
          {guests.length} {guests.length === 1 ? 'Guest' : 'Guests'} found
        </span>
      </div>

      {/* Guest Records Table */}
      <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-cream-100/70 border-b border-cream-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Guest Details</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Identity Document</th>
                <th className="py-3.5 px-4">Permanent Address</th>
                <th className="py-3.5 px-4 text-center">Stays</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : guests.length > 0 ? (
                guests.map((g) => (
                  <tr key={g.id} className="hover:bg-cream-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-800 font-bold flex items-center justify-center shrink-0">
                          {g.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{g.name}</p>
                          <p className="text-[10px] text-slate-400">ID #{g.id} • Registered {g.created_at?.slice(0, 10)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{g.phone}</span>
                        </div>
                        {g.email && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{g.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <CreditCard className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                        <div>
                          <p className="font-medium">{g.id_proof_type}</p>
                          <p className="font-mono text-[11px] text-slate-500">{g.id_proof_number || 'Not provided'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{g.address || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cream-200 text-navy-900">
                        {g.reservation_count} Bookings
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(g)}
                          title="Edit guest profile"
                          className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {hasRole('admin') && (
                          <button
                            onClick={() => setDeleteTarget(g)}
                            title="Delete guest record (Admin)"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No guest records matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGuest ? `Edit Guest: ${editingGuest.name}` : 'Register New Guest'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Varma"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98401 23456"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="guest@example.com"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Identity Document Type
              </label>
              <select
                value={formData.id_proof_type}
                onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none bg-white"
              >
                <option value="Aadhaar / ID">Aadhaar Card / National ID</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Document Number
              </label>
              <input
                type="text"
                value={formData.id_proof_number}
                onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                placeholder="e.g. 5421 8901 2345 / Z8493012"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Permanent Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="House/Street, City, State, PIN"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors shadow-sm"
            >
              {editingGuest ? 'Save Changes' : 'Register Guest'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs leading-relaxed">
              Are you sure you want to delete the record for <strong>{deleteTarget?.name}</strong>? This action will permanently remove this record from the SQLite database.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
