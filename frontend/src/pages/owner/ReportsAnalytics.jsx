import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart3,
  Download,
  Calendar,
  CreditCard,
  BedDouble,
  CalendarCheck,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Loader } from '../../components/common/Loader.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const ReportsAnalytics = () => {
  const { selectedBuildingId } = useOutletContext();
  const { toast } = useNotification();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/overview', {
          params: { buildingId: selectedBuildingId },
        });
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedBuildingId]);

  if (loading) {
    return <Loader message="Generating financial & occupancy reports..." />;
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            <span>Operational & Financial Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Historical analytics, occupancy progression, and meal consumption statistics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Occupancy Percentage"
          value={`${summary.occupancyRate || 0}%`}
          subtext={`${summary.occupiedBeds || 0} occupied of ${summary.totalBeds || 0} beds`}
          icon={BedDouble}
          iconBg="bg-brand-50 text-brand-600"
        />
        <StatCard
          title="Monthly Expected"
          value={formatCurrency(summary.expectedRent || 0)}
          subtext={`Collection rate: ${summary.collectionRate || 0}%`}
          icon={CreditCard}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Collected Rent"
          value={formatCurrency(summary.collectedRent || 0)}
          subtext={`Balance pending: ${formatCurrency(summary.pendingRent || 0)}`}
          icon={TrendingUp}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Pending Tickets"
          value={summary.pendingComplaints || 0}
          subtext="Open maintenance issues"
          icon={AlertTriangle}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Financial Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Monthly Financial Performance</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.monthlyRentTrends || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                formatter={(val) => [formatCurrency(val)]}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="expected" name="Expected Rent" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" name="Collected Rent" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
