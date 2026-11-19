import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Layers,
  BedDouble,
  Users,
  Edit,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal.jsx';
import { Loader } from '../../components/common/Loader.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const Buildings = () => {
  const { toast } = useNotification();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newBuilding, setNewBuilding] = useState({
    name: '',
    street: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    contactNumber: '',
    totalFloors: '',
    description: '',
    genderAllowed: 'co-living',
  });

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/buildings');
      if (res.data.success) {
        setBuildings(res.data.buildings || []);
      }
    } catch (err) {
      toast.error('Failed to load buildings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleCreateBuilding = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/buildings', {
        name: newBuilding.name,
        address: {
          street: newBuilding.street,
          area: newBuilding.area,
          city: newBuilding.city,
          state: newBuilding.state,
          pincode: newBuilding.pincode,
        },
        contactNumber: newBuilding.contactNumber,
        totalFloors: Number(newBuilding.totalFloors),
        description: newBuilding.description,
        genderAllowed: newBuilding.genderAllowed,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsAddModalOpen(false);
        fetchBuildings();
        window.dispatchEvent(new CustomEvent('pgmate_buildings_updated'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create building');
    }
  };

  if (loading) {
    return <Loader message="Loading buildings directory..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-600" />
            <span>Property & Building Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage multiple PG branches, floor structures, address details, and contact numbers under your account.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Building</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {buildings.map((b) => (
          <div
            key={b._id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{b.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                    <span>
                      {b.address?.street}, {b.address?.area}, {b.address?.city} - {b.address?.pincode}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {b.genderAllowed}
                </span>
              </div>

              {b.description && (
                <p className="text-xs text-slate-600 mt-3 line-clamp-2">{b.description}</p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 mt-4 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Floors</span>
                  <span className="text-sm font-bold text-slate-800">{b.totalFloors}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Beds</span>
                  <span className="text-sm font-bold text-slate-800">{b.stats?.bedCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Occupied</span>
                  <span className="text-sm font-bold text-emerald-600">{b.stats?.occupiedCount || 0}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{b.contactNumber}</span>
              </div>
              <span className="font-semibold text-brand-600">
                {b.stats?.occupancyRate || 0}% Occupancy
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Building Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New PG Building"
        subtitle="Adds a property and initializes floor plans and weekly meal schedules"
      >
        <form onSubmit={handleCreateBuilding} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Building Name
            </label>
            <input
              type="text"
              required
              value={newBuilding.name}
              onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
              placeholder="e.g. Stanza Orchid House"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Street Address
              </label>
              <input
                type="text"
                required
                value={newBuilding.street}
                onChange={(e) => setNewBuilding({ ...newBuilding, street: e.target.value })}
                placeholder="Plot 42, 2nd Main"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Area / Locality
              </label>
              <input
                type="text"
                required
                value={newBuilding.area}
                onChange={(e) => setNewBuilding({ ...newBuilding, area: e.target.value })}
                placeholder="Koramangala"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={newBuilding.city}
                onChange={(e) => setNewBuilding({ ...newBuilding, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                State
              </label>
              <input
                type="text"
                required
                value={newBuilding.state}
                onChange={(e) => setNewBuilding({ ...newBuilding, state: e.target.value })}
                placeholder="e.g. Karnataka"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Pincode
              </label>
              <input
                type="text"
                required
                value={newBuilding.pincode}
                onChange={(e) => setNewBuilding({ ...newBuilding, pincode: e.target.value })}
                placeholder="e.g. 560034"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Floors Count
              </label>
              <input
                type="number"
                min="1"
                max="20"
                required
                placeholder="e.g. 3"
                value={newBuilding.totalFloors}
                onChange={(e) => setNewBuilding({ ...newBuilding, totalFloors: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={newBuilding.contactNumber}
                onChange={(e) => setNewBuilding({ ...newBuilding, contactNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Gender Allowed
              </label>
              <select
                value={newBuilding.genderAllowed}
                onChange={(e) => setNewBuilding({ ...newBuilding, genderAllowed: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              >
                <option value="co-living">Co-Living</option>
                <option value="boys">Boys Only</option>
                <option value="girls">Girls Only</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all mt-4"
          >
            Create Building & Initial Floors
          </button>
        </form>
      </Modal>
    </div>
  );
};
