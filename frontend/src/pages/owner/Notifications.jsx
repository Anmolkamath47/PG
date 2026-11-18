import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Bell,
  Megaphone,
  CheckCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import { Loader } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const Notifications = () => {
  const { selectedBuildingId } = useOutletContext();
  const { toast } = useNotification();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Announcement state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [posting, setPosting] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data.success) {
        toast.success('All marked as read');
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!title || !message) return;
    setPosting(true);
    try {
      const res = await api.post('/notifications/announcements', {
        title,
        message,
        buildingId: selectedBuildingId,
        priority,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setTitle('');
        setMessage('');
      }
    } catch (err) {
      toast.error('Failed to post announcement');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600" />
            <span>Alerts & Resident Announcements</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast emergency alerts or maintenance schedules to all residents, and track system alerts.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Post Announcement */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Broadcast Announcement</h3>
              <p className="text-xs text-slate-500">Delivered directly to tenant app notifications</p>
            </div>
          </div>

          <form onSubmit={handlePostAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Announcement Headline
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Water Tank Cleaning This Saturday"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Notice Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="normal">Normal Information</option>
                <option value="important">Important (Highlighted)</option>
                <option value="urgent">Urgent / Emergency Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Notice Details
              </label>
              <textarea
                rows="4"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Dear residents, water supply will be paused between 10 AM and 1 PM..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={posting}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{posting ? 'Broadcasting...' : 'Broadcast to All Residents'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: In-app Notification Feed */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 text-base mb-4">Notification Feed</h3>

          {loading ? (
            <Loader message="Loading alerts..." />
          ) : notifications.length === 0 ? (
            <EmptyState
              title="No alerts"
              description="You have caught up with all notifications."
            />
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[460px] pr-1">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3.5 rounded-2xl border text-xs transition-colors ${
                    n.isRead
                      ? 'bg-slate-50/70 border-slate-100 text-slate-600'
                      : 'bg-brand-50/50 border-brand-200 text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
