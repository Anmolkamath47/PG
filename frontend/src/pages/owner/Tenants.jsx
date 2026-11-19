import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  ArrowRightLeft,
  LogOut,
  Phone,
  Mail,
  Calendar,
  Building,
  Bed,
  CreditCard,
  Utensils,
  AlertTriangle,
  History,
  CheckCircle,
  FileDown,
  Copy,
  Check,
  FileText,
  KeyRound,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Loader } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import { generateCredentialsPdf } from '../../utils/generateCredentialsPdf.js';
import api from '../../services/api.js';

export const Tenants = () => {
  const { selectedBuildingId } = useOutletContext();
  const { toast } = useNotification();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Credentials Generated Modal State (for newly added tenant)
  const [credentialsModalData, setCredentialsModalData] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Add Tenant Modal State
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [newTenantData, setNewTenantData] = useState({
    name: '',
    email: '',
    phone: '',
    bedId: '',
    monthlyRent: 9500,
    securityDeposit: 15000,
    rentDueDay: 5,
    joiningDate: new Date().toISOString().split('T')[0],
    occupation: 'working_professional',
    companyOrCollege: '',
    emergencyContact: { name: '', relation: '', phone: '' },
  });

  // Full Details Modal State
  const [selectedTenantDetails, setSelectedTenantDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState('overview');

  // Transfer Bed Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetBedId, setTransferTargetBedId] = useState('');
  const [transferReason, setTransferReason] = useState('Resident requested room change');

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState('Completed stay period');
  const [refundDeposit, setRefundDeposit] = useState(true);

  const fetchTenants = async () => {
    if (!selectedBuildingId) return;
    setLoading(true);
    try {
      const res = await api.get('/tenants', {
        params: { buildingId: selectedBuildingId, status: statusFilter, search },
      });
      if (res.data.success) {
        setTenants(res.data.tenants || []);
      }
    } catch (err) {
      toast.error('Failed to load tenants list');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBeds = async () => {
    if (!selectedBuildingId) return;
    try {
      const res = await api.get(`/rooms/layout/${selectedBuildingId}`);
      if (res.data.success) {
        const bedsList = [];
        res.data.layout.forEach((fl) => {
          fl.rooms.forEach((rm) => {
            rm.beds.forEach((b) => {
              if (b.status === 'available') {
                bedsList.push({
                  bedId: b._id,
                  label: `Floor ${fl.floorNumber} • Room ${rm.roomNumber} - ${b.bedNumber} (₹${b.monthlyRent}/mo)`,
                  rent: b.monthlyRent,
                });
              }
            });
          });
        });
        setAvailableBeds(bedsList);
        if (bedsList.length > 0 && !newTenantData.bedId) {
          setNewTenantData((prev) => ({
            ...prev,
            bedId: bedsList[0].bedId,
            monthlyRent: bedsList[0].rent,
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [selectedBuildingId, statusFilter]);

  const handleOpenAddModal = () => {
    fetchAvailableBeds();
    setIsAddTenantOpen(true);
  };

  const handleCopyText = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/tenants/add', newTenantData);
      if (res.data.success) {
        toast.success(res.data.message);
        setIsAddTenantOpen(false);

        // Reset add form
        setNewTenantData({
          name: '',
          email: '',
          phone: '',
          bedId: '',
          monthlyRent: 9500,
          securityDeposit: 15000,
          rentDueDay: 5,
          joiningDate: new Date().toISOString().split('T')[0],
          occupation: 'working_professional',
          companyOrCollege: '',
          emergencyContact: { name: '', relation: '', phone: '' },
        });

        // Trigger PDF generation & display credentials modal
        if (res.data.credentials) {
          setCredentialsModalData(res.data.credentials);
          generateCredentialsPdf(res.data.credentials);
        }

        fetchTenants();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to allocate bed');
    }
  };

  const handleViewDetails = async (tenantId) => {
    try {
      const res = await api.get(`/tenants/${tenantId}`);
      if (res.data.success) {
        setSelectedTenantDetails(res.data);
        setIsDetailsModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load resident profile');
    }
  };

  const handleTransferBed = async (e) => {
    e.preventDefault();
    if (!selectedTenantDetails?.user?._id || !transferTargetBedId) return;
    try {
      const res = await api.post('/tenants/transfer', {
        tenantId: selectedTenantDetails.user._id,
        newBedId: transferTargetBedId,
        reason: transferReason,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setIsTransferModalOpen(false);
        setIsDetailsModalOpen(false);
        fetchTenants();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    }
  };

  const handleCheckoutTenant = async (e) => {
    e.preventDefault();
    if (!selectedTenantDetails?.user?._id) return;
    try {
      const res = await api.post(`/tenants/${selectedTenantDetails.user._id}/checkout`, {
        notes: checkoutNotes,
        refundDeposit,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setIsCheckoutModalOpen(false);
        setIsDetailsModalOpen(false);
        fetchTenants();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.tenant?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.tenant?.phone?.includes(search) ||
      t.room?.roomNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>Resident Tenant Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage bed allocations, view payment & attendance histories, transfer rooms, and process checkouts.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add & Allocate Tenant</span>
        </button>
      </div>

      {/* Directory Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or room..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="active">Active Residents</option>
              <option value="checked_out">Checked Out History</option>
              <option value="transferred">Transferred Records</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Loader message="Loading tenant directory..." />
        ) : filteredTenants.length === 0 ? (
          <EmptyState
            title="No tenants found"
            description="No tenants matched the current filters or no bed allocations exist."
            action={
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
              >
                Allocate First Tenant
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Resident</th>
                  <th className="px-6 py-3.5">Assigned Room & Bed</th>
                  <th className="px-6 py-3.5">Joining Date</th>
                  <th className="px-6 py-3.5">Monthly Rent</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Profile & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map((alloc) => (
                  <tr key={alloc._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={alloc.tenant?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={alloc.tenant?.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{alloc.tenant?.name}</p>
                          <p className="text-[11px] text-slate-400">{alloc.tenant?.phone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">
                        Room {alloc.room?.roomNumber} • {alloc.bed?.bedNumber}
                      </p>
                      <p className="text-[11px] text-slate-500 capitalize">
                        {alloc.room?.roomType?.replace('_', ' ')}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(alloc.joiningDate)}
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(alloc.monthlyRent)}
                    </td>

                    <td className="px-6 py-4">
                      <Badge status={alloc.status} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            const creds = {
                              tenantName: alloc.tenant?.name,
                              username: alloc.tenant?.username || alloc.tenant?.email,
                              password: alloc.tenant?.tempPasswordPlain || 'Password@123',
                              phone: alloc.tenant?.phone,
                              email: alloc.tenant?.email,
                              buildingName: alloc.building?.name,
                              buildingAddress: alloc.building?.address
                                ? `${alloc.building?.address?.street || ''}, ${alloc.building?.address?.city || ''}`
                                : '',
                              roomNumber: alloc.room?.roomNumber,
                              bedNumber: alloc.bed?.bedNumber,
                              monthlyRent: alloc.monthlyRent,
                              securityDeposit: alloc.securityDeposit,
                              rentDueDay: alloc.rentDueDay,
                              joiningDate: alloc.joiningDate,
                            };
                            generateCredentialsPdf(creds);
                            toast.success(`Downloaded Admission Slip for ${alloc.tenant?.name}`);
                          }}
                          title="Download Official Admission & Credentials PDF"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200/80 transition-colors shadow-sm"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>PDF Slip</span>
                        </button>
                        <button
                          onClick={() => handleViewDetails(alloc.tenant?._id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-colors"
                        >
                          View Full Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add & Allocate Tenant Modal */}
      <Modal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
        title="Add Tenant & Allocate Bed"
        subtitle="Registers tenant and atomically allocates a vacant bed"
      >
        <form onSubmit={handleCreateTenant} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={newTenantData.name}
                onChange={(e) => setNewTenantData({ ...newTenantData, name: e.target.value })}
                placeholder="e.g. Ananya Sharma"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                value={newTenantData.phone}
                onChange={(e) => setNewTenantData({ ...newTenantData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={newTenantData.email}
              onChange={(e) => setNewTenantData({ ...newTenantData, email: e.target.value })}
              placeholder="tenant@example.com"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Select Vacant Bed
            </label>
            {availableBeds.length === 0 ? (
              <p className="text-xs text-rose-500 font-semibold p-2 bg-rose-50 rounded-xl">
                No available beds found in this building. Add a bed or check out an existing tenant first.
              </p>
            ) : (
              <select
                required
                value={newTenantData.bedId}
                onChange={(e) => {
                  const bId = e.target.value;
                  const found = availableBeds.find((b) => b.bedId === bId);
                  setNewTenantData({
                    ...newTenantData,
                    bedId: bId,
                    monthlyRent: found ? found.rent : newTenantData.monthlyRent,
                  });
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                {availableBeds.map((b) => (
                  <option key={b.bedId} value={b.bedId}>
                    {b.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Monthly Rent (₹)
              </label>
              <input
                type="number"
                required
                value={newTenantData.monthlyRent}
                onChange={(e) => setNewTenantData({ ...newTenantData, monthlyRent: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Deposit (₹)
              </label>
              <input
                type="number"
                value={newTenantData.securityDeposit}
                onChange={(e) => setNewTenantData({ ...newTenantData, securityDeposit: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Rent Due Day
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={newTenantData.rentDueDay}
                onChange={(e) => setNewTenantData({ ...newTenantData, rentDueDay: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={availableBeds.length === 0}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all mt-4 disabled:opacity-50"
          >
            Confirm Bed Allocation & Auto-Generate Invoice
          </button>
        </form>
      </Modal>

      {/* Comprehensive Tenant Profile Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedTenantDetails?.user?.name || 'Resident Details'}
        subtitle={`Phone: ${selectedTenantDetails?.user?.phone || ''} • ${selectedTenantDetails?.currentAllocation ? 'Active Resident' : 'Checked Out'}`}
        maxWidth="max-w-3xl"
      >
        {selectedTenantDetails && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <button
                onClick={() => {
                  if (selectedTenantDetails?.credentials) {
                    generateCredentialsPdf(selectedTenantDetails.credentials);
                  } else if (selectedTenantDetails?.user) {
                    generateCredentialsPdf({
                      tenantName: selectedTenantDetails.user.name,
                      username: selectedTenantDetails.user.username || selectedTenantDetails.user.email,
                      password: selectedTenantDetails.user.tempPasswordPlain || 'Password@123',
                      phone: selectedTenantDetails.user.phone,
                      email: selectedTenantDetails.user.email,
                      buildingName: selectedTenantDetails.currentAllocation?.building?.name,
                      buildingAddress: selectedTenantDetails.currentAllocation?.building?.address
                        ? `${selectedTenantDetails.currentAllocation?.building?.address?.street || ''}, ${selectedTenantDetails.currentAllocation?.building?.address?.city || ''}`
                        : '',
                      roomNumber: selectedTenantDetails.currentAllocation?.room?.roomNumber,
                      bedNumber: selectedTenantDetails.currentAllocation?.bed?.bedNumber,
                      monthlyRent: selectedTenantDetails.currentAllocation?.monthlyRent,
                      securityDeposit: selectedTenantDetails.currentAllocation?.securityDeposit,
                      rentDueDay: selectedTenantDetails.currentAllocation?.rentDueDay,
                      joiningDate: selectedTenantDetails.currentAllocation?.joiningDate,
                    });
                  }
                  toast.success('Downloaded Admission & Credentials Slip PDF');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download Admission Slip PDF</span>
              </button>

              {selectedTenantDetails.currentAllocation && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      fetchAvailableBeds();
                      setIsTransferModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transfer Bed</span>
                  </button>

                  <button
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Checkout Resident</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
              {['overview', 'invoices', 'attendance', 'complaints', 'allocations'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailsTab(tab)}
                  className={`capitalize px-3 py-1.5 rounded-lg transition-colors ${
                    detailsTab === tab
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {detailsTab === 'overview' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-semibold">Current Bed</span>
                    <span className="font-bold text-slate-800">
                      Room {selectedTenantDetails.currentAllocation?.room?.roomNumber} • {selectedTenantDetails.currentAllocation?.bed?.bedNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Monthly Rent</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(selectedTenantDetails.currentAllocation?.monthlyRent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Occupation</span>
                    <span className="font-bold text-slate-800 capitalize">
                      {selectedTenantDetails.tenantProfile?.occupation?.replace('_', ' ') || 'N/A'} ({selectedTenantDetails.tenantProfile?.companyOrCollege || ''})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Emergency Contact</span>
                    <span className="font-bold text-slate-800">
                      {selectedTenantDetails.tenantProfile?.emergencyContact?.phone || 'None recorded'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Invoices */}
            {detailsTab === 'invoices' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedTenantDetails.invoices?.length > 0 ? (
                  selectedTenantDetails.invoices.map((inv) => (
                    <div
                      key={inv._id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{inv.invoiceNumber} ({inv.billingMonth})</p>
                        <p className="text-slate-500">Due: {formatDate(inv.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</p>
                        <Badge status={inv.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No invoice records found</p>
                )}
              </div>
            )}

            {/* Tab: Attendance */}
            {detailsTab === 'attendance' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedTenantDetails.recentAttendance?.length > 0 ? (
                  selectedTenantDetails.recentAttendance.map((att) => (
                    <div
                      key={att._id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                    >
                      <div>
                        <p className="font-bold capitalize text-slate-900">{att.mealType} • {att.date}</p>
                        <p className="text-slate-500">Method: {att.verificationMethod}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Recorded
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No recent attendance recorded</p>
                )}
              </div>
            )}

            {/* Tab: Complaints */}
            {detailsTab === 'complaints' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedTenantDetails.complaints?.length > 0 ? (
                  selectedTenantDetails.complaints.map((c) => (
                    <div
                      key={c._id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{c.title}</span>
                        <Badge status={c.status} />
                      </div>
                      <p className="text-slate-500">{c.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No complaints submitted</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Transfer Bed Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Resident to Another Bed"
      >
        <form onSubmit={handleTransferBed} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Select New Vacant Bed
            </label>
            <select
              required
              value={transferTargetBedId}
              onChange={(e) => setTransferTargetBedId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
            >
              <option value="">Select a bed</option>
              {availableBeds.map((b) => (
                <option key={b.bedId} value={b.bedId}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Transfer Reason
            </label>
            <input
              type="text"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all"
          >
            Confirm Bed Transfer
          </button>
        </form>
      </Modal>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="Checkout Resident"
        subtitle="Vacates the bed and concludes active PG services"
      >
        <form onSubmit={handleCheckoutTenant} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Checkout Notes / Remarks
            </label>
            <input
              type="text"
              value={checkoutNotes}
              onChange={(e) => setCheckoutNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={refundDeposit}
              onChange={(e) => setRefundDeposit(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span>Security deposit refunded in full</span>
          </label>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all"
          >
            Confirm Resident Checkout & Free Bed
          </button>
        </form>
      </Modal>

      {/* Tenant Enrolled & Admission Slip Generated Success Modal */}
      <Modal
        isOpen={!!credentialsModalData}
        onClose={() => setCredentialsModalData(null)}
        title="Tenant Enrolled & Admission Slip Generated"
        subtitle="Bed allocated successfully. Share these credentials with the resident."
      >
        {credentialsModalData && (
          <div className="space-y-4">
            {/* Success Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">
                  {credentialsModalData.tenantName} admitted successfully!
                </h4>
                <p className="text-xs text-emerald-700">
                  Allocated to {credentialsModalData.buildingName} • Room {credentialsModalData.roomNumber} ({credentialsModalData.bedNumber})
                </p>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-3 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Resident Login Credentials
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                  name@pgname format
                </span>
              </div>

              {/* Username Field */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Username (name@pgname)</span>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {credentialsModalData.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(credentialsModalData.username, 'Username')}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                  title="Copy Username"
                >
                  {copiedField === 'Username' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Field */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Temporary Password</span>
                  <span className="font-mono text-sm font-bold text-rose-400">
                    {credentialsModalData.password}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(credentialsModalData.password, 'Password')}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                  title="Copy Password"
                >
                  {copiedField === 'Password' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Room & Rent Summary */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2 rounded-lg bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 block">Room & Bed</span>
                  <span className="font-semibold text-slate-200">Room {credentialsModalData.roomNumber} • {credentialsModalData.bedNumber}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 block">Monthly Rent</span>
                  <span className="font-semibold text-slate-200">₹{Number(credentialsModalData.monthlyRent || 0).toLocaleString('en-IN')}/mo</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <p className="text-xs text-slate-500 leading-relaxed">
              💡 The official PDF Admission Slip has been downloaded. You can WhatsApp or print it for the resident. Residents cannot self-register online; they must sign in using these exact credentials.
            </p>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  generateCredentialsPdf(credentialsModalData);
                  toast.success('Downloaded Admission Slip PDF');
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
              >
                <FileDown className="w-4 h-4" />
                <span>Download PDF Slip Again</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const text = `Welcome to ${credentialsModalData.buildingName}!\nHere are your PGmate resident login credentials:\nUsername: ${credentialsModalData.username}\nPassword: ${credentialsModalData.password}\nLogin URL: ${window.location.origin}/login`;
                  navigator.clipboard.writeText(text);
                  toast.success('Copied full credentials slip to clipboard');
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                <Copy className="w-4 h-4" />
                <span>Copy for WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setCredentialsModalData(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
