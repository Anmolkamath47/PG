import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Utensils,
  Clock,
  Sparkles,
  Save,
  Bell,
  CheckCircle,
  Coffee,
  Sun,
  Moon,
  Plus,
  Building,
} from 'lucide-react';
import { Loader } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const FoodMenu = () => {
  const { selectedBuildingId, buildings } = useOutletContext();
  const { toast } = useNotification();

  const [loading, setLoading] = useState(true);
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [todayDay, setTodayDay] = useState('monday');
  const [activeTab, setActiveTab] = useState('monday');
  const [saving, setSaving] = useState(false);
  const [notifyTenants, setNotifyTenants] = useState(true);

  // Form state for active day
  const [dayForm, setDayForm] = useState({
    breakfast: { items: '', timing: '07:30 - 09:30', description: '' },
    lunch: { items: '', timing: '12:30 - 14:30', description: '' },
    dinner: { items: '', timing: '19:30 - 21:30', description: '' },
  });

  const days = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
  ];

  const fetchMenu = async () => {
    if (!selectedBuildingId) {
      setLoading(false);
      setWeeklyMenu([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/menu/weekly/${selectedBuildingId}`);
      if (res.data.success) {
        setWeeklyMenu(res.data.weeklyMenu || []);
        if (res.data.todayDay) {
          setTodayDay(res.data.todayDay);
          setActiveTab(res.data.todayDay);
        }
      }
    } catch (err) {
      toast.error('Failed to load weekly menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [selectedBuildingId]);

  // Synchronize form when activeTab or weeklyMenu changes
  useEffect(() => {
    const currentMenu = weeklyMenu.find((m) => m.dayOfWeek === activeTab);
    if (currentMenu) {
      setDayForm({
        breakfast: currentMenu.breakfast || { items: '', timing: '07:30 - 09:30', description: '' },
        lunch: currentMenu.lunch || { items: '', timing: '12:30 - 14:30', description: '' },
        dinner: currentMenu.dinner || { items: '', timing: '19:30 - 21:30', description: '' },
      });
    }
  }, [activeTab, weeklyMenu]);

  const handleSaveDayMenu = async (e) => {
    e.preventDefault();
    if (!selectedBuildingId) return;
    setSaving(true);
    try {
      const res = await api.put(`/menu/day/${selectedBuildingId}/${activeTab}`, {
        ...dayForm,
        notifyTenants,
      });
      if (res.data.success) {
        toast.success(`Menu for ${activeTab.toUpperCase()} updated successfully!`);
        // Update local state
        setWeeklyMenu((prev) =>
          prev.map((m) => (m.dayOfWeek === activeTab ? res.data.menu : m))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update menu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading weekly food menu..." />;
  }

  if (!selectedBuildingId && (!buildings || buildings.length === 0)) {
    return (
      <EmptyState
        title="No PG Building Found"
        description="Please add your first PG building before creating weekly mess menus."
        action={
          <Link
            to="/owner/buildings"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Building</span>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Weekly Homestyle Meals Plan</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-brand-600" />
            <span>Weekly Food Menu Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure breakfast, lunch, and dinner for all 7 days of the week. Updates reflect in all resident dashboards instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={notifyTenants}
              onChange={(e) => setNotifyTenants(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <Bell className="w-4 h-4 text-brand-600" />
            <span>Notify Residents</span>
          </label>
        </div>
      </div>

      {/* Days Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-200/70 rounded-2xl">
        {days.map((day) => {
          const isToday = day.id === todayDay;
          const isActive = day.id === activeTab;
          return (
            <button
              key={day.id}
              onClick={() => setActiveTab(day.id)}
              className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{day.label}</span>
              {isToday && (
                <span
                  className={`text-[9px] uppercase px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Menu Form for Selected Day */}
      <form onSubmit={handleSaveDayMenu} className="space-y-5">
        {/* Breakfast Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Breakfast Menu</h3>
                <p className="text-xs text-slate-500">Morning session</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <input
                type="text"
                value={dayForm.breakfast.timing}
                onChange={(e) =>
                  setDayForm({
                    ...dayForm,
                    breakfast: { ...dayForm.breakfast, timing: e.target.value },
                  })
                }
                placeholder="07:30 - 09:30"
                className="bg-transparent border-0 text-xs font-bold focus:outline-none w-28 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Food Dishes & Beverages
            </label>
            <input
              type="text"
              required
              value={dayForm.breakfast.items}
              onChange={(e) =>
                setDayForm({
                  ...dayForm,
                  breakfast: { ...dayForm.breakfast, items: e.target.value },
                })
              }
              placeholder="e.g. Idli, Medu Vada, Sambar, Coconut Chutney, Masala Tea"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Lunch Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Lunch Menu</h3>
                <p className="text-xs text-slate-500">Afternoon session</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <input
                type="text"
                value={dayForm.lunch.timing}
                onChange={(e) =>
                  setDayForm({
                    ...dayForm,
                    lunch: { ...dayForm.lunch, timing: e.target.value },
                  })
                }
                placeholder="12:30 - 14:30"
                className="bg-transparent border-0 text-xs font-bold focus:outline-none w-28 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Food Dishes & Accompaniments
            </label>
            <input
              type="text"
              required
              value={dayForm.lunch.items}
              onChange={(e) =>
                setDayForm({
                  ...dayForm,
                  lunch: { ...dayForm.lunch, items: e.target.value },
                })
              }
              placeholder="e.g. Steamed Rice, Dal Tadka, Aloo Gobi, Roti, Curd, Salad"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Dinner Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Dinner Menu</h3>
                <p className="text-xs text-slate-500">Evening session</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <input
                type="text"
                value={dayForm.dinner.timing}
                onChange={(e) =>
                  setDayForm({
                    ...dayForm,
                    dinner: { ...dayForm.dinner, timing: e.target.value },
                  })
                }
                placeholder="19:30 - 21:30"
                className="bg-transparent border-0 text-xs font-bold focus:outline-none w-28 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Food Dishes & Special Items
            </label>
            <input
              type="text"
              required
              value={dayForm.dinner.items}
              onChange={(e) =>
                setDayForm({
                  ...dayForm,
                  dinner: { ...dayForm.dinner, items: e.target.value },
                })
              }
              placeholder="e.g. Paneer Butter Masala, Phulka Roti, Jeera Rice, Gulab Jamun"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Publishing Changes...' : `Save & Publish ${activeTab.toUpperCase()} Menu`}</span>
        </button>
      </form>
    </div>
  );
};
