import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Clock,
  Sparkles,
  Coffee,
  Sun,
  Moon,
  CheckCircle,
} from 'lucide-react';
import { Loader } from '../../components/common/Loader.jsx';
import api from '../../services/api.js';

export const TenantFoodMenu = () => {
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [todayDay, setTodayDay] = useState('monday');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get('/menu/weekly');
        if (res.data.success) {
          setWeeklyMenu(res.data.weeklyMenu || []);
          if (res.data.todayDay) setTodayDay(res.data.todayDay);
        }
      } catch (err) {
        console.error('Error fetching weekly menu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  if (loading) {
    return <Loader message="Loading weekly dining menu..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Weekly Homestyle Meals</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-brand-600" />
            <span>Weekly Food & Dining Menu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Freshly prepared breakfast, lunch, and dinner menu for Monday through Sunday.
          </p>
        </div>
      </div>

      {/* 7-Day Calendar Layout */}
      <div className="space-y-4">
        {weeklyMenu.map((dayMenu) => {
          const isToday = dayMenu.dayOfWeek === todayDay;

          return (
            <div
              key={dayMenu.dayOfWeek}
              className={`rounded-3xl p-6 border transition-all ${
                isToday
                  ? 'bg-gradient-to-r from-amber-50/60 to-orange-50/40 border-amber-300 ring-2 ring-amber-400/20 shadow-md'
                  : 'bg-white border-slate-200/80 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base capitalize">
                    {dayMenu.dayOfWeek}
                  </h3>
                  {isToday && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                      Today's Specials
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Breakfast */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-700 flex items-center gap-1.5">
                      <Coffee className="w-4 h-4" />
                      <span>Breakfast</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {dayMenu.breakfast?.timing || '07:30 - 09:30'}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {dayMenu.breakfast?.items || <span className="text-slate-400 italic">Menu not announced yet</span>}
                  </p>
                </div>

                {/* Lunch */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700 flex items-center gap-1.5">
                      <Sun className="w-4 h-4" />
                      <span>Lunch</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {dayMenu.lunch?.timing || '12:30 - 14:30'}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {dayMenu.lunch?.items || <span className="text-slate-400 italic">Menu not announced yet</span>}
                  </p>
                </div>

                {/* Dinner */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                      <Moon className="w-4 h-4" />
                      <span>Dinner</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {dayMenu.dinner?.timing || '19:30 - 21:30'}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {dayMenu.dinner?.items || <span className="text-slate-400 italic">Menu not announced yet</span>}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
