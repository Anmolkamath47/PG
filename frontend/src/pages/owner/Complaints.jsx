import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  CheckCircle,
  Clock,
  Wrench,
  XCircle,
  MessageSquare,
  User,
  Filter,
  Image as ImageIcon,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Loader } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const Complaints = () => {
  const { selectedBuildingId } = useOutletContext();
  const { toast } = useNotification();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  // Update modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('in_progress');
  const [ownerResponse, setOwnerResponse] = useState('');
  const [assignedTechnician, setAssignedTechnician] = useState('');
  const [technicianPhone, setTechnicianPhone] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints', {
        params: {
          buildingId: selectedBuildingId,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          search: search || undefined,
        },
      });
      if (res.data.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [selectedBuildingId, statusFilter, categoryFilter]);

  const handleOpenUpdate = (comp) => {
    setSelectedComplaint(comp);
    setUpdateStatus(comp.status);
    setOwnerResponse(comp.ownerResponse || '');
    setAssignedTechnician(comp.assignedTo?.name || '');
    setTechnicianPhone(comp.assignedTo?.phone || '');
    setIsUpdateModalOpen(true);
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);
    try {
      const res = await api.put(`/complaints/${selectedComplaint._id}/status`, {
        status: updateStatus,
        ownerResponse,
        assignedTo: {
          name: assignedTechnician,
          phone: technicianPhone,
          assignedAt: assignedTechnician ? new Date() : null,
        },
      });
      if (res.data.success) {
        toast.success('Complaint status and technician updated');
        setIsUpdateModalOpen(false);
        fetchComplaints();
      }
    } catch (err) {
      toast.error('Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-brand-600" />
            <span>Complaints & Maintenance Desk</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track resident issues, assign maintenance staff, and broadcast resolution status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">All Categories</option>
            <option value="water">Water</option>
            <option value="electricity">Electricity</option>
            <option value="wifi">Wi-Fi</option>
            <option value="ac">Air Conditioning</option>
            <option value="bathroom">Bathroom</option>
            <option value="cleaning">Cleaning</option>
            <option value="food">Food Quality</option>
          </select>
        </div>
      </div>

      {/* Complaints List Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <Loader message="Loading tickets..." />
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No complaints found"
            description="All maintenance tickets are resolved or no complaints match your filter."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((comp) => (
              <div key={comp._id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {comp.complaintNumber}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {comp.category}
                      </span>
                      <Badge status={comp.status} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{comp.title}</h3>
                  </div>

                  <button
                    onClick={() => handleOpenUpdate(comp)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Manage Ticket</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {comp.description}
                </p>

                {comp.ownerResponse && (
                  <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-200/60 text-xs">
                    <span className="font-bold text-brand-900 block mb-0.5">Manager Response:</span>
                    <p className="text-brand-800">{comp.ownerResponse}</p>
                    {comp.assignedTo?.name && (
                      <p className="text-[11px] text-brand-700 mt-1 font-semibold">
                        Assigned To: {comp.assignedTo.name} ({comp.assignedTo.phone})
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>
                    Reported by <strong className="text-slate-700">{comp.tenant?.name}</strong> (Room {comp.room?.roomNumber})
                  </span>
                  <span>{formatDateTime(comp.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage Ticket Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Update Ticket: ${selectedComplaint?.complaintNumber}`}
      >
        <form onSubmit={handleSaveUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Ticket Status
            </label>
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Manager Note / Status Update for Resident
            </label>
            <textarea
              rows="3"
              value={ownerResponse}
              onChange={(e) => setOwnerResponse(e.target.value)}
              placeholder="e.g. Electrician scheduled to visit tomorrow at 10 AM"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Assigned Staff Name
              </label>
              <input
                type="text"
                value={assignedTechnician}
                onChange={(e) => setAssignedTechnician(e.target.value)}
                placeholder="e.g. Ramesh Electrician"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Staff Phone
              </label>
              <input
                type="tel"
                value={technicianPhone}
                onChange={(e) => setTechnicianPhone(e.target.value)}
                placeholder="e.g. 9845012345"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all mt-4"
          >
            {updating ? 'Updating...' : 'Save & Notify Resident'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
