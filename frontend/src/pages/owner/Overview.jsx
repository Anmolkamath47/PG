import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Building2,
  BedDouble,
  Users,
  CreditCard,
  AlertTriangle,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  Sparkles,
  QrCode,
  CheckCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Loader } from '../../components/common/Loader.jsx';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import api from '../../services/api.js';

export const Overview = () => {
  const { selectedBuildingId } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/overview', {
          params: { buildingId: selectedBuildingId || undefined },
        });
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching overview stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [selectedBuildingId]);

  if (loading) {
    return <Loader message="Compiling real-time PG operations..." />;
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const recentActivities = data?.recentActivities || [];

  const complaintColors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];
  const complaintPieData = [
    { name: 'Pending', value: charts.complaintStats?.pending || 0 },
    { name: 'In Progress', value: charts.complaintStats?.inProgress || 0 },
    { name: 'Resolved', value: charts.complaintStats?.resolved || 0 },
    { name: 'Rejected', value: charts.complaintStats?.rejected || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Action Bar */}
      <div className="bg-gradient-to-r from-brand-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-brand-500/10 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time PG Operations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Property Overview & Status
            </h2>
            <p className="mt-1 text-slate-300 text-sm max-w-xl">
              Live statistics calculated from actual building records, tenant bed allocations, rent payments, and meal attendance.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/owner/scanner"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all hover:scale-102"
            >
              <QrCode className="w-4 h-4" />
              <span>Meal QR Scanner</span>
            </Link>
            <Link
              to="/owner/rooms"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all border border-white/10"
            >
              <BedDouble className="w-4 h-4" />
              <span>Visual Bed Grid</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Occupancy Rate"
          value={`${summary.occupancyRate || 0}%`}
          subtext={`${summary.occupiedBeds || 0} occupied of ${summary.totalBeds || 0} beds`}
          icon={BedDouble}
          trend={summary.availableBeds ? `${summary.availableBeds} beds available` : 'Full'}
          trendPositive={summary.availableBeds > 0}
          iconBg="bg-brand-50 text-brand-600"
        />

        <StatCard
          title="Rent Collected"
          value={formatCurrency(summary.collectedRent || 0)}
          subtext={`${summary.collectionRate || 0}% of expected ${formatCurrency(summary.expectedRent || 0)}`}
          icon={CreditCard}
          trend={`₹${((summary.pendingRent || 0) / 1000).toFixed(1)}k pending`}
          trendPositive={summary.pendingRent === 0}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Active Tenants"
          value={summary.totalActiveTenants || 0}
          subtext={`Across ${summary.totalRooms || 0} rooms in ${summary.totalBuildings || 1} PG`}
          icon={Users}
          iconBg="bg-indigo-50 text-indigo-600"
        />

        <StatCard
          title="Meal Attendance"
          value={summary.todayAttendanceCount || 0}
          subtext="Scans verified today"
          icon={CalendarCheck}
          trend={summary.pendingComplaints ? `${summary.pendingComplaints} issues pending` : 'All issues clear'}
          trendPositive={summary.pendingComplaints === 0}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collection Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rent Collection Trend</h3>
              <p className="text-xs text-slate-500">Collected vs Expected rent over past 6 months</p>
            </div>
            <Link to="/owner/rent" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
              <span>View Rent Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyRentTrends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value)]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="expected" name="Expected" stroke="#94a3b8" fillOpacity={1} fill="url(#colorExpected)" />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints Breakdown (Pie Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Complaints Health</h3>
              <p className="text-xs text-slate-500">Ticket status distribution</p>
            </div>
            <Link to="/owner/complaints" className="text-xs font-semibold text-brand-600 hover:underline">
              Manage
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[180px]">
            {complaintPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={complaintPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {complaintPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={complaintColors[index % complaintColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1 opacity-80" />
                <span>No active complaints</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">Pending: {charts.complaintStats?.pending || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-600">In Progress: {charts.complaintStats?.inProgress || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Resolved: {charts.complaintStats?.resolved || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600">Rejected: {charts.complaintStats?.rejected || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Meal Attendance Chart & Recent Activities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Food Attendance (Bar Chart) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">7-Day Meal Attendance</h3>
              <p className="text-xs text-slate-500">Meals served across Breakfast, Lunch, and Dinner</p>
            </div>
            <Link to="/owner/attendance" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
              <span>Full Attendance Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.dailyAttendanceTrends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="breakfast" name="Breakfast" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lunch" name="Lunch" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dinner" name="Dinner" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Activity Audit Feed */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Activity Feed</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-64 pr-1">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100 last:border-0 text-xs">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-slate-800 truncate">
                      {act.action?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-slate-500 text-[11px] truncate">
                      by {act.actorName} • {formatDateTime(act.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No recent activities recorded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
