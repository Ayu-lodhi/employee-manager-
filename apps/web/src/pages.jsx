// ====================================================================
// pages.jsx — All Page Components for TBI Management System
// ====================================================================

import React, { useState, createContext, useContext, useEffect } from 'react';
import { Navigate, NavLink, useNavigate } from 'react-router-dom';
import api from './lib/api';
import {
  LayoutDashboard, Users, ScrollText, Monitor, Settings, Shield, FileText,
  User as UserIcon, LogOut, Calendar, TrendingUp, UserPlus, Upload,
  UsersRound, Clock, Award, CheckCircle, MessageSquare, Star, Bell,
  Search, Mail, Lock, Plus, X, QrCode, ChevronLeft, Crown, AlertTriangle,
  Info, Trash2, Construction, MapPin, Timer, BarChart3
} from 'lucide-react';

// ====================================================================
// AUTH CONTEXT
// ====================================================================
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('tbi_user');
      const storedToken = localStorage.getItem('tbi_token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('tbi_user');
      localStorage.removeItem('tbi_token');
    } finally {
      setInitializing(false);
    }
  }, []);

  const login = (u, t) => {
    setUser(u);
    localStorage.setItem('tbi_user', JSON.stringify(u));
    localStorage.setItem('tbi_token', t);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tbi_user');
    localStorage.removeItem('tbi_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};

// ====================================================================
// ROLES
// ====================================================================
export const ROLES = {
  SUPER_ADMIN: { label: 'Super Admin', code: 'SA', color: '#F44336', sidebarBg: '#111827', route: '/super-admin' },
  ADMIN: { label: 'Admin', code: 'AD', color: '#FF9800', sidebarBg: '#0F172A', route: '/admin' },
  T3_EXECUTIVE: { label: 'T3 Executive', code: 'T3', color: '#9C27B0', sidebarBg: '#1E1B4B', route: '/t3' },
  T2_ASSOCIATE: { label: 'T2 Associate', code: 'T2', color: '#2196F3', sidebarBg: '#0C4A6E', route: '/t2' },
  T1_VOLUNTEER: { label: 'T1 Volunteer', code: 'T1', color: '#4CAF50', sidebarBg: '#064E3B', route: '/t1' },
};

// ====================================================================
// SIDEBAR MENUS
// ====================================================================
const MENUS = {
  SUPER_ADMIN: [
    {
      section: 'OVERVIEW', items: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/super-admin' },
        { icon: TrendingUp, label: 'Analytics', to: '/admin/analytics' },
      ]
    },
    {
      section: 'MANAGEMENT', items: [
        { icon: Users, label: 'Users', to: '/admin/users', badge: 2 },
        { icon: UserPlus, label: 'Add User', to: '/admin/users/new' },
        { icon: Upload, label: 'Bulk Import', to: '/admin/users/bulk' },
      ]
    },
    {
      section: 'OPERATIONS', items: [
        { icon: Calendar, label: 'Events', to: '/admin/events', badge: 5 },
        { icon: UsersRound, label: 'Teams', to: '/admin/teams' },
        { icon: Award, label: 'Certificates', to: '/admin/certificates', badge: 12 },
      ]
    },
    {
      section: 'SYSTEM CONTROL', items: [
        { icon: UserIcon, label: 'Admins', to: '/super-admin/admins' },
        { icon: ScrollText, label: 'Audit Logs', to: '/super-admin/audit', badge: 3 },
        { icon: Monitor, label: 'Sessions', to: '/super-admin/sessions' },
        { icon: UserIcon, label: 'My Profile', to: '/profile' },
      ]
    },
  ],
  ADMIN: [
    {
      section: 'OVERVIEW', items: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
        { icon: TrendingUp, label: 'Analytics', to: '/admin/analytics' },
      ]
    },
    {
      section: 'MANAGEMENT', items: [
        { icon: Users, label: 'Users', to: '/admin/users', badge: 2 },
        { icon: UserPlus, label: 'Add User', to: '/admin/users/new' },
        { icon: Upload, label: 'Bulk Import', to: '/admin/users/bulk' },
      ]
    },
    {
      section: 'OPERATIONS', items: [
        { icon: Calendar, label: 'Events', to: '/admin/events', badge: 5 },
        { icon: UsersRound, label: 'Teams', to: '/admin/teams' },
        { icon: Award, label: 'Certificates', to: '/admin/certificates', badge: 12 },
      ]
    },
    {
      section: 'ACCOUNT', items: [
        { icon: UserIcon, label: 'My Profile', to: '/profile' },
      ]
    },
  ],
  T3_EXECUTIVE: [
    {
      section: 'MY WORKSPACE', items: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/t3' },
        { icon: UsersRound, label: 'My Teams', to: '/t3/teams', badge: 3 },
        { icon: FileText, label: 'Applications', to: '/t3/applications', badge: 12 },
        { icon: CheckCircle, label: 'Attendance', to: '/t3/attendance' },
      ]
    },
    {
      section: 'COMMUNICATION', items: [
        { icon: MessageSquare, label: 'Team Chats', to: '/chat', badge: 2 },
        { icon: Star, label: 'Submit Review', to: '/t3/reviews' },
      ]
    },
    {
      section: 'ACCOUNT', items: [
        { icon: UserIcon, label: 'My Profile', to: '/profile' },
      ]
    },
  ],
  T2_ASSOCIATE: [
    {
      section: 'MY WORKSPACE', items: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/t2' },
        { icon: Calendar, label: 'Browse Events', to: '/t2/events' },
        { icon: FileText, label: 'My Applications', to: '/t2/applications', badge: 3 },
        { icon: Clock, label: 'My Shifts', to: '/t2/shifts' },
      ]
    },
    {
      section: 'COMMUNICATION', items: [
        { icon: MessageSquare, label: 'Team Chats', to: '/chat', badge: 2 },
      ]
    },
    {
      section: 'ACHIEVEMENTS', items: [
        { icon: Award, label: 'Certificates', to: '/t2/certificates' },
        { icon: UserIcon, label: 'My Profile', to: '/profile' },
      ]
    },
  ],
  T1_VOLUNTEER: [
    {
      section: 'MY WORKSPACE', items: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/t1' },
        { icon: Calendar, label: 'Browse Events', to: '/t1/events' },
        { icon: QrCode, label: 'QR Check-In', to: '/t1/checkin' },
        { icon: Award, label: 'Certificates', to: '/t1/certificates' },
      ]
    },
    {
      section: 'COMMUNICATION', items: [
        { icon: MessageSquare, label: 'Team Chats', to: '/chat', badge: 2 },
        { icon: Star, label: 'My Reviews', to: '/t1/reviews' },
        { icon: UserIcon, label: 'My Profile', to: '/profile' },
      ]
    },
  ],
};

// ====================================================================
// LOGIN
// ====================================================================
export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Login failed');
      login(data.data.user, data.data.accessToken);
      navigate(ROLES[data.data.user.role].route);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <h1 className="text-3xl font-bold text-gray-900">TBI</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tbi.org" required autoFocus
                  className="w-full h-12 pl-10 pr-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="********" required
                  className="w-full h-12 pl-10 pr-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
            </div>
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium rounded-lg transition">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3 text-center">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => quickLogin('super@tbi.org', 'super123')} className="text-xs py-2 px-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 font-medium">Super Admin</button>
              <button onClick={() => quickLogin('admin@tbi.org', 'admin123')} className="text-xs py-2 px-2 bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 font-medium">Admin</button>
              <button onClick={() => quickLogin('mayank@tbi.org', 'mayank123')} className="text-xs py-2 px-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 font-medium">T3 Exec</button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => quickLogin('abhishek@tbi.org', 'abhishek123')} className="text-xs py-2 px-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-medium">T2 Assoc</button>
              <button onClick={() => quickLogin('ayush@tbi.org', 'ayush123')} className="text-xs py-2 px-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 font-medium">T1 Vol</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// SIDEBAR
// ====================================================================
export const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const cfg = ROLES[user.role];
  const menus = MENUS[user.role];

  return (
    <aside className={`h-screen flex flex-col border-r border-white/10 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ backgroundColor: cfg.sidebarBg }}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: cfg.color }} />
          {!collapsed && <span className="text-white font-bold text-lg">TBI</span>}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white">
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {!collapsed && (
        <div className="p-3">
          <div className="rounded-xl p-3 border" style={{ backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }}>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: cfg.color }}>
                {cfg.code}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <span className="text-[10px] text-white/80">{cfg.label}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {menus.map((sec) => (
          <div key={sec.section}>
            {!collapsed && <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-3 pt-5 pb-2">{sec.section}</p>}
            {sec.items.map((item) => (
              <NavLink key={item.to} to={item.to} end
                className={({ isActive }) => `flex items-center gap-3 h-10 px-3 rounded-lg text-sm transition-colors ${isActive ? 'text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                style={({ isActive }) => isActive ? { backgroundColor: `${cfg.color}25`, borderLeft: `3px solid ${cfg.color}` } : {}}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {item.badge && !collapsed && (
                  <span className="text-white text-[10px] rounded-full px-1.5 py-0.5" style={{ backgroundColor: cfg.color }}>{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <button onClick={() => { logout(); navigate('/login'); }}
        className="flex items-center gap-3 h-12 px-4 border-t border-white/10 text-gray-300 hover:bg-white/5 hover:text-white">
        <LogOut className="w-5 h-5" />
        {!collapsed && <span className="text-sm">Logout</span>}
      </button>
    </aside>
  );
};

// ====================================================================
// TOPBAR
// ====================================================================
export const Topbar = () => {
  const { user } = useAuth();
  const cfg = ROLES[user.role];
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search className="w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-sm" />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-gray-100">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-4 h-4 text-[10px] rounded-full text-white flex items-center justify-center" style={{ backgroundColor: cfg.color }}>3</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: cfg.color }}>
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">{cfg.label}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

// ====================================================================
// LAYOUT
// ====================================================================
export const Layout = ({ children }) => (
  <div className="flex h-screen overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
    </div>
  </div>
);

// ====================================================================
// SHARED
// ====================================================================
export const KPI = ({ label, value, change }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-3xl font-bold mt-2">{value}</p>
    {change && <p className="text-xs text-green-500 mt-1">+{change}</p>}
  </div>
);

export const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-96 text-center">
    <Construction className="w-16 h-16 text-gray-300 mb-4" />
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-gray-500">This page is under construction</p>
  </div>
);

export const ProtectedRoute = ({ children, roles }) => {
  const { user, initializing } = useAuth();

  // Wait for localStorage to be read before deciding
  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLES[user.role].route} replace />;
  }
  return <Layout>{children}</Layout>;
};


// ====================================================================
// DASHBOARDS
// ====================================================================
export const AdminDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Good morning, {user.name.split(' ')[0]}</h1>
        <p className="text-gray-500">Here's what's happening today.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total Users" value="245" change="12%" />
        <KPI label="Active Events" value="12" change="3" />
        <KPI label="Approval Rate" value="89%" change="5%" />
        <KPI label="Certificates" value="156" change="18" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-gray-500" /> Users by Tier</h3>
          <div className="space-y-3">
            {[
              { label: 'T1 Volunteers', value: 180, color: 'bg-green-500', pct: 74 },
              { label: 'T2 Associates', value: 45, color: 'bg-blue-500', pct: 18 },
              { label: 'T3 Executives', value: 18, color: 'bg-purple-500', pct: 7 },
              { label: 'Admins', value: 2, color: 'bg-orange-500', pct: 1 },
            ].map((t) => (
              <div key={t.label}>
                <div className="flex justify-between text-sm mb-1"><span>{t.label}</span><span className="font-medium">{t.value}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${t.color}`} style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-gray-500" /> Applications Trend</h3>
          <div className="h-48 flex items-end gap-2">
            {[12, 19, 15, 25, 32, 28, 40].map((v, i) => (
              <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(v / 40) * 100}%` }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
      <p className="text-gray-500">Full system overview and admin actions.</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Admins" value="5" />
        <KPI label="Total Users" value="245" change="12%" />
        <KPI label="Active Events" value="12" change="3" />
        <KPI label="Active Sessions" value="18" />
      </div>
    </div>
  );
};

export const T1Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Hi {user.name.split(' ')[0]}</h1>
        <p className="text-gray-500">You have 1 shift today.</p>
      </div>
      <div className="bg-white rounded-xl border-l-4 border-l-green-500 border border-gray-200 p-6">
        <p className="text-sm font-semibold text-green-600 mb-3">TODAY'S SHIFT</p>
        <h3 className="text-xl font-bold mb-4">Tech Team — Hackathon 2026</h3>
        <p className="text-sm text-gray-600 mb-1">9:00 AM - 1:00 PM</p>
        <p className="text-sm text-gray-600 mb-5">Booth 3, Main Auditorium</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/t1/checkin')} className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">Check In Now</button>
          <button onClick={() => navigate('/chat')} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Open Chat</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KPI label="Events" value="5" />
        <KPI label="Approved" value="4" />
        <KPI label="Certificates" value="2" />
      </div>
    </div>
  );
};

// ====================================================================
// USER MANAGEMENT — Connected to real backend
// ====================================================================
export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'T1_VOLUNTEER' });
  const [saving, setSaving] = useState(false);
  const [revokeModal, setRevokeModal] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeNotes, setRevokeNotes] = useState('');

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data.data);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Create user via API
  const addUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/users', form);
      setUsers([res.data.data, ...users]);
      setModal(false);
      setForm({ name: '', email: '', phone: '', role: 'T1_VOLUNTEER' });
      if (res.data.tempPassword) {
        alert(`✅ User created!\n\nTemporary password: ${res.data.tempPassword}\n\n(In production, this is sent via email + SMS.)`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  // Revoke access via API
  const revokeUser = async (e) => {
    e.preventDefault();
    if (!revokeReason) return alert('Please select a reason');
    try {
      await api.post(`/admin/users/${revokeModal._id}/revoke`, {
        reason: revokeReason,
        notes: revokeNotes,
      });
      setUsers(users.filter(u => u._id !== revokeModal._id));
      setRevokeModal(null);
      setRevokeReason('');
      setRevokeNotes('');
      alert(`🚫 ${revokeModal.name}'s access has been revoked.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleLabel = { T1_VOLUNTEER: 'T1', T2_ASSOCIATE: 'T2', T3_EXECUTIVE: 'T3', ADMIN: 'AD', SUPER_ADMIN: 'SA' };
  const roleColor = {
    T1_VOLUNTEER: 'bg-green-100 text-green-700',
    T2_ASSOCIATE: 'bg-blue-100 text-blue-700',
    T3_EXECUTIVE: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-orange-100 text-orange-700',
    SUPER_ADMIN: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500">Manage all users and their roles</p>
        </div>
        <button onClick={() => setModal(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">+ Add User</button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..." className="flex-1 bg-transparent border-none outline-none text-sm" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>}
        </div>
      </div>

      {/* Users table */}
      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColor[u.role]}`}>{roleLabel[u.role]}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button onClick={() => setRevokeModal(u)} className="text-red-500 hover:underline">Revoke</button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No users match your search</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-5">Add New User</h3>
            <form onSubmit={addUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone (optional)</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none">
                  <option value="T1_VOLUNTEER">T1 Volunteer</option>
                  <option value="T2_ASSOCIATE">T2 Associate</option>
                  <option value="T3_EXECUTIVE">T3 Executive</option>
                </select>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-start gap-2">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <span>A default password will be generated and shown after creation.</span>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRevokeModal(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Revoke Access — {revokeModal.name}</h3>
                <p className="text-xs text-gray-500">{revokeModal.email}</p>
              </div>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-800 font-medium mb-2">This action will:</p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>Immediately end all active sessions</li>
                <li>Remove access to all events and teams</li>
                <li>Log this action for audit (immutable)</li>
              </ul>
            </div>
            <form onSubmit={revokeUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Reason *</label>
                <select required value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none">
                  <option value="">Select a reason...</option>
                  <option value="Policy Violation">Policy Violation</option>
                  <option value="Security Breach">Security Breach</option>
                  <option value="Role Change">Role Change</option>
                  <option value="Resignation">Resignation</option>
                  <option value="Inactive Account">Inactive Account</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Additional Notes</label>
                <textarea required minLength={10} rows={3} value={revokeNotes} onChange={(e) => setRevokeNotes(e.target.value)}
                  placeholder="Reason details (min 10 characters)..."
                  className="w-full p-3 rounded-lg border border-gray-200 outline-none resize-none" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setRevokeModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">Revoke Access</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================================
// CHAT
// ====================================================================
export const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const roomId = 'tech-team-hackathon-2026';
  const roomName = 'Tech Team — Hackathon 2026';

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/chat/rooms/${roomId}/messages`);
        setMessages(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const send = async () => {
    if (!message.trim()) return;
    try {
      const res = await api.post('/chat/messages', { roomId, roomName, text: message });
      setMessages([...messages, res.data.data]);
      setMessage('');
    } catch (err) { alert('Failed to send'); }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      <div className="w-72 bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold mb-4">Rooms</h3>
        <div className="p-3 rounded-lg cursor-pointer bg-blue-50 border-l-4 border-blue-500">
          <p className="font-medium text-sm">Tech Team</p>
          <p className="text-xs text-gray-500">Hackathon 2026</p>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold">{roomName}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? <Skeleton className="h-8 w-64" /> : messages.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Say hello!</p>
          ) : messages.map((m) => {
            const own = m.senderId === user._id;
            return (
              <div key={m._id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl ${own ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                  {!own && <p className="text-xs font-semibold mb-1 opacity-70">{m.senderName}</p>}
                  <p className="text-sm">{m.text}</p>
                  <p className={`text-[10px] mt-1 ${own ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <input value={message} onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message..."
            className="flex-1 h-10 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
          <button onClick={send} className="px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Send</button>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// QR CHECK-IN
// ====================================================================
export const QRCheckIn = () => (
  <div className="max-w-md mx-auto space-y-6">
    <h1 className="text-2xl font-bold">Check-In — Tech Team</h1>
    <div className="bg-gray-900 rounded-xl aspect-square flex items-center justify-center">
      <div className="w-64 h-64 border-4 border-green-400 rounded-lg flex items-center justify-center">
        <QrCode className="w-32 h-32 text-white/50" />
      </div>
    </div>
  </div>
);

// ====================================================================
// EVENTS — Role-aware (Admin creates, T1/T2 review)
// ====================================================================
export const EventsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  const [events, setEvents] = useState([
    { _id: '1', title: 'Annual Tech Fest 2026', date: 'Oct 15-17', location: 'Main Auditorium', status: 'published', teams: 3, applicants: 45 },
    { _id: '2', title: 'Startup Pitch Day', date: 'Nov 5', location: 'Innovation Hub', status: 'published', teams: 2, applicants: 28 },
  ]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', location: '' });
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, feedback: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const addEvent = (e) => {
    e.preventDefault();
    setEvents([...events, { _id: Date.now().toString(), ...form, status: 'draft', teams: 0, applicants: 0 }]);
    setModal(false);
    setForm({ title: '', date: '', location: '' });
  };

  const submitReview = (e) => {
    e.preventDefault();
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewModal(null);
      setReviewSubmitted(false);
      setReviewForm({ rating: 5, feedback: '' });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-gray-500">
            {canCreate ? 'Create and manage all TBI events' : 'Browse events and share your feedback'}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setModal(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
            + Create Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((ev) => (
          <div key={ev._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
            <div onClick={() => canCreate && navigate(`/admin/events/${ev._id}`)} className={canCreate ? 'cursor-pointer' : ''}>
              <h3 className="font-semibold text-lg mb-2">{ev.title}</h3>
              <p className="text-sm text-gray-500">{ev.date}</p>
              <p className="text-sm text-gray-500 mb-3">{ev.location}</p>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{ev.status}</span>
            </div>
            {!canCreate && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => setReviewModal(ev)} className="w-full px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 flex items-center justify-center gap-2">
                  <Star size={14} /> Review Event Feedback
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-5">Create Event</h3>
            <form onSubmit={addEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Event Title</label>
                <input required placeholder="e.g. Annual Tech Fest 2026" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date</label>
                  <input type="date" required value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Location</label>
                  <input required placeholder="e.g. Main Auditorium" value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReviewModal(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
            {reviewSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Thanks for your feedback!</h3>
                <p className="text-gray-500">Your review helps improve future events.</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-semibold">Review Event</h3>
                    <p className="text-sm text-gray-500">{reviewModal.title}</p>
                  </div>
                  <button onClick={() => setReviewModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <form onSubmit={submitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">How would you rate this event?</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })} className="p-1">
                          <Star size={32} className={n <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {reviewForm.rating === 5 ? 'Excellent' : reviewForm.rating === 4 ? 'Good' : reviewForm.rating === 3 ? 'Average' : reviewForm.rating === 2 ? 'Below expectations' : 'Poor'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Your Feedback</label>
                    <textarea required rows={4} value={reviewForm.feedback}
                      onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                      placeholder="What did you think about this event?"
                      className="w-full p-3 rounded-lg border border-gray-200 outline-none resize-none focus:border-purple-500" />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setReviewModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 flex items-center gap-2">
                      <Star size={16} /> Submit Review
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================================
// MY REVIEWS
// ====================================================================
export const MyReviewsPage = () => {
  const reviews = [
    { _id: '1', event: 'Hackathon 2026', rating: 5, feedback: 'Excellent organization. Learned a lot from the mentors.', date: 'Oct 17, 2026' },
    { _id: '2', event: 'Startup Pitch Day', rating: 4, feedback: 'Great event. Would love more networking time.', date: 'Nov 5, 2026' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Reviews</h1>
        <p className="text-gray-500">Feedback you've submitted for events</p>
      </div>
      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
          <p className="text-gray-500">Attend an event and share your feedback</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{r.event}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Submitted {r.date}</p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">{r.feedback}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ====================================================================
// APPLICATIONS — Connected to real backend
// ====================================================================
export const ApplicationsPage = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/applications');
        setApps(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/applications/${id}/status`, { status });
      setApps(apps.map(a => a._id === id ? { ...a, status } : a));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const statusColor = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    waitlisted: 'bg-blue-100 text-blue-700',
  };

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><SkeletonTable rows={3} cols={3} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applications</h1>
        <p className="text-gray-500">Review and approve student applications</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {apps.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
          </div>
        ) : apps.map((a, i) => (
          <div key={a._id} className={`p-5 flex items-center justify-between ${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {a.studentName?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{a.studentName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[a.status]}`}>{a.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{a.studentEmail}</p>
                <p className="text-sm text-gray-600 mt-1">{a.eventTitle} / {a.role}</p>
              </div>
            </div>
            {a.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => updateStatus(a._id, 'approved')} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">Approve</button>
                <button onClick={() => updateStatus(a._id, 'rejected')} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">Reject</button>
                <button onClick={() => updateStatus(a._id, 'waitlisted')} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Waitlist</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ====================================================================
// ATTENDANCE
// ====================================================================
export const AttendancePage = () => {
  const [showQR, setShowQR] = useState(false);
  const members = [
    { name: 'Ayush', status: 'present', time: '9:02 AM' },
    { name: 'Abhishek Singh', status: 'present', time: '9:05 AM' },
    { name: 'Mayank', status: 'late', time: '9:22 AM' },
    { name: 'Karan Singh', status: 'absent', time: '--' },
    { name: 'Anjali Verma', status: 'present', time: '8:58 AM' },
  ];
  const statusColor = {
    present: 'bg-green-100 text-green-700',
    late: 'bg-amber-100 text-amber-700',
    absent: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-gray-500">Tech Team / Hackathon 2026 / 9:00 AM - 1:00 PM</p>
        </div>
        <button onClick={() => setShowQR(!showQR)} className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 flex items-center gap-2">
          <QrCode size={16} /> {showQR ? 'Hide' : 'Generate'} QR
        </button>
      </div>

      {showQR && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center">
          <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <QrCode className="w-32 h-32 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mt-4">Students scan this QR code to check in</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Present</p>
          <p className="text-3xl font-bold mt-2 text-green-600">{members.filter(m => m.status === 'present').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Late</p>
          <p className="text-3xl font-bold mt-2 text-amber-600">{members.filter(m => m.status === 'late').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Absent</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{members.filter(m => m.status === 'absent').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check-in</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{m.name}</td>
                <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[m.status]}`}>{m.status}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{m.time}</td>
                <td className="px-6 py-4 text-sm"><button className="text-blue-500 hover:underline">Mark Present</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ====================================================================
// CERTIFICATES
// ====================================================================
export const CertificatesPage = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/certificates/me');
        setCerts(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <SkeletonCardGrid count={3} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Certificates</h1>
        <p className="text-gray-500">Download certificates from completed events</p>
      </div>
      {certs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
          <p className="text-gray-500">Attend events to earn certificates</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
              <div className="h-40 bg-gradient-to-br from-amber-400 to-orange-500 flex flex-col items-center justify-center">
                <Award className="w-16 h-16 text-white mb-2" />
                <p className="text-white font-bold text-sm">CERTIFICATE</p>
              </div>
              <div className="p-5">
                <h3 className="font-semibold mb-1">{c.eventTitle}</h3>
                <p className="text-sm text-gray-500 mb-1">{c.role}</p>
                <p className="text-xs text-gray-400 mb-4">ID: {c.certificateId}</p>
                <button className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Download PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ====================================================================
// NOTIFICATIONS
// ====================================================================
export const NotificationsPage = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/notifications');
        setNotifs(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const iconFor = (type) => {
    if (type === 'application') return <FileText className="w-5 h-5 text-blue-500" />;
    if (type === 'chat') return <MessageSquare className="w-5 h-5 text-green-500" />;
    if (type === 'certificate') return <Award className="w-5 h-5 text-amber-500" />;
    return <CheckCircle className="w-5 h-5 text-purple-500" />;
  };

  if (loading) return <SkeletonTable rows={4} cols={2} />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-gray-500">Stay updated on your activities</p>
      </div>
      {notifs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {notifs.map((n, i) => (
            <div key={n._id} className={`p-4 flex gap-4 items-start ${i > 0 ? 'border-t border-gray-100' : ''} ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                {iconFor(n.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ====================================================================
// REVIEWS
// ====================================================================
export const ReviewsPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ studentName: '', rating: 5, feedback: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/reviews');
        setReviews(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/reviews', {
        studentId: user._id,
        studentName: form.studentName,
        rating: form.rating,
        feedback: form.feedback,
      });
      setReviews([res.data.data, ...reviews]);
      setModal(false);
      setForm({ studentName: '', rating: 5, feedback: '' });
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <SkeletonTable rows={3} cols={2} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-gray-500">Submit performance reviews for team members</p>
        </div>
        <button onClick={() => setModal(true)} className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">+ Submit Review</button>
      </div>
      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                    {r.studentName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{r.studentName}</p>
                    <p className="text-xs text-gray-500">By {r.reviewerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">{r.feedback}</p>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-5">Submit Review</h3>
            <form onSubmit={submitReview} className="space-y-4">
              <input required placeholder="Student Name" value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} className="p-1">
                    <Star size={28} className={n <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
              <textarea required rows={4} value={form.feedback}
                onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                placeholder="Write your feedback..."
                className="w-full p-3 rounded-lg border border-gray-200 outline-none resize-none" />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-lg">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================================
// AUDIT LOGS
// ====================================================================
export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/super-admin/audit-logs');
        setLogs(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const actionColor = {
    USER_CREATED: 'bg-green-100 text-green-700',
    ACCESS_REVOKED: 'bg-red-100 text-red-700',
    EVENT_CREATED: 'bg-blue-100 text-blue-700',
    USER_DELETED: 'bg-red-100 text-red-700',
  };

  if (loading) return <SkeletonTable rows={5} cols={6} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-gray-500">Every admin action is permanently logged</p>
      </div>
      {logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ScrollText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No logs yet</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">By</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Resource</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">IP</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((l) => (
                <tr key={l._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${actionColor[l.action] || 'bg-gray-100 text-gray-700'}`}>{l.action}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{l.performedByName || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">{l.method} {l.resource}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 font-mono text-xs">{l.ipAddress}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{new Date(l.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ====================================================================
// ADMIN MANAGEMENT
// ====================================================================
export const AdminManagementPage = () => {
  const admins = [
    { _id: '1', name: 'Rajesh Kumar', email: 'admin@tbi.org', createdBy: 'Shrey Mehra', created: '3 months ago' },
    { _id: '2', name: 'Neha Gupta', email: 'neha@tbi.org', createdBy: 'Shrey Mehra', created: '2 months ago' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Management</h1>
        <p className="text-gray-500">Manage all system administrators</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created By</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admins.map((a) => (
              <tr key={a._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{a.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{a.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{a.createdBy}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{a.created}</td>
                <td className="px-6 py-4 text-sm"><button className="text-red-500 hover:underline">Revoke</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ====================================================================
// ANALYTICS
// ====================================================================
export const AnalyticsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-gray-500">Insights and trends across the platform</p>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPI label="Total Users" value="245" change="12%" />
      <KPI label="Events This Month" value="8" change="2" />
      <KPI label="Certificates Issued" value="156" change="18" />
      <KPI label="Avg Attendance" value="87%" change="3%" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white p-5 rounded-xl border border-gray-200">
        <h3 className="font-semibold mb-4">Users by Tier</h3>
        <div className="space-y-3">
          {[
            { label: 'T1 Volunteers', value: 180, color: 'bg-green-500', pct: 74 },
            { label: 'T2 Associates', value: 45, color: 'bg-blue-500', pct: 18 },
            { label: 'T3 Executives', value: 18, color: 'bg-purple-500', pct: 7 },
            { label: 'Admins', value: 2, color: 'bg-orange-500', pct: 1 },
          ].map((t) => (
            <div key={t.label}>
              <div className="flex justify-between text-sm mb-1"><span>{t.label}</span><span className="font-medium">{t.value}</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${t.color}`} style={{ width: `${t.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200">
        <h3 className="font-semibold mb-4">Monthly Applications</h3>
        <div className="h-48 flex items-end gap-2">
          {[35, 48, 52, 41, 60, 72, 68, 85, 78, 92, 88, 95].map((v, i) => (
            <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(v / 100) * 100}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>
    </div>
  </div>
);

// ====================================================================
// BULK IMPORT
// ====================================================================
export const BulkImportPage = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];
    const errs = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
      const rowErrors = [];
      if (!row.name) rowErrors.push('Missing name');
      if (!row.email) rowErrors.push('Missing email');
      if (row.email && !/^\S+@\S+\.\S+$/.test(row.email)) rowErrors.push('Invalid email');
      if (!row.role) rowErrors.push('Missing role');
      if (row.role && !['T1_VOLUNTEER', 'T2_ASSOCIATE', 'T3_EXECUTIVE'].includes(row.role.toUpperCase())) {
        rowErrors.push('Invalid role');
      }
      rows.push({ ...row, _line: i + 1, _errors: rowErrors });
      if (rowErrors.length > 0) errs.push({ line: i + 1, errors: rowErrors });
    }
    return { rows, errs };
  };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setDone(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows, errs } = parseCSV(e.target.result);
      setPreview(rows);
      setErrors(errs);
    };
    reader.readAsText(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = () => {
    if (preview.length === 0) return;
    setImporting(true);
    setProgress(0);
    const total = preview.length;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      setProgress(Math.round((current / total) * 100));
      if (current >= total) {
        clearInterval(timer);
        setTimeout(() => { setImporting(false); setDone(true); }, 400);
      }
    }, 80);
  };

  const reset = () => {
    setFile(null); setPreview([]); setErrors([]); setDone(false); setProgress(0);
  };

  const validRows = preview.filter(r => r._errors.length === 0);
  const invalidRows = preview.filter(r => r._errors.length > 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Bulk Import Users</h1>
        <p className="text-gray-500">Upload a CSV file to create multiple users at once</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">CSV Format Required</p>
          <p className="text-xs mb-2">Header row: <code className="bg-white px-1.5 py-0.5 rounded">name,email,phone,role</code></p>
          <p className="text-xs">Valid roles: <code className="bg-white px-1 rounded">T1_VOLUNTEER</code> <code className="bg-white px-1 rounded">T2_ASSOCIATE</code> <code className="bg-white px-1 rounded">T3_EXECUTIVE</code></p>
        </div>
      </div>

      {!file && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`bg-white rounded-xl border-2 border-dashed transition cursor-pointer p-12 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}
          onClick={() => document.getElementById('csv-input').click()}
        >
          <input id="csv-input" type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="font-medium mb-1">Drop your CSV file here</p>
          <p className="text-sm text-gray-500">or click to browse</p>
        </div>
      )}

      {file && !done && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{preview.length} rows · {validRows.length} valid · {invalidRows.length} errors</p>
              </div>
            </div>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"><X size={14} /> Remove</button>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle size={16} /> {errors.length} rows have errors
              </p>
              <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                {errors.slice(0, 5).map((e, i) => <li key={i}>Line {e.line}: {e.errors.join(', ')}</li>)}
                {errors.length > 5 && <li className="italic">...and {errors.length - 5} more</li>}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Preview ({preview.length} rows)</h3>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Line</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.map((r, i) => (
                    <tr key={i} className={r._errors.length > 0 ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2 text-xs text-gray-500">{r._line}</td>
                      <td className="px-4 py-2 text-sm">{r.name || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{r.email || '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{r.phone || '—'}</td>
                      <td className="px-4 py-2 text-sm"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{r.role || '—'}</span></td>
                      <td className="px-4 py-2 text-sm">
                        {r._errors.length === 0 ? (
                          <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Valid</span>
                        ) : (
                          <span className="text-xs text-red-600 flex items-center gap-1"><X size={12} /> Error</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-medium">{validRows.length} valid rows will be imported</p>
              {invalidRows.length > 0 && <p className="text-xs text-gray-500">{invalidRows.length} rows will be skipped</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleImport} disabled={validRows.length === 0 || importing}
                className="px-5 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50">
                {importing ? `Importing ${progress}%` : `Import ${validRows.length} Users`}
              </button>
            </div>
          </div>

          {importing && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {done && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Import Complete</h3>
          <p className="text-gray-500 mb-6">{validRows.length} users created successfully{invalidRows.length > 0 && `, ${invalidRows.length} skipped`}</p>
          <div className="flex gap-3 justify-center">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Download Report</button>
            <button onClick={reset} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Import Another</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================================
// TEAMS — Create teams, add members, view details
// ====================================================================
export const TeamsPage = () => {
  const { user } = useAuth();
  const canManage = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [addMemberModal, setAddMemberModal] = useState(null); // team obj
  const [detailModal, setDetailModal] = useState(null);       // team obj
  const [form, setForm] = useState({ name: '', description: '', leadId: '' });
  const [memberSearch, setMemberSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch teams + users on mount
  useEffect(() => {
    (async () => {
      try {
        const [teamsRes, usersRes] = await Promise.all([
          api.get('/teams'),
          canManage ? api.get('/admin/users') : Promise.resolve({ data: { data: [] } }),
        ]);
        setTeams(teamsRes.data.data);
        setUsers(usersRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [canManage]);

  // Create team
  const createTeam = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/teams', {
        name: form.name,
        description: form.description,
        leadId: form.leadId || null,
      });
      setTeams([res.data.data, ...teams]);
      setCreateModal(false);
      setForm({ name: '', description: '', leadId: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  // Add member to team
  const addMember = async (teamId, userId) => {
    try {
      const res = await api.post(`/teams/${teamId}/members`, { userId });
      setTeams(teams.map(t => t._id === teamId ? res.data.data : t));
      setMemberSearch('');
      alert('✅ Member added');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  // Remove member
  const removeMember = async (teamId, userId, userName) => {
    if (!confirm(`Remove ${userName} from this team?`)) return;
    try {
      const res = await api.delete(`/teams/${teamId}/members/${userId}`);
      setTeams(teams.map(t => t._id === teamId ? res.data.data : t));
      if (detailModal?._id === teamId) setDetailModal(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove');
    }
  };

  // Filter users for "add member" — excludes those already in team
  const availableUsers = (team) => {
    if (!team) return [];
    const memberIds = team.members?.map(m => m._id) || [];
    return users.filter(u =>
      !memberIds.includes(u._id) &&
      (u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
       u.email.toLowerCase().includes(memberSearch.toLowerCase()))
    );
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><SkeletonCardGrid count={3} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-gray-500">All active teams and their members</p>
        </div>
        {canManage && (
          <button onClick={() => setCreateModal(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 flex items-center gap-2">
            <Plus size={16} /> Create Team
          </button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <UsersRound className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
          <p className="text-gray-500 mb-4">Create your first team to get started</p>
          {canManage && (
            <button onClick={() => setCreateModal(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
              + Create Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div key={t._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{t.name}</h3>
                {t.chatActive && <MessageSquare className="w-4 h-4 text-green-500" />}
              </div>

              {t.description && <p className="text-xs text-gray-500 mb-2">{t.description}</p>}

              <p className="text-sm text-gray-600 mb-3">
                Lead: <span className="font-medium">{t.leadName || t.leadId?.name || 'Not assigned'}</span>
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Users size={14} /> {t.memberCount || t.members?.length || 0} members
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setDetailModal(t)} className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    View
                  </button>
                  {canManage && (
                    <button onClick={() => setAddMemberModal(t)} className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                      + Member
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- CREATE TEAM MODAL ---------- */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCreateModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-5">Create New Team</h3>
            <form onSubmit={createTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Team Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tech Team"
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description..."
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Assign Team Lead (Optional)</label>
                <select value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none">
                  <option value="">Select a lead...</option>
                  {users.filter(u => ['T3_EXECUTIVE', 'T2_ASSOCIATE'].includes(u.role)).map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Team leads get access to team management</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- ADD MEMBER MODAL ---------- */}
      {addMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddMemberModal(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-semibold">Add Member</h3>
                <p className="text-sm text-gray-500">to {addMemberModal.name}</p>
              </div>
              <button onClick={() => setAddMemberModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="flex-1 bg-transparent border-none outline-none text-sm" />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {availableUsers(addMemberModal).length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">No users available to add</p>
              ) : availableUsers(addMemberModal).map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email} · {u.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <button onClick={() => addMember(addMemberModal._id, u._id)}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600">
                    + Add
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Current members: {addMemberModal.members?.length || 0}
              </span>
              <button onClick={() => setAddMemberModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- TEAM DETAIL MODAL ---------- */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailModal(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-xl font-bold">{detailModal.name}</h3>
                {detailModal.description && <p className="text-sm text-gray-500 mt-1">{detailModal.description}</p>}
              </div>
              <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Total Members</p>
                <p className="text-2xl font-bold">{detailModal.members?.length || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Team Lead</p>
                <p className="text-sm font-semibold mt-1">{detailModal.leadName || detailModal.leadId?.name || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Chat Room</p>
                <p className="text-sm font-semibold mt-1 text-green-600">● Active</p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Members</h4>
              {canManage && (
                <button onClick={() => { setDetailModal(null); setAddMemberModal(detailModal); }}
                  className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600">
                  + Add Member
                </button>
              )}
            </div>

            {(!detailModal.members || detailModal.members.length === 0) ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No members yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {detailModal.members.map((m) => (
                  <div key={m._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                      {m._id === (detailModal.leadId?._id || detailModal.leadId) && (
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">LEAD</span>
                      )}
                    </div>
                    {canManage && m._id !== (detailModal.leadId?._id || detailModal.leadId) && (
                      <button onClick={() => removeMember(detailModal._id, m._id, m.name)}
                        className="text-xs text-red-500 hover:underline">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================================
// MY SHIFTS
// ====================================================================
export const MyShiftsPage = () => {
  const shifts = [
    { _id: '1', event: 'Annual Tech Fest 2026', role: 'Tech Team', date: 'Oct 15, 2026', time: '9:00 AM - 1:00 PM', status: 'upcoming' },
    { _id: '2', event: 'Startup Pitch Day', role: 'Registration', date: 'Nov 5, 2026', time: '10:00 AM - 4:00 PM', status: 'upcoming' },
    { _id: '3', event: 'Design Sprint', role: 'Media Team', date: 'Sep 20, 2026', time: '2:00 PM - 6:00 PM', status: 'completed' },
  ];
  const statusColor = {
    upcoming: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    missed: 'bg-red-100 text-red-700',
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Shifts</h1>
        <p className="text-gray-500">All your assigned shifts across events</p>
      </div>
      <div className="space-y-3">
        {shifts.map((s) => (
          <div key={s._id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold">{s.event}</p>
                <p className="text-sm text-gray-500">{s.role}</p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {s.date}</span>
                  <span className="flex items-center gap-1"><Timer size={12} /> {s.time}</span>
                </p>
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[s.status]}`}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ====================================================================
// SESSIONS
// ====================================================================
export const SessionsPage = () => {
  const sessions = [
    { _id: '1', user: 'Rajesh Kumar', role: 'Admin', device: 'Chrome on Windows', ip: '192.168.1.45', lastActive: '2 min ago' },
    { _id: '2', user: 'Mayank', role: 'T3', device: 'Safari on iPhone', ip: '10.0.0.12', lastActive: '15 min ago' },
    { _id: '3', user: 'Shrey Mehra', role: 'Super Admin', device: 'Chrome on MacOS', ip: '192.168.1.10', lastActive: '1 hour ago' },
  ];
  const roleColor = { 'Admin': 'bg-orange-100 text-orange-700', 'T3': 'bg-purple-100 text-purple-700', 'T1': 'bg-green-100 text-green-700', 'Super Admin': 'bg-red-100 text-red-700' };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Active Sessions</h1>
        <p className="text-gray-500">Monitor and manage all logged-in users</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Device</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">IP</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Active</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{s.user}</td>
                <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColor[s.role]}`}>{s.role}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.device}</td>
                <td className="px-6 py-4 text-sm text-gray-400 font-mono">{s.ip}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.lastActive}</td>
                <td className="px-6 py-4 text-sm"><button className="text-red-500 hover:underline">Force Logout</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ====================================================================
// MY APPLICATIONS
// ====================================================================
export const MyApplicationsPage = () => {
  const apps = [
    { _id: '1', event: 'Hackathon 2026', role: 'Tech Team', applied: 'Oct 10, 2026', status: 'pending' },
    { _id: '2', event: 'Startup Pitch Day', role: 'Registration Coordinator', applied: 'Oct 5, 2026', status: 'approved' },
    { _id: '3', event: 'Design Sprint', role: 'Media Team', applied: 'Sep 28, 2026', status: 'rejected' },
    { _id: '4', event: 'Annual Tech Fest 2026', role: 'Tech Team', applied: 'Sep 20, 2026', status: 'waitlisted' },
  ];
  const statusColor = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    waitlisted: 'bg-blue-100 text-blue-700',
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-gray-500">Track all your event applications</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: apps.length, color: 'text-gray-900' },
          { label: 'Pending', value: apps.filter(a => a.status === 'pending').length, color: 'text-amber-600' },
          { label: 'Approved', value: apps.filter(a => a.status === 'approved').length, color: 'text-green-600' },
          { label: 'Rejected', value: apps.filter(a => a.status === 'rejected').length, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {apps.map((a) => (
          <div key={a._id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{a.event}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[a.status]}`}>{a.status}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{a.role}</p>
                <p className="text-xs text-gray-400 mt-1">Applied {a.applied}</p>
              </div>
            </div>
            {a.status === 'approved' && <button className="text-sm px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Open Chat</button>}
            {a.status === 'pending' && <button className="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Withdraw</button>}
            {a.status === 'rejected' && <span className="text-sm text-gray-400">Application closed</span>}
            {a.status === 'waitlisted' && <span className="text-sm text-blue-600 font-medium">On waitlist</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ====================================================================
// MY TEAMS
// ====================================================================
export const MyTeamsPage = () => {
  const [selected, setSelected] = useState(null);
  const teams = [
    {
      _id: '1', name: 'Tech Team', event: 'Hackathon 2026', chatActive: true,
      members: [
        { name: 'Ayush', role: 'T1', status: 'present' },
        { name: 'Abhishek Singh', role: 'T2', status: 'present' },
        { name: 'Sneha Patel', role: 'T1', status: 'late' },
        { name: 'Karan Singh', role: 'T1', status: 'absent' },
        { name: 'Anjali Verma', role: 'T2', status: 'present' },
      ],
    },
    {
      _id: '2', name: 'Media Team', event: 'Startup Pitch Day', chatActive: true,
      members: [
        { name: 'Mayank', role: 'T3', status: 'present' },
        { name: 'Aditya Nair', role: 'T1', status: 'present' },
        { name: 'Riya Kapoor', role: 'T1', status: 'present' },
      ],
    },
  ];
  const statusColor = {
    present: 'bg-green-100 text-green-700',
    late: 'bg-amber-100 text-amber-700',
    absent: 'bg-red-100 text-red-700',
  };
  if (selected) {
    const team = teams.find(t => t._id === selected);
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">← Back to all teams</button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <p className="text-gray-500">{team.event}</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 flex items-center gap-2">
              <MessageSquare size={16} /> Open Team Chat
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2">
              <QrCode size={16} /> Generate QR
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Total Members</p>
            <p className="text-3xl font-bold mt-2">{team.members.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Present Today</p>
            <p className="text-3xl font-bold mt-2 text-green-600">{team.members.filter(m => m.status === 'present').length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Absent</p>
            <p className="text-3xl font-bold mt-2 text-red-600">{team.members.filter(m => m.status === 'absent').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {team.members.map((m, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{m.name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.role === 'T3' ? 'bg-purple-100 text-purple-700' : m.role === 'T2' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{m.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[m.status]}`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Teams</h1>
        <p className="text-gray-500">Teams you are leading as T3 Executive</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((t) => (
          <div key={t._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition cursor-pointer" onClick={() => setSelected(t._id)}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{t.name}</h3>
              {t.chatActive && <MessageSquare className="w-4 h-4 text-green-500" />}
            </div>
            <p className="text-sm text-gray-500 mb-4">{t.event}</p>
            <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
              <span className="text-gray-500 flex items-center gap-1"><Users size={14} /> {t.members.length} members</span>
              <span className="text-blue-500 font-medium text-xs">View Details →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ====================================================================
// ENHANCED T3 DASHBOARD
// ====================================================================
export const T3DashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const teams = [
    { name: 'Tech Team', event: 'Hackathon 2026', members: 8, present: 6, time: '9:00 AM - 1:00 PM' },
    { name: 'Media Team', event: 'Startup Pitch Day', members: 5, present: 4, time: '2:00 PM - 6:00 PM' },
  ];
  const pendingApps = [
    { name: 'Ayush', event: 'Hackathon 2026', role: 'Tech Team', time: '2h ago' },
    { name: 'Abhishek Singh', event: 'Hackathon 2026', role: 'Media Team', time: '4h ago' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hi {user.name.split(' ')[0]}!</h1>
        <p className="text-gray-500">Your teams and pending tasks today</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="My Teams" value="3" />
        <KPI label="Pending Apps" value="12" change="New" />
        <KPI label="Present Today" value="20/25" />
        <KPI label="Avg Rating Given" value="4.7" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Today's Teams</h3>
            <button onClick={() => navigate('/t3/teams')} className="text-xs text-purple-500 hover:underline">View All →</button>
          </div>
          <div className="space-y-3">
            {teams.map((t, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 hover:bg-purple-50 transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.event}</p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">{t.time}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={12} /> {t.present}/{t.members} present</span>
                  <div className="flex gap-2">
                    <button className="text-xs px-2 py-1 bg-purple-500 text-white rounded">Chat</button>
                    <button onClick={() => navigate('/t3/attendance')} className="text-xs px-2 py-1 border rounded">Attendance</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Pending Applications</h3>
            <button onClick={() => navigate('/t3/applications')} className="text-xs text-purple-500 hover:underline">Review All →</button>
          </div>
          <div className="space-y-3">
            {pendingApps.map((a, i) => (
              <div key={i} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">{a.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.event} / {a.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 bg-green-500 text-white rounded text-xs"><CheckCircle size={14} /></button>
                  <button className="p-1.5 border border-red-300 text-red-500 rounded text-xs"><X size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// ENHANCED T2 DASHBOARD
// ====================================================================
export const T2DashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const todayShift = {
    team: 'Tech Team',
    event: 'Hackathon 2026',
    time: '9:00 AM - 1:00 PM',
    location: 'Booth 3, Main Auditorium',
    role: 'Shift Coordinator',
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hey {user.name.split(' ')[0]}!</h1>
        <p className="text-gray-500">Here's your schedule and activity</p>
      </div>
      <div className="bg-white rounded-xl border-l-4 border-l-blue-500 border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2"><Bell size={14} /> TODAY'S SHIFT</p>
            <h3 className="text-xl font-bold mb-2">{todayShift.team} — {todayShift.event}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2 mb-1"><Timer size={14} /> {todayShift.time}</p>
            <p className="text-sm text-gray-600 flex items-center gap-2 mb-1"><MapPin size={14} /> {todayShift.location}</p>
          </div>
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Coordinator</span>
        </div>
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button onClick={() => navigate('/t1/checkin')} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 flex items-center gap-2">
            <CheckCircle size={16} /> Check In
          </button>
          <button onClick={() => navigate('/chat')} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2">
            <MessageSquare size={16} /> Team Chat
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="My Shifts" value="4" />
        <KPI label="Applications" value="3" />
        <KPI label="Approved" value="2" />
        <KPI label="Certificates" value="2" />
      </div>
    </div>
  );
};

// ====================================================================
// SKELETONS
// ====================================================================
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const SkeletonCard = () => (
  <div className="bg-white p-5 rounded-xl border border-gray-200">
    <Skeleton className="h-3 w-24 mb-3" />
    <Skeleton className="h-8 w-20" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="bg-gray-50 border-b border-gray-200 p-4 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-3 flex-1" />)}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="p-4 flex gap-4 border-b border-gray-100 last:border-0">
        {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} className="h-4 flex-1" />)}
      </div>
    ))}
  </div>
);

export const SkeletonCardGrid = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Skeleton className="h-32 rounded-none" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const useFakeLoading = (ms = 600) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
};

// ====================================================================
// EVENT DETAIL
// ====================================================================
export const EventDetailPage = () => {
  const navigate = useNavigate();
  const loading = useFakeLoading(500);
  const event = {
    title: 'Annual Tech Fest 2026',
    date: 'Oct 15-17, 2026',
    location: 'Main Auditorium',
    status: 'published',
    description: 'A 3-day technology festival featuring hackathons, workshops, keynote speakers, and networking sessions for students across all years.',
  };
  const teams = [
    { name: 'Tech Team', lead: 'Mayank', members: 8, applicants: 24 },
    { name: 'Media Team', lead: 'Sneha Patel', members: 5, applicants: 12 },
    { name: 'Logistics', lead: 'Abhishek Singh', members: 12, applicants: 18 },
  ];
  const shifts = [
    { time: '9:00 AM - 1:00 PM', team: 'Tech Team', assigned: 8, required: 8 },
    { time: '2:00 PM - 6:00 PM', team: 'Media Team', assigned: 4, required: 5 },
  ];
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">← Back to Events</button>
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
        <span className="text-xs bg-white/20 backdrop-blur px-3 py-1 rounded-full font-medium">{event.status.toUpperCase()}</span>
        <h1 className="text-3xl font-bold mb-3 mt-4">{event.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-white/90">
          <span className="flex items-center gap-2"><Calendar size={16} /> {event.date}</span>
          <span className="flex items-center gap-2"><MapPin size={16} /> {event.location}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Teams" value={teams.length} />
        <KPI label="Shifts" value={shifts.length} />
        <KPI label="Total Applicants" value="54" change="12" />
        <KPI label="Positions Filled" value="24/25" />
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200">
        <h3 className="font-semibold mb-3">About this Event</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200">
        <h3 className="font-semibold mb-4">Teams</h3>
        <div className="space-y-3">
          {teams.map((t, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-gray-500">Lead: {t.lead}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{t.members} members</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// PROFILE
// ====================================================================
export const ProfilePage = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+91 98765 43210',
    bio: 'Passionate about building products and leading teams.',
    skills: 'React, Node.js, UI/UX',
    availability: 'Weekends, Evenings',
  });
  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };
  const cfg = ROLES[user.role];
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-gray-500">Manage your account information</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: cfg.color }}>
            {user.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium text-white" style={{ backgroundColor: cfg.color }}>{cfg.label}</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-5">Account Information</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input value={form.email} disabled className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none bg-gray-50 text-gray-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Availability</label>
              <input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Skills</label>
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full p-3 rounded-lg border border-gray-200 outline-none resize-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Saved successfully</span>}
          </div>
        </form>
      </div>
    </div>
  );
};