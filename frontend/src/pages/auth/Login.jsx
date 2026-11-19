import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, UserCheck, Building, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export const Login = () => {
  const [role, setRole] = useState('owner'); // 'owner' or 'tenant'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!identifier || !password) {
      toast.error(role === 'tenant' ? 'Please enter your username (name@pgname) and password' : 'Please enter email/phone and password');
      return;
    }
    setLoading(true);
    try {
      const user = await login(identifier, password, role);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'owner') {
        navigate('/owner/overview');
      } else {
        navigate('/tenant/home');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">PGmate</h2>
          <p className="mt-1 text-sm text-slate-400">
            Smart Digital Management for Modern Indian PGs & Hostels
          </p>
        </div>

        {/* Auth Card */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Role Switcher Tabs */}
          <div className="flex p-1 bg-slate-800/80 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setRole('owner'); setIdentifier(''); setPassword(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                role === 'owner'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>PG Owner</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('tenant'); setIdentifier(''); setPassword(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                role === 'tenant'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Resident Tenant</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {role === 'owner' ? 'Owner Email or Mobile Number' : 'Tenant Username (name@pgname) or Mobile'}
              </label>
              <div className="relative">
                {role === 'owner' ? (
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                ) : (
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                )}
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={role === 'owner' ? 'e.g. owner@pgmate.in or 9876543210' : 'e.g. rohan@srisai or 9876543210'}
                  className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                {role === 'owner' && (
                  <span className="text-xs text-slate-500">
                    Secure credentials
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${
                role === 'owner'
                  ? 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              } disabled:opacity-50 mt-2`}
            >
              <span>{loading ? 'Verifying Credentials...' : `Sign in as ${role === 'owner' ? 'Owner' : 'Tenant'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Registration Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            {role === 'owner' ? (
              <p className="text-xs text-slate-400">
                New PG Owner?{' '}
                <Link to="/register" className="font-semibold text-brand-400 hover:underline">
                  Register your PG
                </Link>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Don't have your login credentials yet?{' '}
                <span className="text-slate-300 font-medium">
                  Contact your PG Owner to obtain your admission slip.
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
