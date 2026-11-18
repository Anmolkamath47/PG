import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Megaphone,
} from 'lucide-react';
import { Loader } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const TenantNotifications = () => {
  const { toast } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const [notifRes, annRes] = await Promise.all([
          api.get('/notifications'),
          api.get('/notifications/announcements'),
        ]);

        if (notifRes.data.success) {
          setNotifications(notifRes.data.notifications || []);
        }
        if (annRes.data.success) {
          setAnnouncements(annRes.data.announcements || []);
        }
      } catch (err) {
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data.success) {
        toast.success('All notifications marked as read');
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (e) {
      toast.error('Failed to update');
    }
  };

  if (loading) {
    return <Loader message="Loading alerts and announcements..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600" />
            <span>Notifications & Announcements</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Important messages, rent reminders, and food schedule announcements.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <span>PG Building Broadcasts</span>
          </h3>
          <div className="space-y-2">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200 text-xs text-amber-950 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-amber-900">{ann.title}</h4>
                  <span className="text-[10px] text-amber-700 font-semibold">
                    {formatDateTime(ann.createdAt)}
                  </span>
                </div>
                <p className="text-amber-800 leading-relaxed">{ann.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Notifications */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Personal Alerts</h3>
        {notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You have no unread notifications." />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`p-4 rounded-2xl border text-xs transition-colors ${
                  n.isRead
                    ? 'bg-white border-slate-200/80 text-slate-600'
                    : 'bg-brand-50/60 border-brand-200 text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{n.title}</span>
                  <span className="text-[10px] text-slate-400">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-slate-600 font-normal">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
