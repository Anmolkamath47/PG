import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader } from '../components/common/Loader.jsx';

// Layouts
import { OwnerLayout } from '../layouts/OwnerLayout.jsx';
import { TenantLayout } from '../layouts/TenantLayout.jsx';

// Auth Pages
import { Login } from '../pages/auth/Login.jsx';
import { Register } from '../pages/auth/Register.jsx';

// Owner Pages
import { Overview } from '../pages/owner/Overview.jsx';
import { Buildings } from '../pages/owner/Buildings.jsx';
import { RoomsBeds } from '../pages/owner/RoomsBeds.jsx';
import { Tenants } from '../pages/owner/Tenants.jsx';
import { FoodMenu } from '../pages/owner/FoodMenu.jsx';
import { MealQRScanner } from '../pages/owner/MealQRScanner.jsx';
import { FoodAttendance } from '../pages/owner/FoodAttendance.jsx';
import { RentManagement } from '../pages/owner/RentManagement.jsx';
import { Complaints } from '../pages/owner/Complaints.jsx';
import { Notifications } from '../pages/owner/Notifications.jsx';
import { ReportsAnalytics } from '../pages/owner/ReportsAnalytics.jsx';
import { Settings } from '../pages/owner/Settings.jsx';

// Tenant Pages
import { TenantHome } from '../pages/tenant/TenantHome.jsx';
import { MyRoom } from '../pages/tenant/MyRoom.jsx';
import { MyMealQR } from '../pages/tenant/MyMealQR.jsx';
import { TenantFoodMenu } from '../pages/tenant/TenantFoodMenu.jsx';
import { PayRent } from '../pages/tenant/PayRent.jsx';
import { PaymentHistory } from '../pages/tenant/PaymentHistory.jsx';
import { RaiseComplaint } from '../pages/tenant/RaiseComplaint.jsx';
import { MyComplaints } from '../pages/tenant/MyComplaints.jsx';
import { TenantNotifications } from '../pages/tenant/TenantNotifications.jsx';
import { TenantProfile } from '../pages/tenant/TenantProfile.jsx';

// Protected Route wrappers
const ProtectedOwnerRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <Loader message="Authenticating..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'owner') return <Navigate to="/tenant/home" replace />;
  return children;
};

const ProtectedTenantRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <Loader message="Authenticating..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'tenant') return <Navigate to="/owner/overview" replace />;
  return children;
};

export const AppRoutes = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader message="Initializing PGmate..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            user?.role === 'owner' ? (
              <Navigate to="/owner/overview" replace />
            ) : (
              <Navigate to="/tenant/home" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'owner' ? '/owner/overview' : '/tenant/home'} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'owner' ? '/owner/overview' : '/tenant/home'} replace />
          ) : (
            <Register />
          )
        }
      />

      {/* Owner Dashboard Routes */}
      <Route
        path="/owner"
        element={
          <ProtectedOwnerRoute>
            <OwnerLayout />
          </ProtectedOwnerRoute>
        }
      >
        <Route index element={<Navigate to="/owner/overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="buildings" element={<Buildings />} />
        <Route path="rooms" element={<RoomsBeds />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="menu" element={<FoodMenu />} />
        <Route path="scanner" element={<MealQRScanner />} />
        <Route path="attendance" element={<FoodAttendance />} />
        <Route path="rent" element={<RentManagement />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="analytics" element={<ReportsAnalytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Tenant Dashboard Routes */}
      <Route
        path="/tenant"
        element={
          <ProtectedTenantRoute>
            <TenantLayout />
          </ProtectedTenantRoute>
        }
      >
        <Route index element={<Navigate to="/tenant/home" replace />} />
        <Route path="home" element={<TenantHome />} />
        <Route path="room" element={<MyRoom />} />
        <Route path="qr" element={<MyMealQR />} />
        <Route path="menu" element={<TenantFoodMenu />} />
        <Route path="rent" element={<PayRent />} />
        <Route path="payments" element={<PaymentHistory />} />
        <Route path="complaints/new" element={<RaiseComplaint />} />
        <Route path="complaints" element={<MyComplaints />} />
        <Route path="notifications" element={<TenantNotifications />} />
        <Route path="profile" element={<TenantProfile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
