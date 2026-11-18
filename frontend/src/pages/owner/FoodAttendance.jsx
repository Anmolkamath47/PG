import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CalendarCheck,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react';
import { Loader } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const FoodAttendance = () => {
  const { selectedBuildingId } = useOutletContext();
  const { toast } = useNotification();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAttendance = async () => {
    if (!selectedBuildingId) return;
    setLoading(true);
    try {
      const res = await api.get('/attendance/report', {
        params: { buildingId: selectedBuildingId, date },
      });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedBuildingId, date]);

  const handleExportCSV = async () => {
    if (!selectedBuildingId) return;
    try {
      const res = await api.get('/attendance/export-csv', {
        params: { buildingId: selectedBuildingId, date },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `food-attendance-${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Attendance CSV downloaded');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  const records = data?.records || [];
  const stats = data?.stats || {};

  const filteredRecords = records.filter(
    (r) =>
      r.tenant?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.tenant?.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand-600" />
            <span>Food & Meal Attendance Records</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Verified scan records for breakfast, lunch, and dinner. Note: Missing scans indicate "Not recorded", not confirmed absence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Meals Served"
          value={stats.totalMealsServed || 0}
          subtext={`On ${date}`}
          icon={CalendarCheck}
          iconBg="bg-brand-50 text-brand-600"
        />
        <StatCard
          title="Breakfast Recorded"
          value={stats.breakfast?.count || 0}
          subtext={`${stats.breakfast?.percentage || 0}% of residents`}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Lunch Recorded"
          value={stats.lunch?.count || 0}
          subtext={`${stats.lunch?.percentage || 0}% of residents`}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Dinner Recorded"
          value={stats.dinner?.count || 0}
          subtext={`${stats.dinner?.percentage || 0}% of residents`}
          iconBg="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Attendance Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by resident or room..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Showing {filteredRecords.length} resident records
          </p>
        </div>

        {loading ? (
          <Loader message="Loading attendance report..." />
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            title="No resident records found"
            description="No active residents allocated to this property or matching your filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Resident</th>
                  <th className="px-6 py-3.5">Room & Bed</th>
                  <th className="px-6 py-3.5">Breakfast (Morning)</th>
                  <th className="px-6 py-3.5">Lunch (Afternoon)</th>
                  <th className="px-6 py-3.5">Dinner (Night)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.tenant?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={r.tenant?.name}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{r.tenant?.name}</p>
                          <p className="text-[11px] text-slate-400">{r.tenant?.phone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">
                      Room {r.roomNumber} ({r.bedNumber})
                    </td>

                    <td className="px-6 py-4">
                      {r.breakfast?.status === 'Recorded' ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Recorded ({formatDateTime(r.breakfast.scanTime).split(',')[1]?.trim()})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">Not recorded</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {r.lunch?.status === 'Recorded' ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Recorded ({formatDateTime(r.lunch.scanTime).split(',')[1]?.trim()})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">Not recorded</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {r.dinner?.status === 'Recorded' ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Recorded ({formatDateTime(r.dinner.scanTime).split(',')[1]?.trim()})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">Not recorded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
