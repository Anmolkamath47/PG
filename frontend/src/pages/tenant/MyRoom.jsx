import React, { useState, useEffect } from 'react';
import {
  Bed,
  Building,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Check,
  CreditCard,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Loader } from '../../components/common/Loader.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import api from '../../services/api.js';

export const MyRoom = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setData(res.data.details);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, []);

  if (loading) {
    return <Loader message="Loading room & roommate details..." />;
  }

  const alloc = data?.allocation;
  const building = alloc?.building;
  const room = alloc?.room;
  const bed = alloc?.bed;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Room Allocation</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bed className="w-6 h-6 text-brand-600" />
            <span>Room {room?.roomNumber || 'N/A'}{bed?.bedNumber ? ` - ${bed.bedNumber}` : ''}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {building?.name || 'Assigned Property'} • Floor {room?.floor || '1'}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Monthly Rent
          </span>
          <span className="text-2xl font-black text-slate-900">
            {formatCurrency(alloc?.monthlyRent || 0)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Specifications */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Room Specifications
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                Sharing Type
              </span>
              <span className="font-bold text-slate-800 capitalize">
                {room?.roomType?.replace('_', ' ') || 'Standard'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                Security Deposit
              </span>
              <span className="font-bold text-slate-800">
                {formatCurrency(alloc?.securityDeposit || 0)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                Joining Date
              </span>
              <span className="font-bold text-slate-800">
                {formatDate(alloc?.joiningDate || new Date())}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                Rent Due Day
              </span>
              <span className="font-bold text-slate-800">
                Day {alloc?.rentDueDay || 5} of every month
              </span>
            </div>
          </div>

          {/* Included Amenities */}
          <div className="pt-2">
            <span className="font-bold text-xs uppercase text-slate-600 block mb-2">
              Building Amenities
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(building?.amenities && building.amenities.length > 0
                ? building.amenities
                : ['High-Speed Wi-Fi', 'Homestyle Meals', 'Daily Housekeeping', 'Hot Water', 'Power Backup', 'Security Guard']
              ).map((am, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{am}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Building & Owner Contact */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Property & Manager Details
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                PG Address
              </span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {building?.address?.street ? `${building.address.street}, ` : ''}
                {building?.address?.area ? `${building.address.area}, ` : ''}
                {building?.address?.city || ''}
                {building?.address?.pincode ? ` - ${building.address.pincode}` : ''}
              </p>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold uppercase text-[10px]">
                Helpdesk & Manager Contact
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {building?.contactNumber || 'Contact property manager'}
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
              <span className="font-bold block">Meal Schedule Timings:</span>
              <p>Breakfast: {building?.mealTimings?.breakfast || '07:30 - 09:30'}</p>
              <p>Lunch: {building?.mealTimings?.lunch || '12:30 - 14:30'}</p>
              <p>Dinner: {building?.mealTimings?.dinner || '19:30 - 21:30'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
