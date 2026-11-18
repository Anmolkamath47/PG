import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  Wrench,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge.jsx';
import { Loader } from '../../components/common/Loader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import api from '../../services/api.js';

export const MyComplaints = () => {
  const { toast } = useNotification();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const res = await api.get('/complaints');
        if (res.data.success) {
          setComplaints(res.data.complaints || []);
        }
      } catch (err) {
        toast.error('Failed to load complaints');
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  if (loading) {
    return <Loader message="Loading your maintenance tickets..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-brand-600" />
            <span>My Maintenance Tickets</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time progress and notes from your building manager and technician.
          </p>
        </div>

        <Link
          to="/tenant/complaints/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {complaints.length === 0 ? (
        <EmptyState
          title="No complaints submitted"
          description="Everything is running smoothly! If you ever face an issue with plumbing, Wi-Fi, or food, raise a ticket here."
          action={
            <Link
              to="/tenant/complaints/new"
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold inline-block"
            >
              Report an Issue
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {complaints.map((comp) => (
            <div
              key={comp._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {comp.complaintNumber}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {comp.category}
                    </span>
                    <Badge status={comp.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{comp.title}</h3>
                </div>

                <span className="text-[11px] text-slate-400">
                  {formatDateTime(comp.createdAt)}
                </span>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {comp.description}
              </p>

              {/* Owner Response Box */}
              {comp.ownerResponse && (
                <div className="p-3.5 bg-brand-50/70 rounded-2xl border border-brand-200/60 text-xs text-brand-950 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-brand-900">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Manager Resolution Note:</span>
                  </span>
                  <p className="text-brand-900">{comp.ownerResponse}</p>
                  {comp.assignedTo?.name && (
                    <p className="text-[11px] font-semibold text-brand-700 pt-1">
                      Assigned Technician: {comp.assignedTo.name} ({comp.assignedTo.phone})
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
