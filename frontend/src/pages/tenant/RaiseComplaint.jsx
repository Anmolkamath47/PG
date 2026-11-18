import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Upload,
  Send,
  Droplet,
  Zap,
  Wifi,
  Wind,
  Sparkles,
  Utensils,
  Wrench,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const RaiseComplaint = () => {
  const { toast } = useNotification();
  const navigate = useNavigate();

  const [category, setCategory] = useState('water');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'water', label: 'Water Problem', icon: Droplet, desc: 'No water, leakage, or geyser issue' },
    { id: 'electricity', label: 'Electricity / Switch', icon: Zap, desc: 'Power cut, socket, or wiring problem' },
    { id: 'wifi', label: 'Wi-Fi / Internet', icon: Wifi, desc: 'Slow speed or disconnection' },
    { id: 'ac', label: 'AC / Air Cooler', icon: Wind, desc: 'Cooling issue, remote or filter' },
    { id: 'cleaning', label: 'Room / Washroom Cleaning', icon: Sparkles, desc: 'Housekeeping and sweep request' },
    { id: 'food', label: 'Food Quality / Dining', icon: Utensils, desc: 'Taste, hygiene, or timing feedback' },
    { id: 'other', label: 'Other Maintenance', icon: Wrench, desc: 'Carpentry, bed cot, door lock, etc.' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Please enter complaint title and description');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/complaints', {
        category,
        title,
        description,
        priority,
      });

      if (res.data.success) {
        toast.success('Complaint submitted! Your manager has been notified.');
        navigate('/tenant/complaints');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-brand-600" />
          <span>Report a Maintenance Issue</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Tickets are immediately routed to your PG manager and scheduled with on-call technicians.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        {/* Category Selection Grid */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-2">
            Select Issue Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 text-brand-900 font-bold ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                  <p className="text-xs font-bold leading-tight">{c.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Complaint Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bathroom geyser MCB trips or Wi-Fi weak"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Urgency / Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
          >
            <option value="low">Low (General request)</option>
            <option value="medium">Medium (Standard 24-hr resolution)</option>
            <option value="high">High (Needs same-day attention)</option>
            <option value="urgent">Urgent (Water / Electrical hazard)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Detailed Description
          </label>
          <textarea
            rows="4"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe where the issue is, when it started, and any specifics for the technician..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Submitting Ticket...' : 'Submit Maintenance Ticket'}</span>
        </button>
      </form>
    </div>
  );
};
