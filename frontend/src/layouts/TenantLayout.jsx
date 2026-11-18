import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Bed,
  QrCode,
  UtensilsCrossed,
  CreditCard,
  History,
  AlertCircle,
  FileQuestion,
  Bell,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

export const TenantLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setUnreadNotifications(res.data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
  }, []);

  const navItems = [
    { name: 'Home', path: '/tenant/home', icon: Home },
    { name: 'My Room', path: '/tenant/room', icon: Bed },
    { name: 'My Meal QR', path: '/tenant/qr', icon: QrCode, highlight: true },
    { name: 'Food Menu', path: '/tenant/menu', icon: UtensilsCrossed },
    { name: 'Pay Rent', path: '/tenant/rent', icon: CreditCard },
    { name: 'Payment History', path: '/tenant/payments', icon: History },
    { name: 'Raise Issue', path: '/tenant/complaints/new', icon: AlertCircle },
    { name: 'My Complaints', path: '/tenant/complaints', icon: FileQuestion },
    { name: 'Notifications', path: '/tenant/notifications', icon: Bell, count: unreadNotifications },
    { name: 'My Profile', path: '/tenant/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-shrink-0 select-none">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-lg tracking-tight">PGmate</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Resident
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Tenant Portal</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                    : item.highlight
                    ? 'text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                    Daily QR
                  </span>
                )}
                {item.count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500 text-white">
                    {item.count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={user?.name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8 z-10">
          <div>
            <h1 className="text-base font-bold text-slate-900 capitalize">
              {location.pathname.split('/')[2]?.replace('-', ' ') || 'Home'}
            </h1>
            <p className="text-xs text-slate-500">Welcome, {user?.name}</p>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/tenant/qr"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors shadow-xs"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>My Meal QR</span>
            </NavLink>

            <NavLink
              to="/tenant/notifications"
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
              )}
            </NavLink>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-2 md:hidden shadow-lg">
        <NavLink
          to="/tenant/home"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] font-medium ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/tenant/menu"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] font-medium ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`
          }
        >
          <UtensilsCrossed className="w-5 h-5 mb-0.5" />
          <span>Food</span>
        </NavLink>

        {/* Highlighted QR Button */}
        <NavLink
          to="/tenant/qr"
          className="flex flex-col items-center text-[10px] font-bold text-white -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 ring-4 ring-white">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <span className="text-emerald-700 mt-1">Meal QR</span>
        </NavLink>

        <NavLink
          to="/tenant/rent"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] font-medium ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`
          }
        >
          <CreditCard className="w-5 h-5 mb-0.5" />
          <span>Pay Rent</span>
        </NavLink>

        <NavLink
          to="/tenant/profile"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] font-medium ${
              isActive ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};
