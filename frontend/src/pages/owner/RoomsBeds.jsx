import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BedDouble,
  Plus,
  Trash2,
  Edit,
  User,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Wrench,
  CheckCircle,
  XCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Loader } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const RoomsBeds = () => {
  const { selectedBuildingId } = useOutletContext();
  const { toast } = useNotification();
  const [layoutData, setLayoutData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedBed, setSelectedBed] = useState(null);
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isAddBedOpen, setIsAddBedOpen] = useState(false);
  const [selectedRoomForBed, setSelectedRoomForBed] = useState(null);

  // New room form state
  const [newRoom, setNewRoom] = useState({
    floorId: '',
    roomNumber: '',
    roomType: 'double',
    capacity: 2,
    baseRent: 9500,
    attachedBathroom: true,
    acAvailable: false,
    hasBalcony: false,
  });

  // New floor form state
  const [newFloor, setNewFloor] = useState({
    floorNumber: 4,
    name: '3rd Floor',
    description: '',
  });

  // New bed form state
  const [newBed, setNewBed] = useState({
    bedNumber: 'Bed C',
    monthlyRent: 9500,
  });

  const fetchLayout = async () => {
    if (!selectedBuildingId) return;
    setLoading(true);
    try {
      const res = await api.get(`/rooms/layout/${selectedBuildingId}`);
      if (res.data.success) {
        setLayoutData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load building room layout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayout();
  }, [selectedBuildingId]);

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setIsBedModalOpen(true);
  };

  const handleUpdateBedStatus = async (status, maintenanceReason = '') => {
    if (!selectedBed) return;
    try {
      const res = await api.put(`/rooms/bed/${selectedBed._id}/status`, {
        status,
        maintenanceReason,
      });
      if (res.data.success) {
        toast.success(`Bed marked as ${status}`);
        setIsBedModalOpen(false);
        fetchLayout();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update bed status');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/rooms/room', {
        ...newRoom,
        buildingId: selectedBuildingId,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setIsAddRoomOpen(false);
        setNewRoom({
          floorId: '',
          roomNumber: '',
          roomType: 'double',
          capacity: 2,
          baseRent: 9500,
          attachedBathroom: true,
          acAvailable: false,
          hasBalcony: false,
        });
        fetchLayout();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add room');
    }
  };

  const handleCreateFloor = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/rooms/floor', {
        ...newFloor,
        buildingId: selectedBuildingId,
      });
      if (res.data.success) {
        toast.success('Floor added successfully');
        setIsAddFloorOpen(false);
        fetchLayout();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add floor');
    }
  };

  const handleCreateBed = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/rooms/bed', {
        roomId: selectedRoomForBed._id,
        bedNumber: newBed.bedNumber,
        monthlyRent: newBed.monthlyRent,
      });
      if (res.data.success) {
        toast.success('Bed added to room');
        setIsAddBedOpen(false);
        fetchLayout();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add bed');
    }
  };

  const handleDeleteRoom = async (roomId, roomNumber) => {
    if (!window.confirm(`Are you sure you want to delete empty Room ${roomNumber}?`)) return;
    try {
      const res = await api.delete(`/rooms/room/${roomId}`);
      if (res.data.success) {
        toast.success('Room deleted');
        fetchLayout();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  if (loading) {
    return <Loader message="Rendering visual building and bed layout..." />;
  }

  const floors = layoutData?.layout || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Visual Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BedDouble className="w-6 h-6 text-brand-600" />
            <span>Interactive Room & Bed Layout</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visual building floor plan. Click on any bed to view tenant allocation or update maintenance status.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-600 ring-2 ring-emerald-100" />
            <span className="text-slate-700">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-rose-600 ring-2 ring-rose-100" />
            <span className="text-slate-700">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-400 border border-amber-500 ring-2 ring-amber-100" />
            <span className="text-slate-700">Maintenance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-300 border border-slate-400" />
            <span className="text-slate-700">Inactive</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddFloorOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Add Floor</span>
          </button>
          <button
            onClick={() => {
              if (floors.length > 0) {
                setNewRoom(prev => ({ ...prev, floorId: floors[0]._id }));
              }
              setIsAddRoomOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* Building Layout Plan Floors */}
      {floors.length === 0 ? (
        <EmptyState
          title="No floors configured yet"
          description="Create your first floor and rooms to start allocating beds to tenants."
          action={
            <button
              onClick={() => setIsAddFloorOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
            >
              Add Floor Now
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {floors.map((fl) => (
            <div
              key={fl._id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm overflow-hidden"
            >
              {/* Floor Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                    {fl.floorNumber}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{fl.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      {fl.rooms?.length || 0} Rooms • {fl.rooms?.reduce((acc, r) => acc + (r.beds?.length || 0), 0)} Total Beds
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  Floor {fl.floorNumber}
                </span>
              </div>

              {/* Rooms in Floor */}
              {fl.rooms?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No rooms added to this floor yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {fl.rooms.map((rm) => (
                    <div
                      key={rm._id}
                      className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                    >
                      {/* Room Details Bar */}
                      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200/60">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              Room {rm.roomNumber}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                              {rm.roomType?.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {formatCurrency(rm.baseRent)} / month
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedRoomForBed(rm);
                              setNewBed({
                                bedNumber: `Bed ${String.fromCharCode(65 + rm.beds.length)}`,
                                monthlyRent: rm.baseRent,
                              });
                              setIsAddBedOpen(true);
                            }}
                            title="Add Bed to this Room"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {rm.occupiedBeds === 0 && (
                            <button
                              onClick={() => handleDeleteRoom(rm._id, rm.roomNumber)}
                              title="Delete Empty Room"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Beds Grid for Room */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 mt-1">
                        {rm.beds.map((bed) => {
                          const isOccupied = bed.status === 'occupied';
                          const isAvailable = bed.status === 'available';
                          const isMaintenance = bed.status === 'maintenance';

                          return (
                            <button
                              key={bed._id}
                              onClick={() => handleBedClick(bed)}
                              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between min-h-[76px] ${
                                isOccupied
                                  ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/60'
                                  : isAvailable
                                  ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/60'
                                  : isMaintenance
                                  ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60'
                                  : 'bg-slate-100 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-bold text-xs text-slate-900 group-hover:underline">
                                  {bed.bedNumber}
                                </span>
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isOccupied
                                      ? 'bg-rose-500'
                                      : isAvailable
                                      ? 'bg-emerald-500'
                                      : isMaintenance
                                      ? 'bg-amber-500'
                                      : 'bg-slate-400'
                                  }`}
                                />
                              </div>

                              <div className="mt-1">
                                {isOccupied ? (
                                  <div>
                                    <p className="text-[11px] font-semibold text-rose-900 truncate">
                                      {bed.currentTenant?.name || 'Occupied'}
                                    </p>
                                    <p className="text-[10px] text-rose-700/80 truncate">
                                      {bed.currentTenant?.phone || ''}
                                    </p>
                                  </div>
                                ) : isMaintenance ? (
                                  <p className="text-[10px] font-medium text-amber-800 line-clamp-1">
                                    {bed.maintenanceReason || 'In Maintenance'}
                                  </p>
                                ) : (
                                  <p className="text-[11px] font-semibold text-emerald-800">
                                    Vacant
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bed Details / Tenant Profile / Status Modal */}
      <Modal
        isOpen={isBedModalOpen}
        onClose={() => setIsBedModalOpen(false)}
        title={`${selectedBed?.bedNumber} Information`}
        subtitle={`Room allocation & status`}
      >
        {selectedBed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">
                  Current Status
                </span>
                <div className="mt-1">
                  <Badge status={selectedBed.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">
                  Monthly Rent
                </span>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(selectedBed.monthlyRent)}
                </p>
              </div>
            </div>

            {/* Tenant details if occupied */}
            {selectedBed.status === 'occupied' && selectedBed.currentTenant && (
              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedBed.currentTenant.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={selectedBed.currentTenant.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-rose-200"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {selectedBed.currentTenant.name}
                    </h4>
                    <p className="text-xs text-slate-500">Resident Tenant</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-rose-200/60">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-rose-500" />
                    <span>{selectedBed.currentTenant.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-rose-500" />
                    <span className="truncate">{selectedBed.currentTenant.email}</span>
                  </div>
                  {selectedBed.currentAllocation && (
                    <div className="flex items-center gap-1.5 text-slate-600 col-span-2">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      <span>
                        Staying since: {formatDate(selectedBed.currentAllocation.joiningDate)} (Rent due on day {selectedBed.currentAllocation.rentDueDay})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions to Change Status */}
            {selectedBed.status !== 'occupied' && (
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                  Update Bed Condition
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateBedStatus('available')}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Available</span>
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Enter maintenance reason (e.g. Broken cot, painting, cleaning):');
                      if (reason !== null) {
                        handleUpdateBedStatus('maintenance', reason);
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Set Maintenance</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Room Modal */}
      <Modal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        title="Add New Room"
        subtitle="Specify room capacity and rent"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Select Floor
            </label>
            <select
              required
              value={newRoom.floorId}
              onChange={(e) => setNewRoom({ ...newRoom, floorId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select a Floor</option>
              {floors.map((fl) => (
                <option key={fl._id} value={fl._id}>
                  {fl.name} (Floor {fl.floorNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Room Number
              </label>
              <input
                type="text"
                required
                value={newRoom.roomNumber}
                onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                placeholder="e.g. 104"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Sharing Type
              </label>
              <select
                value={newRoom.roomType}
                onChange={(e) => {
                  const type = e.target.value;
                  const cap = type === 'single' ? 1 : type === 'double' ? 2 : type === 'triple' ? 3 : 4;
                  setNewRoom({ ...newRoom, roomType: type, capacity: cap });
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="single">Single Sharing (1 Bed)</option>
                <option value="double">Double Sharing (2 Beds)</option>
                <option value="triple">Triple Sharing (3 Beds)</option>
                <option value="four_sharing">Four Sharing (4 Beds)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Bed Capacity
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Base Monthly Rent (₹)
              </label>
              <input
                type="number"
                required
                value={newRoom.baseRent}
                onChange={(e) => setNewRoom({ ...newRoom, baseRent: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newRoom.attachedBathroom}
                onChange={(e) => setNewRoom({ ...newRoom, attachedBathroom: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Attached Bathroom</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newRoom.acAvailable}
                onChange={(e) => setNewRoom({ ...newRoom, acAvailable: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>AC Room</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all mt-4"
          >
            Create Room & Generate Beds
          </button>
        </form>
      </Modal>

      {/* Add Floor Modal */}
      <Modal
        isOpen={isAddFloorOpen}
        onClose={() => setIsAddFloorOpen(false)}
        title="Add New Floor"
      >
        <form onSubmit={handleCreateFloor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Floor Number
            </label>
            <input
              type="number"
              required
              value={newFloor.floorNumber}
              onChange={(e) => setNewFloor({ ...newFloor, floorNumber: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Floor Name / Label
            </label>
            <input
              type="text"
              required
              value={newFloor.name}
              onChange={(e) => setNewFloor({ ...newFloor, name: e.target.value })}
              placeholder="e.g. 3rd Floor"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all"
          >
            Create Floor
          </button>
        </form>
      </Modal>

      {/* Add Bed Modal */}
      <Modal
        isOpen={isAddBedOpen}
        onClose={() => setIsAddBedOpen(false)}
        title={`Add Bed to Room ${selectedRoomForBed?.roomNumber}`}
      >
        <form onSubmit={handleCreateBed} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Bed Label / Number
            </label>
            <input
              type="text"
              required
              value={newBed.bedNumber}
              onChange={(e) => setNewBed({ ...newBed, bedNumber: e.target.value })}
              placeholder="e.g. Bed C"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Monthly Rent for this Bed (₹)
            </label>
            <input
              type="number"
              required
              value={newBed.monthlyRent}
              onChange={(e) => setNewBed({ ...newBed, monthlyRent: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all"
          >
            Add Bed
          </button>
        </form>
      </Modal>
    </div>
  );
};
