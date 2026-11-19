import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Bed,
  CreditCard,
  QrCode,
  UtensilsCrossed,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { Loader } from '../../components/common/Loader.jsx';
import api from '../../services/api.js';

export const TenantHome = () => {
  const { user } = useAuth();
  const [roomData, setRoomData] = useState(null);
  const [rentData, setRentData] = useState(null);
  const [todayMenu, setTodayMenu] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [meRes, rentRes, menuRes, annRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/rent/my-invoices'),
          api.get('/menu/today'),
          api.get('/notifications/announcements'),
        ]);

        if (meRes.data.success) {
          setRoomData(meRes.data.details?.allocation);
        }
        if (rentRes.data.success) {
          setRentData(rentRes.data);
        }
        if (menuRes.data.success) {
          setTodayMenu(menuRes.data.menu);
        }
        if (annRes.data.success) {
          setAnnouncements(annRes.data.announcements || []);
        }
      } catch (err) {
        console.error('Error fetching tenant dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <Loader message="Loading your resident dashboard..." />;
  }

  const currentInvoice = rentData?.currentInvoice;
  const isRentPaid = currentInvoice?.status === 'paid' || rentData?.totalOutstanding === 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/10 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome home, {user?.name}!
            </h2>
            <p className="mt-1 text-slate-300 text-xs sm:text-sm">
              {roomData?.room ? `Room ${roomData.room.roomNumber} • ${roomData.bed?.bedNumber || ''}` : 'Awaiting Room Allocation'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/tenant/qr"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all hover:scale-102"
            >
              <QrCode className="w-4 h-4" />
              <span>Show Meal QR</span>
            </Link>

            {!isRentPaid && (
              <Link
                to="/tenant/rent"
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all border border-white/10"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Rent</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Announcements Broadcast if active */}
      {announcements.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <Megaphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-sm text-amber-950">
              Notice: {announcements[0].title}
            </span>
            <p className="mt-0.5 text-amber-800">{announcements[0].message}</p>
          </div>
        </div>
      )}

      {/* Two-Column Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rent Status Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Monthly Rent Status</h3>
                  <p className="text-xs text-slate-500">
                    Billing Cycle: {currentInvoice?.billingMonth || 'Current'}
                  </p>
                </div>
              </div>

              {isRentPaid ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Paid in Full</span>
                </span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Payment Due
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {isRentPaid ? 'Paid Amount' : 'Outstanding Balance'}
                </span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {formatCurrency(isRentPaid ? currentInvoice?.amountPaid || roomData?.monthlyRent : rentData?.totalOutstanding)}
                </span>
              </div>

              {currentInvoice && (
                <p className="text-xs text-slate-500">
                  Due date: <strong>{formatDate(currentInvoice.dueDate)}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            {!isRentPaid ? (
              <Link
                to="/tenant/rent"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
              >
                <span>Pay Rent Online (UPI / Card)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/tenant/payments"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                <span>View Payment Receipts</span>
              </Link>
            )}
          </div>
        </div>

        {/* Today's Meals Summary */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Today's Meals</h3>
                  <p className="text-xs text-slate-500 capitalize">{todayMenu?.dayOfWeek || 'Today'}</p>
                </div>
              </div>

              <Link
                to="/tenant/menu"
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                Full Week
              </Link>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-amber-700 block text-[11px] uppercase">
                  Breakfast ({todayMenu?.breakfast?.timing || '07:30 - 09:30'})
                </span>
                <p className="text-slate-800 mt-0.5 font-medium line-clamp-1">
                  {todayMenu?.breakfast?.items || 'Menu not announced yet'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-blue-700 block text-[11px] uppercase">
                  Lunch ({todayMenu?.lunch?.timing || '12:30 - 14:30'})
                </span>
                <p className="text-slate-800 mt-0.5 font-medium line-clamp-1">
                  {todayMenu?.lunch?.items || 'Menu not announced yet'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-indigo-700 block text-[11px] uppercase">
                  Dinner ({todayMenu?.dinner?.timing || '19:30 - 21:30'})
                </span>
                <p className="text-slate-800 mt-0.5 font-medium line-clamp-1">
                  {todayMenu?.dinner?.items || 'Menu not announced yet'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <Link
              to="/tenant/qr"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Open One-Time Meal QRs</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
