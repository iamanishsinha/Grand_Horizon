import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  BedDouble,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Wrench,
  Layers,
  Sparkles,
  IndianRupee,
  Users,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Rooms() {
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'types'
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');

  // Modals
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  // Room Form
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    room_type_id: '',
    status: 'available',
    floor: '1st Floor'
  });

  // Category Form
  const [typeForm, setTypeForm] = useState({
    name: '',
    base_price: '',
    capacity: 2,
    description: ''
  });

  const { hasRole } = useAuth();

  const fetchData = async () => {
    try {
      const [rRes, tRes] = await Promise.all([
        api.get('/rooms', { params: { status: statusFilter, floor: floorFilter } }),
        api.get('/room-types')
      ]);
      setRooms(rRes.data);
      setRoomTypes(tRes.data);
    } catch (err) {
      toast.error('Failed to load room data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, floorFilter]);

  // Open Room Modal
  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      room_number: '',
      room_type_id: roomTypes[0]?.id || '',
      status: 'available',
      floor: '1st Floor'
    });
    setRoomModalOpen(true);
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      room_number: room.room_number,
      room_type_id: room.room_type_id,
      status: room.status,
      floor: room.floor
    });
    setRoomModalOpen(true);
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, roomForm);
        toast.success(`Room ${roomForm.room_number} updated`);
      } else {
        await api.post('/rooms', roomForm);
        toast.success(`Room ${roomForm.room_number} created`);
      }
      setRoomModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save room');
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Are you sure you want to delete Room ${room.room_number}?`)) return;
    try {
      await api.delete(`/rooms/${room.id}`);
      toast.success(`Room ${room.room_number} removed`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete room');
    }
  };

  // Category handlers
  const openAddType = () => {
    setEditingType(null);
    setTypeForm({ name: '', base_price: '', capacity: 2, description: '' });
    setTypeModalOpen(true);
  };

  const openEditType = (type) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      base_price: type.base_price,
      capacity: type.capacity,
      description: type.description || ''
    });
    setTypeModalOpen(true);
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await api.put(`/room-types/${editingType.id}`, typeForm);
        toast.success(`Category "${typeForm.name}" updated`);
      } else {
        await api.post('/room-types', typeForm);
        toast.success(`Category "${typeForm.name}" created`);
      }
      setTypeModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save category');
    }
  };

  const handleDeleteType = async (type) => {
    if (!window.confirm(`Delete category "${type.name}"?`)) return;
    try {
      await api.delete(`/room-types/${type.id}`);
      toast.success(`Category deleted`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-bold text-navy-900 tracking-tight">
            Room Inventory & Categories
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage rooms, nightly tariffs, status availability, and suite tiers.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-cream-200/70 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'rooms'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'types'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            Categories & Pricing ({roomTypes.length})
          </button>
        </div>
      </div>

      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5 text-gold-600" />
                <span>Filter by:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-cream-50/50 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">All Statuses</option>
                <option value="available">Available Only</option>
                <option value="occupied">Occupied Only</option>
                <option value="maintenance">Under Maintenance</option>
              </select>

              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-cream-50/50 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">All Floors</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
              </select>
            </div>

            {hasRole('admin') && (
              <button
                onClick={openAddRoom}
                className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-gold-400" />
                <span>Add Room</span>
              </button>
            )}
          </div>

          {/* Rooms Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rooms.map((room) => {
              const isAvail = room.status === 'available';
              const isOcc = room.status === 'occupied';
              const isMaint = room.status === 'maintenance';

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Top color indicator bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      isAvail ? 'bg-emerald-500' : isOcc ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                  ></div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-serif-heading text-xl font-bold text-navy-900 tracking-wide">
                        Room {room.room_number}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isAvail
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isOcc
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {room.status}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {room.type_name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {room.floor} • Capacity: {room.capacity} Guests
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Tariff</span>
                      <p className="font-bold text-navy-900 text-sm">
                        ₹{room.base_price?.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] font-normal text-slate-400">/ night</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {hasRole('admin', 'receptionist') && (
                        <button
                          onClick={() => openEditRoom(room)}
                          title="Change status or edit"
                          className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {hasRole('admin') && (
                        <button
                          onClick={() => handleDeleteRoom(room)}
                          title="Delete room"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Room Categories Tab */}
      {activeTab === 'types' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Categories define standard nightly rates and maximum guest capacity.
            </p>
            {hasRole('admin') && (
              <button
                onClick={openAddType}
                className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-gold-400" />
                <span>Add Category</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roomTypes.map((type) => (
              <div
                key={type.id}
                className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif-heading text-lg font-bold text-navy-900">
                        {type.name}
                      </h3>
                      <p className="text-xs text-gold-600 font-semibold mt-0.5">
                        {type.room_count} {type.room_count === 1 ? 'Room' : 'Rooms'} assigned
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    {type.description || 'Standard suite furnishings and hotel amenities.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Base Price
                    </span>
                    <p className="font-extrabold text-navy-900 text-base">
                      ₹{type.base_price?.toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-slate-400">/ night</span>
                    </p>
                  </div>

                  {hasRole('admin') && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditType(type)}
                        className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteType(type)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Add/Edit Modal */}
      <Modal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        title={editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Room'}
      >
        <form onSubmit={handleRoomSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Room Number *
            </label>
            <input
              type="text"
              required
              disabled={editingRoom && !hasRole('admin')}
              value={roomForm.room_number}
              onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
              placeholder="e.g. 105"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Room Category *
              </label>
              <select
                disabled={editingRoom && !hasRole('admin')}
                value={roomForm.room_type_id}
                onChange={(e) => setRoomForm({ ...roomForm, room_type_id: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none bg-white disabled:bg-slate-100"
              >
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (₹{t.base_price}/nt)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Floor *
              </label>
              <select
                disabled={editingRoom && !hasRole('admin')}
                value={roomForm.floor}
                onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none bg-white disabled:bg-slate-100"
              >
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Availability Status *
            </label>
            <select
              value={roomForm.status}
              onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none bg-white font-semibold"
            >
              <option value="available">Available for Booking</option>
              <option value="occupied">Occupied (Guest In-House)</option>
              <option value="maintenance">Under Maintenance / Cleaning</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRoomModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors shadow-sm"
            >
              {editingRoom ? 'Update Room' : 'Save Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Add/Edit Modal */}
      <Modal
        isOpen={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        title={editingType ? `Edit Category: ${editingType.name}` : 'Add Room Category'}
      >
        <form onSubmit={handleTypeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category Title *
            </label>
            <input
              type="text"
              required
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              placeholder="e.g. Executive Sea View Suite"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Base Tariff (₹ per Night) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="50"
                value={typeForm.base_price}
                onChange={(e) => setTypeForm({ ...typeForm, base_price: e.target.value })}
                placeholder="e.g. 3500"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Guest Capacity *
              </label>
              <input
                type="number"
                required
                min="1"
                max="8"
                value={typeForm.capacity}
                onChange={(e) => setTypeForm({ ...typeForm, capacity: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description & Amenities
            </label>
            <textarea
              rows={2}
              value={typeForm.description}
              onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
              placeholder="Features, bed size, view, mini-bar, etc."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTypeModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors shadow-sm"
            >
              {editingType ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
