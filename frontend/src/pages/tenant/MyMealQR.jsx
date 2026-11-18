import React, { useState, useEffect } from 'react';
import {
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Coffee,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { Loader } from '../../components/common/Loader.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const MyMealQR = () => {
  const { toast } = useNotification();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMealQRs = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/qr/my-qrs');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate meal QR codes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMealQRs();

    // Auto poll every 10 seconds while page is open so status switches to "Used" automatically after scan!
    const interval = setInterval(() => {
      fetchMealQRs(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Loader message="Generating secure daily meal QR codes..." />;
  }

  const meals = data?.meals || {};
  const today = data?.today || '';
  const currentActiveMeal = data?.currentMeal || '';

  const mealCards = [
    {
      key: 'breakfast',
      title: 'Breakfast QR',
      icon: Coffee,
      color: 'amber',
      timing: meals.breakfast?.timing || '07:30 - 09:30',
      data: meals.breakfast,
    },
    {
      key: 'lunch',
      title: 'Lunch QR',
      icon: Sun,
      color: 'blue',
      timing: meals.lunch?.timing || '12:30 - 14:30',
      data: meals.lunch,
    },
    {
      key: 'dinner',
      title: 'Dinner QR',
      icon: Moon,
      color: 'indigo',
      timing: meals.dinner?.timing || '19:30 - 21:30',
      data: meals.dinner,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>One-Time Single Use Security</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-brand-600" />
            <span>Today's Meal Attendance QR Passes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Display this QR to the cafeteria scanner counter. Each code expires after meal timings and is strictly valid for one successful scan.
          </p>
        </div>

        <button
          onClick={() => fetchMealQRs(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* 3 Meal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mealCards.map((m) => {
          const Icon = m.icon;
          const qrInfo = m.data || {};
          const isUsed = qrInfo.status === 'used' || qrInfo.isUsed;
          const isExpired = qrInfo.status === 'expired';
          const isAvailable = qrInfo.status === 'available';

          return (
            <div
              key={m.key}
              className={`bg-white rounded-3xl p-6 border shadow-sm transition-all flex flex-col justify-between relative overflow-hidden ${
                isUsed
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isExpired
                  ? 'border-slate-200 bg-slate-50/50 opacity-80'
                  : m.key === currentActiveMeal
                  ? 'border-brand-500 ring-2 ring-brand-500/20'
                  : 'border-slate-200/80'
              }`}
            >
              {/* Active session pill */}
              {m.key === currentActiveMeal && !isUsed && !isExpired && (
                <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] uppercase font-extrabold px-3 py-1 rounded-bl-xl shadow-xs">
                  Active Now
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{m.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{m.timing}</span>
                    </p>
                  </div>
                </div>

                {/* QR Display Area */}
                <div className="py-6 flex flex-col items-center justify-center">
                  {isUsed ? (
                    <div className="w-56 h-56 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center text-center p-4 space-y-2">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce" />
                      <h4 className="font-extrabold text-emerald-950 text-sm">
                        Attendance Recorded!
                      </h4>
                      <p className="text-xs text-emerald-800">
                        Meal pass successfully consumed. Enjoy your meal!
                      </p>
                    </div>
                  ) : isExpired ? (
                    <div className="w-56 h-56 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center p-4 space-y-2">
                      <AlertCircle className="w-10 h-10 text-slate-400" />
                      <h4 className="font-bold text-slate-700 text-sm">Session Expired</h4>
                      <p className="text-xs text-slate-500">
                        Meal timing has concluded for today.
                      </p>
                    </div>
                  ) : qrInfo.qrDataUrl ? (
                    <div className="p-3 bg-white rounded-2xl border-2 border-slate-900 shadow-md">
                      <img
                        src={qrInfo.qrDataUrl}
                        alt={`${m.title} QR Code`}
                        className="w-48 h-48 rounded-lg object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-56 h-56 rounded-2xl bg-slate-50 border flex items-center justify-center text-xs text-slate-400">
                      Pass unavailable
                    </div>
                  )}
                </div>
              </div>

              {/* Status Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">
                  Pass Status
                </span>
                <Badge
                  status={isUsed ? 'recorded' : isExpired ? 'expired' : 'available'}
                  label={isUsed ? 'Attendance Recorded' : isExpired ? 'Expired' : 'Ready to Scan'}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
