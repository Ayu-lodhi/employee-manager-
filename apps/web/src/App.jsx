// ====================================================================
// App.jsx — Main Router Configuration for TBI Management System
// --------------------------------------------------------------------
// This file wires up all routes to their corresponding page components
// from pages.jsx. Route access is enforced by <ProtectedRoute> which
// checks the logged-in user's role before rendering a page.
// ====================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Core auth context + shared guards
import { AuthProvider, useAuth, ROLES, ProtectedRoute, SocketProvider } from './pages';

// All page components — grouped by module for readability
import {
  // ---------- AUTH ----------
  Login,

  // ---------- DASHBOARDS (one per role) ----------
  SuperAdminDashboard,
  AdminDashboard,
  T3DashboardEnhanced,   // T3 — richer dashboard with teams + pending apps
  T2DashboardEnhanced,   // T2 — richer dashboard with today's shift + stats
  T1Dashboard,

  // ---------- USER MANAGEMENT ----------
  UserManagement,
  BulkImportPage,

  // ---------- OPERATIONS ----------
  EventsPage,
  EventDetailPage,
  ApplicationsPage,
  MyApplicationsPage,     // Student view (T1/T2) — status tracking
  AttendancePage,
  CertificatesPage,
  TeamsPage,
  MyTeamsPage,            // T3 lead view — team members + attendance
  MyShiftsPage,           // T1/T2 view — upcoming + completed shifts

  // ---------- SUPER ADMIN ----------
  AdminManagementPage,
  AuditLogsPage,
  SessionsPage,
  AnalyticsPage,

  // ---------- COMMUNICATION ----------
  Chat,
  NotificationsPage,

  // ---------- REVIEWS ----------
  ReviewsPage,

  // ---------- UTILITIES ----------
  QRCheckIn,
  Placeholder,            // Generic "under construction" fallback
} from './pages';

// ====================================================================
// RootRedirect — Sends logged-in user to their role-specific dashboard
// ====================================================================
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLES[user.role].route} replace />;
};

// ====================================================================
// App — Root component with all route definitions
// ====================================================================
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>

          {/* ==================================================
              PUBLIC ROUTES — No authentication required
              ================================================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* ==================================================
              SUPER ADMIN ROUTES — Full system access
              ================================================== */}
          <Route path="/super-admin" element={<ProtectedRoute roles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/super-admin/admins" element={<ProtectedRoute roles={['SUPER_ADMIN']}><AdminManagementPage /></ProtectedRoute>} />
          <Route path="/super-admin/audit" element={<ProtectedRoute roles={['SUPER_ADMIN']}><AuditLogsPage /></ProtectedRoute>} />
          <Route path="/super-admin/sessions" element={<ProtectedRoute roles={['SUPER_ADMIN']}><SessionsPage /></ProtectedRoute>} />
          <Route path="/super-admin/config" element={<ProtectedRoute roles={['SUPER_ADMIN']}><Placeholder title="System Config" /></ProtectedRoute>} />
          <Route path="/super-admin/permissions" element={<ProtectedRoute roles={['SUPER_ADMIN']}><Placeholder title="Permissions" /></ProtectedRoute>} />

          {/* ==================================================
              ADMIN ROUTES — Manage events, users, certificates
              Also accessible by Super Admin (superuser override)
              ================================================== */}
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/users/new" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/users/bulk" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><BulkImportPage /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><EventsPage /></ProtectedRoute>} />
          <Route path="/admin/events/:id" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><EventDetailPage /></ProtectedRoute>} />
          <Route path="/admin/teams" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><TeamsPage /></ProtectedRoute>} />
          <Route path="/admin/shifts" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><Placeholder title="Shifts" /></ProtectedRoute>} />
          <Route path="/admin/certificates" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><CertificatesPage /></ProtectedRoute>} />

          {/* ==================================================
              T3 EXECUTIVE ROUTES — Lead teams, review, verify
              ================================================== */}
          <Route path="/t3" element={<ProtectedRoute roles={['T3_EXECUTIVE']}><T3DashboardEnhanced /></ProtectedRoute>} />
          <Route path="/t3/events/:id" element={<ProtectedRoute roles={['T3_EXECUTIVE']}><EventDetailPage /></ProtectedRoute>} />
          <Route path="/t3/teams" element={<ProtectedRoute roles={['T3_EXECUTIVE']}><MyTeamsPage /></ProtectedRoute>} />
          <Route path="/t3/applications" element={<ProtectedRoute roles={['T3_EXECUTIVE']}><ApplicationsPage /></ProtectedRoute>} />
          <Route path="/t3/attendance" element={<ProtectedRoute roles={['T3_EXECUTIVE']}><AttendancePage /></ProtectedRoute>} />
          <Route path="/t3/reviews" element={<ProtectedRoute roles={['T3_EXECUTIVE']}><ReviewsPage /></ProtectedRoute>} />

          {/* ==================================================
              T2 ASSOCIATE ROUTES — Coordinate shifts, view applications
              ================================================== */}
          <Route path="/t2" element={<ProtectedRoute roles={['T2_ASSOCIATE']}><T2DashboardEnhanced /></ProtectedRoute>} />
          <Route path="/t2/events" element={<ProtectedRoute roles={['T2_ASSOCIATE']}><EventsPage /></ProtectedRoute>} />
          <Route path="/t2/applications" element={<ProtectedRoute roles={['T2_ASSOCIATE']}><MyApplicationsPage /></ProtectedRoute>} />
          <Route path="/t2/shifts" element={<ProtectedRoute roles={['T2_ASSOCIATE']}><MyShiftsPage /></ProtectedRoute>} />
          <Route path="/t2/certificates" element={<ProtectedRoute roles={['T2_ASSOCIATE']}><CertificatesPage /></ProtectedRoute>} />

          {/* ==================================================
              T1 VOLUNTEER ROUTES — Apply, check-in, view certs
              ================================================== */}
          <Route path="/t1" element={<ProtectedRoute roles={['T1_VOLUNTEER']}><T1Dashboard /></ProtectedRoute>} />
          <Route path="/t1/checkin" element={<ProtectedRoute roles={['T1_VOLUNTEER']}><QRCheckIn /></ProtectedRoute>} />
          <Route path="/t1/events" element={<ProtectedRoute roles={['T1_VOLUNTEER']}><EventsPage /></ProtectedRoute>} />
          <Route path="/t1/applications" element={<ProtectedRoute roles={['T1_VOLUNTEER']}><MyApplicationsPage /></ProtectedRoute>} />
          <Route path="/t1/shifts" element={<ProtectedRoute roles={['T1_VOLUNTEER']}><MyShiftsPage /></ProtectedRoute>} />
          <Route path="/t1/certificates" element={<ProtectedRoute roles={['T1_VOLUNTEER']}><CertificatesPage /></ProtectedRoute>} />

          {/* ==================================================
              SHARED ROUTES — Accessible by all authenticated users
              ================================================== */}
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

          {/* ==================================================
              FALLBACK — Redirect unknown routes to role dashboard
              ================================================== */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </SocketProvider>
    </AuthProvider>
    </BrowserRouter>
  );
}

export default App;