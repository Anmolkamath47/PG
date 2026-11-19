import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Building,
  Briefcase,
  Shield,
  Save,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const TenantProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useNotification();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', formData);
      if (res.data.success) {
        toast.success('Profile updated');
        updateUser(formData);
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-6 h-6 text-brand-600" />
            <span>Resident Profile</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Personal identity, phone contact, and registered PG details.
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <img
            src={formData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={formData.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-200"
          />
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">{formData.name}</h3>
            {user?.username && (
              <p className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-emerald-200">
                {user.username}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-0.5">{user?.phone}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Mobile Number
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Profile Avatar Image URL
          </label>
          <input
            type="url"
            value={formData.avatar}
            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
            placeholder="https://..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all mt-4 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </form>
    </div>
  );
};
