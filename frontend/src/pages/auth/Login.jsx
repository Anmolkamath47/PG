import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, UserCheck, KeyRound, Building } from 'lucide-react';
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
      toast.error('Please enter email/phone and password');
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

  const fillDemoAccount = (demoRole, email, pass) => {
    setRole(demoRole);
    setIdentifier(email);
    setPassword(pass);
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
                Email or Mobile Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={role === 'owner' ? 'owner@pgmate.in or 9876543210' : 'rahul@gmail.com or 9876543211'}
                  className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <a href="#demo" onClick={() => toast.info('Default password for demo accounts is Password@123')} className="text-xs text-brand-400 hover:underline">
                  Forgot?
                </a>
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

          {/* 1-Click Instant Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3 flex items-center justify-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Instant Demo Credentials</span>
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('owner', 'owner@pgmate.in', 'Password@123')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-left transition-all group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-brand-300">
                    🏢 PG Owner (Rajesh Sharma)
                  </p>
                  <p className="text-[10px] text-slate-400">owner@pgmate.in</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-brand-500/20 text-brand-300">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('tenant', 'rahul@gmail.com', 'Password@123')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-left transition-all group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                    🛏️ Tenant (Rahul Verma - Room 101)
                  </p>
                  <p className="text-[10px] text-slate-400">rahul@gmail.com</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('tenant', 'priya@gmail.com', 'Password@123')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-left transition-all group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                    🛏️ Tenant (Priya Nair - Room 102)
                  </p>
                  <p className="text-[10px] text-slate-400">priya@gmail.com</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">
                  Select
                </span>
              </button>
            </div>
          </div>

          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              New PG Owner?{' '}
              <Link to="/register" className="font-semibold text-brand-400 hover:underline">
                Register your PG
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
