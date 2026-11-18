import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Building,
  CreditCard,
  User,
  Shield,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const Settings = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useNotification();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    businessName: user?.businessName || '',
    upiId: user?.upiId || 'rajesh.sharma@okaxis',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', formData);
      if (res.data.success) {
        toast.success('Settings and profile updated successfully');
        updateUser(formData);
      }
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-brand-600" />
            <span>Account & Payment Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure your PG merchant details, UPI ID for rent deposits, and notification preferences.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Manager Profile
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Owner Full Name
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
                Contact Phone
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              PG Business / Brand Name
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Indian Payment & Merchant Configuration
          </h3>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Direct Merchant UPI ID (Printed on receipts)
            </label>
            <input
              type="text"
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              placeholder="e.g. rajesh@okhdfcbank"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Rent payments are orchestrated via Hyperswitch sandbox and credited to this merchant account.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </form>
    </div>
  );
};
