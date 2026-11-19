import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Users,
  Utensils,
  QrCode,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

export const OwnerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get('/buildings');
        if (res.data.success) {
          const bList = res.data.buildings || [];
          setBuildings(bList);
          if (bList.length > 0) {
            const savedBld = localStorage.getItem('pgmate_active_building');
            if (savedBld && bList.some(b => b._id === savedBld)) {
              setSelectedBuildingId(savedBld);
            } else {
              setSelectedBuildingId(bList[0]._id);
              localStorage.setItem('pgmate_active_building', bList[0]._id);
            }
          } else {
            setSelectedBuildingId('');
            localStorage.removeItem('pgmate_active_building');
          }
        }

        const notifRes = await api.get('/notifications');
        if (notifRes.data.success) {
          setUnreadNotifications(notifRes.data.unreadCount || 0);
        }
      } catch (e) {
        console.error('Error fetching buildings:', e);
      }
    };

    fetchMeta();
    window.addEventListener('pgmate_buildings_updated', fetchMeta);
    return () => window.removeEventListener('pgmate_buildings_updated', fetchMeta);
  }, []);

  const handleBuildingChange = (bId) => {
    setSelectedBuildingId(bId);
    localStorage.setItem('pgmate_active_building', bId);
    window.dispatchEvent(new CustomEvent('pgmate_building_changed', { detail: { buildingId: bId } }));
  };

  const navItems = [
    { name: 'Overview', path: '/owner/overview', icon: LayoutDashboard },
    { name: 'Buildings', path: '/owner/buildings', icon: Building2 },
    { name: 'Room & Bed Grid', path: '/owner/rooms', icon: BedDouble },
    { name: 'Tenants', path: '/owner/tenants', icon: Users },
    { name: 'Food Menu', path: '/owner/menu', icon: Utensils },
    { name: 'Meal QR Scanner', path: '/owner/scanner', icon: QrCode, badge: 'Live' },
    { name: 'Food Attendance', path: '/owner/attendance', icon: CalendarCheck },
    { name: 'Rent Management', path: '/owner/rent', icon: CreditCard },
    { name: 'Complaints', path: '/owner/complaints', icon: AlertTriangle },
    { name: 'Notifications', path: '/owner/notifications', icon: Bell, count: unreadNotifications },
    { name: 'Reports & Analytics', path: '/owner/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/owner/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-lg tracking-tight">PGmate</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Owner
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[130px]">
              {user?.businessName || 'Property Portal'}
            </p>
          </div>
        </div>

        {/* Building selector dropdown */}
        {buildings.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/20">
            <label className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-1">
              Active Property
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => handleBuildingChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500 truncate"
            >
              {buildings.map((b) => (
                <option key={b._id} value={b._id} className="bg-slate-900 text-slate-200">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse-subtle">
                    {item.badge}
                  </span>
                )}
                {item.count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-brand-500 text-white">
                    {item.count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-slate-900 capitalize">
                {location.pathname.split('/')[2]?.replace('-', ' ') || 'Dashboard'}
              </h1>
              <p className="text-xs text-slate-500">
                Managing {buildings.find(b => b._id === selectedBuildingId)?.name || 'Property'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick QR Scanner Link Button */}
            <NavLink
              to="/owner/scanner"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-semibold transition-colors shadow-xs"
            >
              <QrCode className="w-4 h-4 text-brand-600" />
              <span>Open QR Scanner</span>
            </NavLink>

            <NavLink
              to="/owner/notifications"
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white" />
              )}
            </NavLink>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {buildings.length === 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-brand-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Welcome to PGmate! Let's get your PG set up</h4>
                  <p className="text-xs text-brand-100">Add your first PG building to start configuring floors, rooms, beds, and admitting residents.</p>
                </div>
              </div>
              <NavLink
                to="/owner/buildings"
                className="px-4 py-2 rounded-xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs shadow-sm flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Building Now</span>
              </NavLink>
            </div>
          )}
          <Outlet context={{ selectedBuildingId, buildings }} />
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-slate-900 text-slate-300 flex flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="font-bold text-white text-lg">PGmate Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                      isActive ? 'bg-brand-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="mt-auto flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/10 text-rose-300 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
