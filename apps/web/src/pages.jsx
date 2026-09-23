// ====================================================================
// pages.jsx — All Page Components for TBI Management System
// ====================================================================

import React, { useState, createContext, useContext, useEffect } from 'react';
import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard, Users, ScrollText, Monitor, Settings, Shield, FileText,
  User as UserIcon, LogOut, Calendar, TrendingUp, UserPlus, Upload,
  UsersRound, Clock, Award, CheckCircle, MessageSquare, Star, Bell,
  Search, Mail, Lock, Plus, X, QrCode, ChevronLeft, Crown, AlertTriangle,
  Info, Trash2, Construction, MapPin, Timer, BarChart3, ExternalLink, ChevronRight
} from 'lucide-react';
import api from './lib/api';
import { io } from 'socket.io-client';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';

// ====================================================================
// AUTH CONTEXT
// ====================================================================
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// ====================================================================
// SOCKET CONTEXT
// ====================================================================
const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('tbi_token');
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      console.log('Real-time connected');
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

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
        { icon: Calendar, label: 'Events', to: '/admin/events' },
        { icon: UsersRound, label: 'Teams', to: '/admin/teams' },
        { icon: Bell, label: 'Announcements', to: '/announcements' },
      ]
    },
    {
      section: 'SYSTEM CONTROL', items: [
        { icon: UserIcon, label: 'Admins', to: '/super-admin/admins' },
        { icon: ScrollText, label: 'Audit Logs', to: '/super-admin/audit', badge: 3 },
        { icon: Monitor, label: 'Sessions', to: '/super-admin/sessions' },
        { icon: UserIcon, label: 'My Profile', to: '/profile' },
        { icon: Settings, label: 'Preferences', to: '/preferences' },
      ]
    },
  ],
  ADMIN: [
    { section: 'OVERVIEW', items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
      { icon: TrendingUp, label: 'Analytics', to: '/admin/analytics' },
    ]},
    { section: 'MANAGEMENT', items: [
      { icon: Users, label: 'Users', to: '/admin/users' },
      { icon: UserPlus, label: 'Add User', to: '/admin/users/new' },
      { icon: Upload, label: 'Bulk Import', to: '/admin/users/bulk' },
    ]},
    { section: 'OPERATIONS', items: [
      { icon: Calendar, label: 'Events', to: '/admin/events' },
      { icon: UsersRound, label: 'Teams', to: '/admin/teams' },
      { icon: Bell, label: 'Announcements', to: '/announcements' },
    ]},
    { section: 'ACCOUNT', items: [
      { icon: UserIcon, label: 'My Profile', to: '/profile' },
      { icon: Settings, label: 'Preferences', to: '/preferences' },
    ]},
  ],
  T3_EXECUTIVE: [
    { section: 'MY WORKSPACE', items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/t3' },
      { icon: UsersRound, label: 'My Teams', to: '/t3/teams' },
      { icon: FileText, label: 'Applications', to: '/t3/applications' },
      { icon: CheckCircle, label: 'Attendance', to: '/t3/attendance' },
    ]},
    { section: 'COMMUNICATION', items: [
      { icon: MessageSquare, label: 'Team Chats', to: '/chat' },
      { icon: Bell, label: 'Announcements', to: '/announcements' },
      { icon: Star, label: 'Submit Review', to: '/t3/reviews' },
    ]},
    { section: 'ACHIEVEMENTS', items: [
      { icon: Award, label: 'Certificates', to: '/t3/certificates' },
      { icon: UserIcon, label: 'My Profile', to: '/profile' },
      { icon: Settings, label: 'Preferences', to: '/preferences' },
    ]},
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
        { icon: Bell, label: 'Announcements', to: '/announcements' },
      ]
    },
    {
      section: 'ACHIEVEMENTS', items: [
        { icon: Award, label: 'Certificates', to: '/t2/certificates' },
        { icon: UserIcon, label: 'My Profile', to: '/profile' },
        { icon: Settings, label: 'Preferences', to: '/preferences' },
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
        { icon: Settings, label: 'Preferences', to: '/preferences' },
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
  const navigate = useNavigate();
  const socket = useSocket();
  const cfg = ROLES[user.role];
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get('/notifications');
        setUnreadCount(res.data.data.filter((n) => !n.isRead).length);
      } catch (err) {
        // silent
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNew = () => {
      setUnreadCount((prev) => prev + 1);
    };
    socket.on('notification:new', handleNew);
    return () => socket.off('notification:new', handleNew);
  }, [socket]);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search className="w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-sm" />
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-lg hover:bg-gray-100">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 text-[10px] rounded-full text-white flex items-center justify-center font-bold" style={{ backgroundColor: cfg.color }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
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
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {children}
      </main>
      <AnnouncementPopup />
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

// ====================================================================
// ANNOUNCEMENT BANNER — Shows on dashboards when there are new announcements
// ====================================================================
export const AnnouncementBanner = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get('/announcements');
        const recent = (res.data.data || []).filter((a) => {
          const created = new Date(a.createdAt).getTime();
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return created > weekAgo;
        });
        setCount(recent.length);
      } catch (err) {
        // Silent
      }
    };
    fetchCount();
  }, []);

  if (count === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 flex items-center justify-between text-white">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm">
            {count} new announcement{count > 1 ? 's' : ''} this week
          </p>
          <p className="text-xs opacity-90">Check what's happening on the platform</p>
        </div>
      </div>
      <button
        onClick={() => navigate('/announcements')}
        className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-50 whitespace-nowrap"
      >
        View All
      </button>
    </div>
  );
};

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
  const [stats, setStats] = useState(null);
  const [tiers, setTiers] = useState(null);
  const [trend, setTrend] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, tiersRes, trendRes, attendRes] = await Promise.all([
          api.get('/stats/admin'),
          api.get('/stats/users-by-tier'),
          api.get('/stats/applications-trend'),
          api.get('/stats/attendance'),
        ]);
        setStats(statsRes.data.data);
        setTiers(tiersRes.data.data);
        setTrend(trendRes.data.data);
        setAttendance(attendRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const tierPieData = [
    { name: 'T1 Volunteers', value: tiers.T1, color: '#4CAF50' },
    { name: 'T2 Associates', value: tiers.T2, color: '#2196F3' },
    { name: 'T3 Executives', value: tiers.T3, color: '#9C27B0' },
    { name: 'Admins', value: tiers.Admin + tiers.SuperAdmin, color: '#FF9800' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <AnnouncementBanner />
      <div>
        <h1 className="text-2xl font-bold">Good morning, {user.name.split(' ')[0]}</h1>
        <p className="text-gray-500">Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total Users" value={stats.totalUsers} />
        <KPI label="Active Events" value={stats.activeEvents} />
        <KPI label="Approval Rate" value={`${stats.approvalRate}%`} />
        <KPI label="Teams" value={stats.totalTeams} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" /> Users by Tier
          </h3>
          {tierPieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              No users yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={tierPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {tierPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-500" /> Applications (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 5, fill: '#0EA5E9' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-500" /> Attendance Today
          </h3>
          {!attendance || attendance.total === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              No check-ins today
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[
                  { status: 'Present', count: attendance.present },
                  { status: 'Late', count: attendance.late },
                  { status: 'Absent', count: attendance.absent },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" /> Application Status
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={[
                { status: 'Pending', count: stats.pendingApplications },
                { status: 'Approved', count: stats.approvedApplications },
                { status: 'Rejected', count: stats.rejectedApplications },
              ]}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#0EA5E9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tiers, setTiers] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, tiersRes, trendRes] = await Promise.all([
          api.get('/stats/super-admin'),
          api.get('/stats/users-by-tier'),
          api.get('/stats/applications-trend'),
        ]);
        setStats(statsRes.data.data);
        setTiers(tiersRes.data.data);
        setTrend(trendRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const tierPieData = [
    { name: 'T1', value: tiers.T1, color: '#4CAF50' },
    { name: 'T2', value: tiers.T2, color: '#2196F3' },
    { name: 'T3', value: tiers.T3, color: '#9C27B0' },
    { name: 'Admin', value: tiers.Admin + tiers.SuperAdmin, color: '#FF9800' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <AnnouncementBanner />
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <p className="text-gray-500">Full system overview and admin actions.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Admins" value={stats.admins} />
        <KPI label="Total Users" value={stats.totalUsers} />
        <KPI label="Active Events" value={stats.activeEvents} />
        <KPI label="Check-ins Today" value={stats.sessionsToday} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">Users by Tier</h3>
          {tierPieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={tierPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {tierPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">Applications (7 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const T1Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/stats/t1');
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [myAttendance, setMyAttendance] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/attendance/my-stats?days=30');
        setMyAttendance(res.data.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <AnnouncementBanner />
      <div>
        <h1 className="text-2xl font-bold">Hi {user.name.split(' ')[0]}</h1>
        <p className="text-gray-500">
          {stats.todayCheckedIn
            ? stats.todayCheckedOut
              ? 'Your shift is complete for today.'
              : 'You are checked in. Remember to check out.'
            : 'You have not checked in yet today.'}
        </p>
      </div>

      {/* Today's status card */}
      {stats.todayCheckedIn ? (
        <div className="bg-white rounded-xl border-l-4 border-l-green-500 border border-gray-200 p-6">
          <p className="text-sm font-semibold text-green-600 mb-3">TODAY'S STATUS</p>
          <h3 className="text-xl font-bold mb-2">
            {stats.todayCheckedOut ? 'Shift Complete' : 'Checked In'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {stats.todayCheckedOut
              ? 'Great work today.'
              : 'Don\'t forget to check out at the end of your shift.'}
          </p>
          {!stats.todayCheckedOut && (
            <button
              onClick={() => navigate('/t1/checkin')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
            >
              Check Out
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border-l-4 border-l-blue-500 border border-gray-200 p-6">
          <p className="text-sm font-semibold text-blue-600 mb-3">READY TO CHECK IN?</p>
          <h3 className="text-xl font-bold mb-2">Start Your Shift</h3>
          <p className="text-sm text-gray-600 mb-4">Scan the QR code from your team lead.</p>
          <button
            onClick={() => navigate('/t1/checkin')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
          >
            Check In Now
          </button>
        </div>
      )}

      {/* Personal Attendance Card */}
      {myAttendance && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">My Attendance (30 Days)</h3>
            <button onClick={() => navigate('/t1/checkin')} className="text-xs text-blue-500 hover:underline">
              View →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">{myAttendance.percentage}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Attendance Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{myAttendance.totalHours}h</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Hours</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 text-center">
            <div>
              <p className="text-lg font-bold text-green-600">{myAttendance.present}</p>
              <p className="text-[10px] text-gray-500 uppercase">Present</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600">{myAttendance.late}</p>
              <p className="text-[10px] text-gray-500 uppercase">Late</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">{myAttendance.absent}</p>
              <p className="text-[10px] text-gray-500 uppercase">Absent</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <KPI label="Applications" value={stats.myApplications} />
        <KPI label="Approved" value={stats.approved} />
        <KPI label="Certificates" value={stats.certificates} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPI label="Pending" value={stats.pending} />
        <KPI label="Days Attended" value={stats.attendanceDays} />
        <KPI label="My Teams" value={stats.myTeams} />
      </div>
    </div>
  );
};

// ====================================================================
// USER MANAGEMENT — Connected to real backend
// ====================================================================
export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const canManageAccess = currentUser.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'T1_VOLUNTEER' });
  const [saving, setSaving] = useState(false);
  const [revokeModal, setRevokeModal] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeNotes, setRevokeNotes] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add user
  const addUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/users', form);
      setUsers([res.data.data, ...users]);
      setModal(false);
      setForm({ name: '', email: '', phone: '', role: 'T1_VOLUNTEER' });
      alert(`User created!\n\nAn email with login credentials has been sent to ${res.data.data.email}.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  // Reset password (Super Admin only)
  const handleResetPassword = async (u) => {
    if (!canManageAccess) return;
    if (!confirm(`Send a new temporary password to ${u.name}?\n\nTheir current password will become invalid.`)) return;
    try {
      const res = await api.post(`/admin/users/${u._id}/reset-password`);
      const { tempPassword, emailSent } = res.data;
      if (emailSent) {
        alert(`Password reset!\n\nEmail sent to: ${u.email}\n\nBackup temp password:\n${tempPassword}\n\nOne-time use only.`);
      } else {
        alert(`Password reset. Email failed.\n\nShare manually:\n${tempPassword}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  // Reactivate user
  const handleReactivate = async (u) => {
    if (!confirm(`Reactivate ${u.name}'s account?\n\nA new temporary password will be generated and emailed.`)) return;
    try {
      const res = await api.post(`/admin/users/${u._id}/reactivate`);
      setUsers(users.map((x) => x._id === u._id ? { ...x, isActive: true } : x));
      const { tempPassword, emailSent } = res.data;
      if (emailSent !== false) {
        alert(`Account reactivated!\n\nNew credentials emailed to ${u.email}\n\nBackup password:\n${tempPassword}`);
      } else {
        alert(`Account reactivated. Share password manually:\n\n${tempPassword}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reactivate');
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteModal._id}`);
      setUsers(users.filter((u) => u._id !== deleteModal._id));
      setDeleteModal(null);
      alert(`${deleteModal.name} has been permanently deleted.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  // Revoke user (Super Admin only)
  const revokeUser = async (e) => {
    e.preventDefault();
    if (!revokeReason) {
      alert('Please select a reason');
      return;
    }
    setRevoking(true);
    try {
      const res = await api.post(`/admin/users/${revokeModal._id}/revoke`, {
        reason: revokeReason,
        notes: revokeNotes,
      });
      setUsers(users.map((u) => u._id === revokeModal._id ? { ...u, isActive: false } : u));
      setRevokeModal(null);
      setRevokeReason('');
      setRevokeNotes('');
      alert(res.data.message || `${revokeModal.name}'s access revoked.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke');
    } finally {
      setRevoking(false);
    }
  };

  const filteredUsers = users.filter((u) =>
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
          <p className="text-gray-500">
            {canManageAccess
              ? 'Full control over user accounts'
              : 'View and create users. Contact Super Admin for access changes.'}
          </p>
        </div>
        <button onClick={() => setModal(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
          + Add User
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Users table */}
      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u._id} className={`hover:bg-gray-50 ${!u.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 text-sm font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColor[u.role]}`}>
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.isActive ? (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-200 text-gray-600">
                        Revoked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {!canManageAccess ? (
                      <span className="text-xs text-gray-400 italic">View only</span>
                    ) : !u.isActive ? (
                      // Revoked user — show Reactivate + Delete
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => handleReactivate(u)}
                          className="text-green-600 hover:underline text-xs font-medium"
                        >
                          Reactivate
                        </button>
                        <button
                          onClick={() => setDeleteModal(u)}
                          className="text-red-600 hover:underline text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      // Active user — show Reset + Revoke
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="text-amber-600 hover:underline text-xs font-medium"
                        >
                          Send Reset Password
                        </button>
                        <button
                          onClick={() => setRevokeModal(u)}
                          className="text-red-500 hover:underline text-xs font-medium"
                        >
                          Revoke
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users match your search
                  </td>
                </tr>
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
                <span>Login credentials will be emailed to the user automatically.</span>
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
                <li>Immediately deactivate the account</li>
                <li>Invalidate their current password</li>
                <li>Log this action for audit</li>
              </ul>
            </div>

            <form onSubmit={revokeUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Reason *</label>
                <select
                  required
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-red-500"
                >
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
                <textarea
                  rows={3}
                  value={revokeNotes}
                  onChange={(e) => setRevokeNotes(e.target.value)}
                  placeholder="Optional details..."
                  className="w-full p-3 rounded-lg border border-gray-200 outline-none resize-none focus:border-red-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setRevokeModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!revokeReason || revoking}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  {revoking ? 'Revoking...' : 'Revoke Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteModal(null)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Permanently Delete User</h3>
                <p className="text-xs text-gray-500 truncate">{deleteModal.email}</p>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-800 font-medium mb-2">This action is permanent and cannot be undone:</p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>User account will be permanently deleted</li>
                <li>All their applications and attendance records</li>
                <li>Reviews they submitted or received</li>
                <li>Their chat history and messages</li>
                <li>Audit logs will retain this deletion action</li>
              </ul>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-xs text-amber-800">
                <strong>Tip:</strong> If you only want to restrict access temporarily, use "Revoke" instead.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
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
  const socket = useSocket();
  const [rooms, setRooms] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [deleteRoomModal, setDeleteRoomModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', memberIds: [] });
  const [memberSearch, setMemberSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const canCreateRoom = ['T3_EXECUTIVE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);

  // Fetch eligible users based on role
  const fetchEligibleUsers = async () => {
    try {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        const res = await api.get('/admin/users');
        setEligibleUsers(res.data.data);
      } else if (user.role === 'T3_EXECUTIVE') {
        // T3 only sees members from their teams + events
        const [teamRes, eventRes] = await Promise.all([
          api.get('/teams/me/members'),
          api.get('/teams/me/event-members'),
        ]);

        // Merge + dedupe
        const merged = new Map();
        [...teamRes.data.data, ...eventRes.data.data].forEach((u) => {
          merged.set(u._id, u);
        });

        // Remove self
        merged.delete(user._id);

        setEligibleUsers(Array.from(merged.values()));
      } else {
        setEligibleUsers([]);
      }
    } catch (err) {
      console.error('Failed to load eligible users:', err);
    }
  };

  // Fetch rooms + users on mount
  useEffect(() => {
    (async () => {
      try {
        const roomsRes = await api.get('/chat/rooms');
        setRooms(roomsRes.data.data);
        if (roomsRes.data.data.length > 0) {
          setSelectedRoom(roomsRes.data.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRooms(false);
      }
    })();

    if (canCreateRoom) fetchEligibleUsers();
  }, [canCreateRoom]);

  // Auto-refresh eligible users every time modal opens
  useEffect(() => {
    if ((createModal || addMemberModal) && canCreateRoom) {
      fetchEligibleUsers();
    }
  }, [createModal, addMemberModal]);

  // Auto-refresh eligible users every 30 seconds (background sync)
  useEffect(() => {
    if (!canCreateRoom) return;
    const interval = setInterval(fetchEligibleUsers, 30000);
    return () => clearInterval(interval);
  }, [canCreateRoom]);

  // Fetch messages when room changes
  useEffect(() => {
    if (!selectedRoom) return;
    setLoadingMessages(true);
    (async () => {
      try {
        const res = await api.get(`/chat/rooms/${selectedRoom._id}/messages`);
        setMessages(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMessages(false);
      }
    })();
  }, [selectedRoom]);

  // Real-time listener
  useEffect(() => {
    if (!socket || !selectedRoom) return;
    socket.emit('chat:join', selectedRoom._id);

    const handleNewMessage = (msg) => {
      if (msg.roomId !== selectedRoom._id) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('chat:new_message', handleNewMessage);

    return () => {
      socket.emit('chat:leave', selectedRoom._id);
      socket.off('chat:new_message', handleNewMessage);
    };
  }, [socket, selectedRoom]);

  const toggleMember = (userId) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(userId)
        ? f.memberIds.filter((id) => id !== userId)
        : [...f.memberIds, userId],
    }));
  };

  const createRoom = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/chat/rooms', form);
      setRooms([res.data.data, ...rooms]);
      setSelectedRoom(res.data.data);
      setCreateModal(false);
      setForm({ name: '', description: '', memberIds: [] });
      setMemberSearch('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create room');
    } finally {
      setSaving(false);
    }
  };

  const addMemberToRoom = async (userId) => {
    try {
      const res = await api.post(`/chat/rooms/${selectedRoom._id}/members`, { userId });
      setRooms(rooms.map((r) => r._id === selectedRoom._id ? res.data.data : r));
      setSelectedRoom(res.data.data);
      setMemberSearch('');
      alert('Member added');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  const deleteRoom = async () => {
    if (!selectedRoom) return;
    try {
      await api.delete(`/chat/rooms/${selectedRoom._id}`);
      setRooms(rooms.filter((r) => r._id !== selectedRoom._id));
      setSelectedRoom(rooms.length > 1 ? rooms.find((r) => r._id !== selectedRoom._id) : null);
      setDeleteRoomModal(false);
      setMessages([]);
      alert('Room deleted');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedRoom) return;
    const text = message;
    setMessage('');
    try {
      await api.post(`/chat/rooms/${selectedRoom._id}/messages`, { text });
    } catch (err) {
      alert('Failed to send');
      setMessage(text);
    }
  };

  // Filter eligible users
  const filterUsers = (excludeIds = []) => {
    return eligibleUsers
      .filter((u) => !excludeIds.includes(u._id))
      .filter((u) =>
        u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(memberSearch.toLowerCase())
      );
  };

  const usersForCreate = filterUsers([user._id]);

  const usersForAdd = selectedRoom
    ? filterUsers([user._id, ...(selectedRoom.members || []).map((m) => m._id)])
    : [];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Sidebar */}
      <div className="w-72 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold">Chat Rooms</h3>
          {canCreateRoom && (
            <button onClick={() => setCreateModal(true)}
              className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600">
              <Plus size={16} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loadingRooms ? (
            <Skeleton className="h-16 mx-2" />
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No chat rooms yet</p>
              {canCreateRoom && (
                <button onClick={() => setCreateModal(true)} className="mt-3 text-sm text-blue-500 hover:underline">
                  Create first room
                </button>
              )}
            </div>
          ) : rooms.map((r) => (
            <button
              key={r._id}
              onClick={() => setSelectedRoom(r)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition ${selectedRoom?._id === r._id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}
            >
              <p className="font-medium text-sm truncate">{r.name}</p>
              <p className="text-xs text-gray-500 truncate">{r.memberCount} members</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col">
        {!selectedRoom ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a room to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{selectedRoom.name}</h3>
                <p className="text-xs text-gray-500">{selectedRoom.memberCount} members</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {canCreateRoom && (
                  <button onClick={() => setAddMemberModal(true)}
                    className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1">
                    <UserPlus size={14} /> Add Member
                  </button>
                )}
                {canCreateRoom && (
                  <button onClick={() => setDeleteRoomModal(true)}
                    className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1">
                    <Trash2 size={14} /> Delete Room
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <Skeleton className="h-8 w-64" />
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Say hello</p>
              ) : messages.map((m) => {
                const own = m.senderId === user._id;
                return (
                  <div key={m._id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md flex flex-col ${own ? 'items-end' : 'items-start'}`}>
                      {!own && (
                        <p className="text-xs font-medium text-gray-600 mb-1 ml-1">{m.senderName}</p>
                      )}
                      <div className={`px-4 py-2 rounded-2xl ${own ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'}`}>
                        <p className="text-sm break-words">{m.text}</p>
                      </div>
                      <p className="text-[10px] mt-0.5 text-gray-400 mx-1">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 h-10 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
              />
              <button onClick={sendMessage} className="px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {/* Create Room Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCreateModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">Create Chat Room</h3>
              <button onClick={() => setCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={createRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Room Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tech Team Announcements"
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What's this room for?"
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Add Members</label>
                  <button type="button" onClick={fetchEligibleUsers} className="text-xs text-blue-500 hover:underline">
                    Refresh
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Search size={16} className="text-gray-400" />
                    <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search users..."
                      className="flex-1 bg-transparent border-none outline-none text-sm" />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {usersForCreate.length === 0 ? (
                    <div className="p-6 text-center">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {eligibleUsers.length === 0
                          ? user.role === 'T3_EXECUTIVE'
                            ? 'No team members yet. Ask Admin to add you to a team.'
                            : 'No users available'
                          : 'No users match your search'}
                      </p>
                    </div>
                  ) : usersForCreate.map((u) => (
                    <label key={u._id} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={form.memberIds.includes(u._id)}
                        onChange={() => toggleMember(u._id)} className="w-4 h-4" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${u.role === 'T1_VOLUNTEER' ? 'bg-green-100 text-green-700' :
                          u.role === 'T2_ASSOCIATE' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                        }`}>{u.role.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
                {form.memberIds.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">{form.memberIds.length} member(s) selected</p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {addMemberModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddMemberModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Add Member</h3>
                <p className="text-sm text-gray-500">to {selectedRoom.name}</p>
              </div>
              <button onClick={() => setAddMemberModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-gray-400" />
                <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search users..."
                  className="flex-1 bg-transparent border-none outline-none text-sm" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {usersForAdd.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {eligibleUsers.length === 0
                      ? 'No team members available'
                      : 'All available members already in this room'}
                  </p>
                </div>
              ) : usersForAdd.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <button onClick={() => addMemberToRoom(u._id)}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 flex-shrink-0 ml-2">
                    Add
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">Current: {selectedRoom.memberCount} members</span>
              <button onClick={() => setAddMemberModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation */}
      {deleteRoomModal && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteRoomModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete Chat Room</h3>
                <p className="text-xs text-gray-500 truncate">{selectedRoom.name}</p>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-800 font-medium mb-1">This will permanently delete:</p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>The chat room and all members</li>
                <li>All messages in this room</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteRoomModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">
                Cancel
              </button>
              <button onClick={deleteRoom} className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 flex items-center gap-2">
                <Trash2 size={14} /> Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================================
// QR CHECK-IN — T1/T2 self check-in/check-out
// ====================================================================
export const QRCheckIn = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [todayRecord, setTodayRecord] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [qrCode, setQrCode] = useState('');

  const loadData = async () => {
    try {
      const teamRes = await api.get('/teams/me');
      const teamList = teamRes.data.data;
      setTeams(teamList);
      if (teamList.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamList[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamData = async () => {
    if (!selectedTeamId) return;
    try {
      const [todayRes, statsRes, histRes] = await Promise.all([
        api.get(`/attendance/today?teamId=${selectedTeamId}`),
        api.get('/attendance/my-stats?days=30'),
        api.get('/attendance/me?days=14'),
      ]);
      setTodayRecord(todayRes.data.data);
      setStats(statsRes.data.data);
      setHistory(histRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadTeamData(); }, [selectedTeamId]);

  const handleCheckIn = async () => {
    if (!selectedTeamId) return alert('Select a team first');
    setProcessing(true);
    try {
      const res = await api.post('/attendance/check-in', { teamId: selectedTeamId });
      setTodayRecord(res.data.data);
      await loadTeamData();
      alert(`Checked in at ${new Date(res.data.data.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedTeamId) return;
    setProcessing(true);
    try {
      const res = await api.post('/attendance/check-out', { teamId: selectedTeamId });
      setTodayRecord(res.data.data);
      await loadTeamData();
      alert(`Checked out. Duration: ${res.data.data.durationMinutes} min`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <SkeletonCardGrid count={2} />;

  if (teams.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <UsersRound className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No teams yet</h2>
          <p className="text-sm text-gray-500">You need to be added to a team before you can check in.</p>
        </div>
      </div>
    );
  }

  const hasCheckedIn = !!todayRecord?.checkInTime;
  const hasCheckedOut = !!todayRecord?.checkOutTime;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-gray-500">Check in for your shift and track your attendance</p>
      </div>

      {/* Team Selector */}
      {teams.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Select Team</label>
          <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500">
            {teams.map((t) => (<option key={t._id} value={t._id}>{t.name}{t.eventTitle ? ` — ${t.eventTitle}` : ''}</option>))}
          </select>
        </div>
      )}

      {/* Personal Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">My Attendance Rate</p>
            <p className="text-3xl font-bold mt-1 text-blue-600">{stats.percentage}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">Present Days</p>
            <p className="text-3xl font-bold mt-1 text-green-600">{stats.present}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">Late Days</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{stats.late}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">Total Hours</p>
            <p className="text-3xl font-bold mt-1 text-purple-600">{stats.totalHours}h</p>
          </div>
        </div>
      )}

      {/* Today's Status */}
      <div className="bg-white rounded-xl border-l-4 border-l-green-500 border border-gray-200 p-6">
        <p className="text-sm font-semibold text-green-600 mb-3">TODAY'S STATUS</p>
        {!hasCheckedIn ? (
          <>
            <h3 className="text-xl font-bold mb-3">Ready to check in?</h3>
            <p className="text-sm text-gray-600 mb-5">Enter your team code or click check-in below.</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Team Code (optional)</label>
              <input value={qrCode} onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                placeholder="e.g. TBI-ABC123"
                className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500 font-mono text-center tracking-wider" />
            </div>
            <button onClick={handleCheckIn} disabled={processing}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
              <CheckCircle size={18} /> {processing ? 'Checking in...' : 'Check In Now'}
            </button>
          </>
        ) : hasCheckedOut ? (
          <>
            <h3 className="text-xl font-bold mb-2 text-green-600">Shift Complete</h3>
            <p className="text-sm text-gray-600">
              You worked {todayRecord.durationMinutes} minutes today.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              In: {new Date(todayRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' '} / Out: {new Date(todayRecord.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold mb-2 text-green-600">Checked In</h3>
            <p className="text-sm text-gray-600 mb-5">
              at {new Date(todayRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <button onClick={handleCheckOut} disabled={processing}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 flex items-center gap-2">
              <LogOut size={18} /> {processing ? 'Processing...' : 'Check Out'}
            </button>
          </>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold">Recent Attendance (Last 14 Days)</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Team</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((h) => (
                <tr key={h._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">{h.date}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{h.teamName}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{h.checkInTime ? new Date(h.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{h.checkOutTime ? new Date(h.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{h.durationMinutes ? `${h.durationMinutes}m` : '—'}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      h.status === 'present' ? 'bg-green-100 text-green-700' :
                      h.status === 'late' ? 'bg-amber-100 text-amber-700' :
                      h.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>{h.status.replace('_', ' ')}</span>
                  </td>
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
// EVENTS — With Event Head assignment
// ====================================================================
export const EventsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    headId: '',
    memberIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [eventsRes, usersRes] = await Promise.all([
          api.get('/events'),
          canCreate ? api.get('/admin/users') : Promise.resolve({ data: { data: [] } }),
        ]);
        setEvents(eventsRes.data.data);
        setUsers(usersRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [canCreate]);

  const toggleMember = (userId) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(userId)
        ? f.memberIds.filter((id) => id !== userId)
        : [...f.memberIds, userId],
    }));
  };

  const addEvent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Clean payload — no empty strings
      const payload = {
        title: form.title,
        date: form.date,
        location: form.location,
        description: form.description || '',
      };
      if (form.headId) payload.headId = form.headId;
      if (form.memberIds.length > 0) payload.memberIds = form.memberIds;

      const res = await api.post('/events', payload);
      setEvents([res.data.data, ...events]);
      setModal(false);
      setForm({ title: '', date: '', location: '', description: '', headId: '', memberIds: [] });
      setMemberSearch('');
      alert('Event created! Notifications sent.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const statusColor = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-700',
    closed: 'bg-red-100 text-red-700',
  };

  const eligibleHeads = users.filter((u) =>
    ['T3_EXECUTIVE', 'ADMIN', 'SUPER_ADMIN'].includes(u.role) && u._id !== user._id
  );

  const eligibleMembers = users.filter((u) =>
    ['T1_VOLUNTEER', 'T2_ASSOCIATE', 'T3_EXECUTIVE'].includes(u.role) &&
    u._id !== user._id &&
    u._id !== form.headId &&
    (u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><SkeletonCardGrid count={3} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-gray-500">{canCreate ? 'Create and manage events' : 'Browse events'}</p>
        </div>
        {canCreate && (
          <button onClick={() => setModal(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
            + Create Event
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <div key={ev._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">{ev.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[ev.status]}`}>{ev.status}</span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-1"><Calendar size={14} /> {ev.date}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-3"><MapPin size={14} /> {ev.location}</p>

              {ev.headName && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {ev.headName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-purple-600 font-semibold uppercase">Event Head</p>
                    <p className="text-xs text-purple-800 font-medium truncate">{ev.headName}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-500 mb-3 pt-2 border-t border-gray-100">
                <span><Users size={12} className="inline" /> {ev.memberCount || 0} members</span>
              </div>

              <button
                onClick={() => navigate(canCreate ? `/admin/events/${ev._id}` : `/t3/events/${ev._id}`)}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">Create Event</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={addEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Event Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Annual Tech Fest 2026"
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date *</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Location *</label>
                  <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Main Auditorium"
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Event Head *</label>
                <select required value={form.headId} onChange={(e) => setForm({ ...form, headId: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500">
                  <option value="">Select an event head...</option>
                  {eligibleHeads.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} — {u.role.replace('_', ' ')}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Head coordinates the entire event</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Add Members (Optional)</label>
                <div className="bg-gray-50 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Search size={16} className="text-gray-400" />
                    <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search users..."
                      className="flex-1 bg-transparent border-none outline-none text-sm" />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {eligibleMembers.length === 0 ? (
                    <p className="text-center text-gray-500 py-6 text-sm">No users available</p>
                  ) : eligibleMembers.map((u) => (
                    <label key={u._id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={form.memberIds.includes(u._id)}
                          onChange={() => toggleMember(u._id)} className="w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${u.role === 'T1_VOLUNTEER' ? 'bg-green-100 text-green-700' :
                          u.role === 'T2_ASSOCIATE' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                        }`}>{u.role.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
                {form.memberIds.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">{form.memberIds.length} member(s) selected</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What's this event about?"
                  className="w-full p-3 rounded-lg border border-gray-200 outline-none resize-none focus:border-blue-500" />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
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
// ATTENDANCE — T3 view: Generate QR, mark manually, view stats
// ====================================================================
export const AttendancePage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState([]);
  const [teamInfo, setTeamInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [manualModal, setManualModal] = useState(null);
  const [manualForm, setManualForm] = useState({ status: 'present', notes: '' });
  const [downloading, setDownloading] = useState(false);

  // Load T3's teams
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/teams/me');
        const list = res.data.data;
        setTeams(list);
        if (list.length > 0) setSelectedTeamId(list[0]._id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load team data when team or date changes
  const loadTeamData = async () => {
    if (!selectedTeamId) return;
    try {
      const [attRes, statsRes, histRes] = await Promise.all([
        api.get(`/attendance/team?teamId=${selectedTeamId}&date=${selectedDate}`),
        api.get(`/attendance/team/stats?teamId=${selectedTeamId}&date=${selectedDate}`),
        api.get(`/attendance/team/history?teamId=${selectedTeamId}&days=7`),
      ]);
      setRoster(attRes.data.data.roster);
      setTeamInfo(attRes.data.data.team);
      setStats(statsRes.data.data);
      setHistory(histRes.data.data.history);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [selectedTeamId, selectedDate]);

  // Manual mark
  const submitManual = async (e) => {
    e.preventDefault();
    if (!manualModal) return;
    setSaving(true);
    try {
      await api.post('/attendance/mark', {
        studentId: manualModal.studentId,
        teamId: selectedTeamId,
        date: selectedDate,
        status: manualForm.status,
        notes: manualForm.notes,
      });
      setManualModal(null);
      setManualForm({ status: 'present', notes: '' });
      await loadTeamData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark');
    } finally {
      setSaving(false);
    }
  };

  // Download CSV
  const downloadCSV = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/attendance/download?teamId=${selectedTeamId}`);
      const { csv, filename } = res.data.data;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download');
    } finally {
      setDownloading(false);
    }
  };

  // Generate QR token (frontend-only demo — students enter it manually)
  const generateQRToken = () => `TBI-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;

  const statusColor = {
    present: 'bg-green-100 text-green-700',
    late: 'bg-amber-100 text-amber-700',
    absent: 'bg-red-100 text-red-700',
    on_leave: 'bg-blue-100 text-blue-700',
    not_marked: 'bg-gray-100 text-gray-500',
  };

  if (loading) return <SkeletonTable rows={5} cols={5} />;

  if (teams.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <UsersRound className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No teams assigned to you</h3>
          <p className="text-sm text-gray-500">Ask an Admin to make you a Team Lead first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-gray-500">Mark attendance and track team presence</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowQR(!showQR)} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 text-sm">
            <QrCode size={16} /> {showQR ? 'Hide QR' : 'Generate QR'}
          </button>
          <button onClick={downloadCSV} disabled={downloading} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm">
            <Upload size={16} className="rotate-180" /> {downloading ? 'Downloading...' : 'Download CSV'}
          </button>
        </div>
      </div>

      {/* Team + Date Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Team</label>
            <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500">
              {teams.map((t) => (
                <option key={t._id} value={t._id}>{t.name}{t.eventTitle ? ` — ${t.eventTitle}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* QR Display */}
      {showQR && (
        <div className="bg-white rounded-xl border border-purple-200 p-6 flex flex-col items-center">
          <div className="w-48 h-48 bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center mb-4">
            <QrCode className="w-24 h-24 text-purple-500" />
          </div>
          <p className="text-xs text-gray-500 mb-2">Students can check-in with this code:</p>
          <p className="text-lg font-mono font-bold text-purple-700 tracking-wider bg-purple-50 px-4 py-2 rounded-lg">
            {generateQRToken()}
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">Attendance Rate</p>
            <p className="text-3xl font-bold mt-1 text-blue-600">{stats.percentage}%</p>
            <p className="text-xs text-gray-400 mt-1">{stats.attended} of {stats.totalMembers} present</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">Present</p>
            <p className="text-3xl font-bold mt-1 text-green-600">{stats.present}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">Late</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{stats.late}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">Absent</p>
            <p className="text-3xl font-bold mt-1 text-red-600">{stats.absent}</p>
          </div>
        </div>
      )}

      {/* 7-Day History Chart */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold mb-4">Last 7 Days — Attendance %</h3>
          <div className="flex items-end gap-2 h-32">
            {history.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end">
                <div
                  className={`w-full rounded-t transition-all ${d.percentage >= 75 ? 'bg-green-500' : d.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ height: `${Math.max(d.percentage, 3)}%` }}
                  title={`${d.date}: ${d.percentage}%`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            {history.map((d) => (
              <span key={d.date}>{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
            ))}
          </div>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold">Team Roster — {teamInfo?.name}</h3>
          <p className="text-xs text-gray-500">{roster.length} members</p>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roster.map((r) => (
              <tr key={r.studentId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {r.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.studentName}</p>
                      <p className="text-xs text-gray-500">{r.studentEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-6 py-4 text-xs text-gray-400 uppercase">{r.method || '—'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => { setManualModal(r); setManualForm({ status: r.status === 'not_marked' ? 'present' : r.status, notes: '' }); }}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    {r.status === 'not_marked' ? 'Mark' : 'Update'}
                  </button>
                </td>
              </tr>
            ))}
            {roster.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No members in this team yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Mark Modal */}
      {manualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setManualModal(null)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {manualModal.studentName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold">Mark Attendance</h3>
                <p className="text-xs text-gray-500">{manualModal.studentName}</p>
              </div>
            </div>

            <form onSubmit={submitManual} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'present', label: 'Present', color: 'green' },
                    { value: 'late', label: 'Late', color: 'amber' },
                    { value: 'absent', label: 'Absent', color: 'red' },
                    { value: 'on_leave', label: 'On Leave', color: 'blue' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, status: opt.value })}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
                        manualForm.status === opt.value
                          ? `border-${opt.color}-500 bg-${opt.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
                <textarea rows={2} value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Reason, etc."
                  className="w-full p-3 rounded-lg border border-gray-200 outline-none resize-none focus:border-blue-500" />
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setManualModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================================
// CERTIFICATES PAGE — For T1/T2/T3 only
// Redirects to external certificate portal
// ====================================================================
export const CertificatesPage = () => {
  // Replace with your real certificate portal URL
  const EXTERNAL_CERT_URL = 'https://certificates.tbi.example.com';

  const handleRedirect = () => {
    window.open(EXTERNAL_CERT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">My Certificates</h1>
        <p className="text-gray-500">Access your earned certificates on the external portal</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Award className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Certificate Portal</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Your event certificates are hosted on a dedicated portal. Click below to access,
          download, and verify your earned certificates.
        </p>
        <button
          onClick={handleRedirect}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 inline-flex items-center gap-2"
        >
          <Award size={18} /> Open Certificate Portal
          <ExternalLink size={16} />
        </button>
        <p className="text-xs text-gray-400 mt-4 break-all">{EXTERNAL_CERT_URL}</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">What you'll find there</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>All certificates earned from TBI events</li>
            <li>QR-verifiable digital certificates</li>
            <li>Downloadable PDF versions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// NOTIFICATIONS
// ====================================================================
export const NotificationsPage = () => {
  const socket = useSocket();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (notif) => {
      setNotifs((prev) => [notif, ...prev]);
    };
    socket.on('notification:new', handleNew);
    return () => socket.off('notification:new', handleNew);
  }, [socket]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs(notifs.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifs(notifs.map((n) => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const filtered = filter === 'all' ? notifs : notifs.filter((n) => !n.isRead);
  const unread = notifs.filter((n) => !n.isRead).length;

  const iconFor = (type) => {
    if (type === 'application') return <FileText className="w-5 h-5 text-blue-500" />;
    if (type === 'chat') return <MessageSquare className="w-5 h-5 text-green-500" />;
    if (type === 'certificate') return <Award className="w-5 h-5 text-amber-500" />;
    if (type === 'attendance') return <CheckCircle className="w-5 h-5 text-purple-500" />;
    if (type === 'announcement') return <Bell className="w-5 h-5 text-indigo-600" />;
    if (type === 'event') return <Calendar className="w-5 h-5 text-cyan-500" />;
    if (type === 'review') return <Star className="w-5 h-5 text-yellow-500" />;
    return <Bell className="w-5 h-5 text-gray-500" />;
  };

  const isAnnouncement = (type) => type === 'announcement';

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><SkeletonTable rows={5} cols={2} /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500">{unread} unread / {notifs.length} total</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-sm text-blue-500 hover:underline">Mark all read</button>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'}`}>
          All ({notifs.length})
        </button>
        <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'unread' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'}`}>
          Unread ({unread})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-gray-500">{filter === 'unread' ? "You're all caught up" : 'Activities will appear here'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filtered.map((n, i) => {
            const isAnn = isAnnouncement(n.type);
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`p-4 flex gap-4 items-start cursor-pointer transition ${
                  i > 0 ? 'border-t border-gray-100' : ''
                } ${
                  isAnn
                    ? !n.isRead
                      ? 'bg-indigo-50 border-l-4 border-l-indigo-500 hover:bg-indigo-100'
                      : 'bg-indigo-50/30 border-l-4 border-l-indigo-200 hover:bg-indigo-50/60'
                    : !n.isRead
                      ? 'bg-blue-50/30 hover:bg-blue-50/50'
                      : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isAnn ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  {iconFor(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm ${n.isRead ? 'font-normal' : 'font-semibold'} ${isAnn ? 'text-indigo-900' : ''}`}>
                      {n.title}
                    </p>
                    {isAnn && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                        ANNOUNCEMENT
                      </span>
                    )}
                    {!n.isRead && <span className={`w-2 h-2 rounded-full ${isAnn ? 'bg-indigo-500' : 'bg-blue-500'}`} />}
                  </div>
                  <p className={`text-sm mt-0.5 ${isAnn ? 'text-indigo-800' : 'text-gray-600'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            );
          })}
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
export const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [tiers, setTiers] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [top, setTop] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, tiersRes, monthlyRes, topRes, attendRes] = await Promise.all([
          api.get('/stats/admin'),
          api.get('/stats/users-by-tier'),
          api.get('/stats/monthly-applications'),
          api.get('/stats/top-performers'),
          api.get('/stats/attendance'),
        ]);
        setStats(statsRes.data.data);
        setTiers(tiersRes.data.data);
        setMonthly(monthlyRes.data.data);
        setTop(topRes.data.data);
        setAttendance(attendRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const tierPieData = [
    { name: 'T1', value: tiers.T1, color: '#4CAF50' },
    { name: 'T2', value: tiers.T2, color: '#2196F3' },
    { name: 'T3', value: tiers.T3, color: '#9C27B0' },
    { name: 'Admin', value: tiers.Admin + tiers.SuperAdmin, color: '#FF9800' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500">Insights and trends across the platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total Users" value={stats.totalUsers} />
        <KPI label="Active Events" value={stats.activeEvents} />
        <KPI label="Approval Rate" value={`${stats.approvalRate}%`} />
        <KPI label="Today Attendance" value={attendance ? `${attendance.rate}%` : '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">User Distribution</h3>
          {tierPieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={tierPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {tierPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 lg:col-span-2">
          <h3 className="font-semibold mb-4">Applications — Last 12 Months</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Area type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApps)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">Today's Attendance</h3>
          {!attendance || attendance.total === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No check-ins today</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Present', value: attendance.present },
                    { name: 'Late', value: attendance.late },
                    { name: 'Absent', value: attendance.absent },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">Top Performers</h3>
          {top.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No performance data yet</div>
          ) : (
            <div className="space-y-3">
              {top.map((u, i) => (
                <div key={u.userId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-blue-500'
                      }`}>{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.approvedCount} approved / {u.attendanceCount} days present</p>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-amber-600 flex-shrink-0">{u.score} pts</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
      alert('Member added');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  // Remove member
  const removeMember = async (teamId, userId, userName) => {
    if (!confirm(`Remove ${userName} from this team?\n\nIf they're not in another team of the same event, they'll also be removed from the event.`)) return;
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
                <p className="text-sm font-semibold mt-1 text-green-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Active
                </p>
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
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [creatingChat, setCreatingChat] = useState(false);

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams/me');
      setTeams(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Create or get chat room for a team
  const createOrGetChat = async (teamId) => {
    setCreatingChat(true);
    try {
      const res = await api.post(`/chat/rooms/team/${teamId}`);
      const room = res.data.data;
      alert(`Chat room ready: "${room.name}"\n\nOpening chat...`);
      navigate('/chat');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create chat');
    } finally {
      setCreatingChat(false);
    }
  };

  if (loading) return <SkeletonCardGrid count={3} />;

  // Detail view
  if (selected) {
    const team = teams.find((t) => t._id === selected);
    if (!team) return null;

    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
          <ChevronLeft size={16} /> Back to all teams
        </button>

        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <p className="text-gray-500">{team.eventTitle}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => createOrGetChat(team._id)}
              disabled={creatingChat}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 flex items-center gap-2 disabled:opacity-50"
            >
              <MessageSquare size={16} />
              {creatingChat ? 'Opening...' : 'Create / Add to Chat'}
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <MessageSquare size={16} /> Open Chat
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2">
              <QrCode size={16} /> Generate QR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Total Members</p>
            <p className="text-3xl font-bold mt-2">{team.members?.length || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Team Lead</p>
            <p className="text-lg font-bold mt-2">{team.leadName || team.leadId?.name || '—'}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Chat Status</p>
            <p className="text-lg font-bold mt-2 text-green-600">Active</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold">Members ({team.members?.length || 0})</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {team.members?.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {m.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{m.name}</span>
                      {m._id === (team.leadId?._id || team.leadId) && (
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                          LEAD
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.role === 'T3_EXECUTIVE' ? 'bg-purple-100 text-purple-700' :
                        m.role === 'T2_ASSOCIATE' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                      }`}>
                      {m.role.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Teams</h1>
        <p className="text-gray-500">Teams you lead as T3 Executive</p>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <UsersRound className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
          <p className="text-gray-500">Ask Admin to assign you as a team lead</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div key={t._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition cursor-pointer" onClick={() => setSelected(t._id)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{t.name}</h3>
                <MessageSquare className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-sm text-gray-500 mb-4">{t.eventTitle}</p>
              <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
                <span className="text-gray-500 flex items-center gap-1">
                  <Users size={14} /> {t.members?.length || 0} members
                </span>
                <span className="text-blue-500 font-medium text-xs">View Details</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ====================================================================
// ENHANCED T3 DASHBOARD
// ====================================================================
export const T3DashboardEnhanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myEvents, setMyEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [eventsRes, statsRes] = await Promise.all([
          api.get('/events/me'),
          api.get('/stats/t3'),
        ]);
        setMyEvents(eventsRes.data.data);
        setStats(statsRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [teamAttendance, setTeamAttendance] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const teamsRes = await api.get('/teams/me');
        const list = teamsRes.data.data;
        const withStats = await Promise.all(
          list.map(async (t) => {
            try {
              const s = await api.get(`/attendance/team/stats?teamId=${t._id}`);
              return { ...t, stats: s.data.data };
            } catch {
              return { ...t, stats: null };
            }
          })
        );
        setTeamAttendance(withStats);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnnouncementBanner />
      <div>
        <h1 className="text-2xl font-bold">Hi {user.name.split(' ')[0]}</h1>
        <p className="text-gray-500">Your events and pending tasks</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="My Events" value={stats.myEvents} />
        <KPI label="As Head" value={stats.eventsAsHead} />
        <KPI label="Pending Apps" value={stats.pendingApps} />
        <KPI label="Present Today" value={stats.attendanceToday} />
      </div>

      {/* Team Attendance Percentages */}
      {teamAttendance.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Team Attendance Today</h3>
            <button onClick={() => navigate('/t3/attendance')} className="text-xs text-purple-500 hover:underline">
              Manage →
            </button>
          </div>
          <div className="space-y-3">
            {teamAttendance.map((t) => {
              const pct = t.stats?.percentage || 0;
              return (
                <div key={t._id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{t.name}</span>
                    <span className={`font-medium ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {t.stats && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.stats.attended} / {t.stats.totalMembers} present today
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="bg-white p-5 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">My Events</h3>
          <button onClick={() => navigate('/t3/teams')} className="text-xs text-purple-500 hover:underline">
            View Teams
          </button>
        </div>

        {myEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No events assigned to you yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myEvents.map((ev) => {
              const isHead = ev.headId?._id === user._id || ev.headId === user._id;
              return (
                <div
                  key={ev._id}
                  className={`border rounded-lg p-4 hover:bg-purple-50 transition cursor-pointer ${isHead ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200'}`}
                  onClick={() => navigate(`/t3/events/${ev._id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{ev.title}</p>
                        {isHead && (
                          <span className="text-[10px] px-2 py-0.5 bg-purple-500 text-white rounded-full font-semibold">
                            HEAD
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{ev.date} / {ev.location}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex-shrink-0">
                      {ev.memberCount || 0} members
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/stats/t2');
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [myAttendance, setMyAttendance] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/attendance/my-stats?days=30');
        setMyAttendance(res.data.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnnouncementBanner />
      <div>
        <h1 className="text-2xl font-bold">Hey {user.name.split(' ')[0]}</h1>
        <p className="text-gray-500">Here's your activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="My Applications" value={stats.myApplications} />
        <KPI label="Approved" value={stats.approved} />
        <KPI label="My Teams" value={stats.myTeams} />
        <KPI label="Days Attended" value={stats.attendanceDays} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Pending" value={stats.pending} />
        <KPI label="Rejected" value={stats.rejected} />
        <KPI label="Certificates" value={stats.certificates} />
        <div></div>
      </div>

      {/* Personal Attendance Card */}
      {myAttendance && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">My Attendance (30 Days)</h3>
            <button onClick={() => navigate('/t1/checkin')} className="text-xs text-blue-500 hover:underline">
              View →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">{myAttendance.percentage}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Attendance Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{myAttendance.totalHours}h</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Hours</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 text-center">
            <div>
              <p className="text-lg font-bold text-green-600">{myAttendance.present}</p>
              <p className="text-[10px] text-gray-500 uppercase">Present</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600">{myAttendance.late}</p>
              <p className="text-[10px] text-gray-500 uppercase">Late</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">{myAttendance.absent}</p>
              <p className="text-[10px] text-gray-500 uppercase">Absent</p>
            </div>
          </div>
        </div>
      )}
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
// EVENT DETAIL — View details + Event Head manages members
// ====================================================================
export const EventDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', date: '', location: '', description: '', headId: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const canManage = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const isEventHead = event?.headId?._id === user._id || event?.headId === user._id;
  const canAddMembers = canManage || isEventHead;

  // Load event + users
  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchEvent();
      if (canAddMembers) {
        try {
          const res = await api.get('/admin/users');
          setUsers(res.data.data);
        } catch (err) { console.error(err); }
      }
    })();
  }, [id, canAddMembers]);

  const addMember = async (userId) => {
    setSaving(true);
    try {
      const res = await api.post(`/events/${id}/members`, { userId });
      setEvent(res.data.data);
      setMemberSearch('');
      alert('Member added');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (userId, userName) => {
    if (!confirm(`Remove ${userName} from this event?`)) return;
    try {
      const res = await api.delete(`/events/${id}/members/${userId}`);
      setEvent(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Open edit modal with current values
  const openEditModal = () => {
    setEditForm({
      title: event.title || '',
      date: event.date || '',
      location: event.location || '',
      description: event.description || '',
      headId: event.headId?._id || '',
    });
    setEditModal(true);
  };

  // Save event edits
  const saveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await api.patch(`/events/${id}`, editForm);
      setEvent(res.data.data);
      setEditModal(false);
      alert('Event updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update event');
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter users — exclude existing members + Event Head + only T1/T2 for non-admins
  const eligibleUsers = users.filter((u) => {
    const isMember = event?.members?.some((m) => m._id === u._id);
    if (isMember) return false;
    if (u._id === user._id) return false;

    // Admin can add anyone except SUPER_ADMIN
    if (canManage) return u.role !== 'SUPER_ADMIN';

    // Event Head (T3) can only add T1/T2
    if (isEventHead) return ['T1_VOLUNTEER', 'T2_ASSOCIATE'].includes(u.role);

    return false;
  }).filter((u) =>
    u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

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

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Event not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 hover:underline flex items-center gap-1 mx-auto">
          <ChevronLeft size={16} /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
        <ChevronLeft size={16} /> Back to Events
      </button>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs bg-white/20 backdrop-blur px-3 py-1 rounded-full font-medium">
            {event.status.toUpperCase()}
          </span>
          <Calendar className="w-8 h-8 text-white/60" />
        </div>
        <h1 className="text-3xl font-bold mb-3">{event.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-white/90">
          <span className="flex items-center gap-2"><Calendar size={16} /> {event.date}</span>
          <span className="flex items-center gap-2"><MapPin size={16} /> {event.location}</span>
        </div>

        {/* Event Head */}
        {event.headName && (
          <div className="mt-5 pt-5 border-t border-white/20 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              {event.headName.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-80">Event Head</p>
              <p className="font-semibold text-lg">{event.headName}</p>
              <p className="text-xs opacity-70">{event.headEmail}</p>
            </div>
          </div>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total Members" value={event.memberCount || event.members?.length || 0} />
        <KPI label="Teams" value={event.teams || 0} />
        <KPI label="Total Applicants" value={event.applicants || 0} />
        <KPI label="Status" value={event.status} />
      </div>

      {/* Description */}
      {event.description && (
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-3">About this Event</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
        </div>
      )}

      {/* MEMBERS SECTION */}
      <div className="bg-white p-5 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" /> Event Members
              <span className="text-sm font-normal text-gray-500">({event.memberCount || event.members?.length || 0})</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {canAddMembers ? 'Manage the event workforce' : 'Members assigned to this event'}
            </p>
          </div>
          {canAddMembers && (
            <button onClick={() => setAddMemberModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 flex items-center gap-2">
              <UserPlus size={16} /> Add Member
            </button>
          )}
        </div>

        {(!event.members || event.members.length === 0) ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No members yet</p>
            {canAddMembers && (
              <button onClick={() => setAddMemberModal(true)} className="mt-3 text-sm text-blue-500 hover:underline">
                Add the first member
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {event.members.map((m) => {
              const isHead = event.headId?._id === m._id || event.headId === m._id;
              return (
                <div key={m._id} className={`flex items-center justify-between p-3 border rounded-lg ${isHead ? 'border-purple-200 bg-purple-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${isHead ? 'bg-purple-500' : 'bg-blue-500'}`}>
                      {m.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        {isHead && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-200 text-purple-800 rounded-full font-semibold">
                            HEAD
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                    </div>
                  </div>
                  {canAddMembers && !isHead && (
                    <button onClick={() => removeMember(m._id, m.name)}
                      className="text-xs text-red-500 hover:underline flex-shrink-0 ml-2">
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Actions */}
      {canManage && (
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">Admin Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={openEditModal} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 flex items-center gap-2">
              <Settings size={14} /> Edit Event
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Close Event</button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Export Report</button>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {addMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddMemberModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Add Member</h3>
                <p className="text-sm text-gray-500">to {event.title}</p>
              </div>
              <button onClick={() => setAddMemberModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="flex-1 bg-transparent border-none outline-none text-sm" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {eligibleUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  {memberSearch ? 'No users match your search' : 'No users available to add'}
                </p>
              ) : eligibleUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${u.role === 'T1_VOLUNTEER' ? 'bg-green-100 text-green-700' :
                        u.role === 'T2_ASSOCIATE' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                      }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                  <button onClick={() => addMember(u._id)} disabled={saving}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 disabled:opacity-50 flex-shrink-0 ml-2">
                    + Add
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Current: {event.memberCount || event.members?.length || 0} members
              </span>
              <button onClick={() => setAddMemberModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">Edit Event</h3>
              <button onClick={() => setEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Event Title *</label>
                <input required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date *</label>
                  <input type="date" required value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Location *</label>
                  <input required value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Event Head *</label>
                <select value={editForm.headId} onChange={(e) => setEditForm({ ...editForm, headId: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500">
                  <option value="">Select an event head...</option>
                  {users.filter((u) => ['T3_EXECUTIVE', 'ADMIN', 'SUPER_ADMIN'].includes(u.role)).map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} — {u.role.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-3 rounded-lg border border-gray-200 outline-none resize-none focus:border-blue-500" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" disabled={savingEdit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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


export const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Users, title: 'Role-Based Dashboards', desc: 'Separate interfaces for Super Admin, Admin, T3 Executives, T2 Associates, and T1 Volunteers.' },
    { icon: Calendar, title: 'Event Management', desc: 'Create events, assign Event Heads, and manage teams with auto-created chat rooms.' },
    { icon: MessageSquare, title: 'Real-Time Chat', desc: 'Instant team communication with Socket.io. Messages delivered live across all members.' },
    { icon: QrCode, title: 'QR Check-In', desc: 'Fast attendance via QR codes. Verified check-in/check-out tracking for every shift.' },
    { icon: Bell, title: 'Live Notifications', desc: 'Get notified instantly when you are added to teams, approved for shifts, or assigned roles.' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track participation, approval rates, team performance, and top performers in real time.' },
  ];

  const stats = [
    { value: '5', label: 'Role Tiers' },
    { value: '30+', label: 'Screens' },
    { value: 'Real-time', label: 'Notifications' },
    { value: '100%', label: 'Secure JWT Auth' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xl font-bold text-gray-900">TBI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
            <a href="#how" className="text-sm text-gray-600 hover:text-gray-900">How It Works</a>
            <a href="#stats" className="text-sm text-gray-600 hover:text-gray-900">Impact</a>
          </div>
          <button onClick={() => navigate('/login')} className="px-5 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition">
            Sign In
          </button>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Workforce Management Platform
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Manage events.<br />Lead teams.<br /><span className="text-blue-500">Track impact.</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                A unified platform for TBI student engagement and event workforce management. Replace spreadsheets and WhatsApp groups with a single source of truth.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate('/login')} className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 inline-flex items-center gap-2 shadow-lg shadow-blue-500/20">
                  Get Started
                  <ChevronRight size={18} />
                </button>
                <a href="#features" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-white">
                  See Features
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-3 text-xs text-gray-400">TBI Workforce Platform</div>
                </div>
                <div className="space-y-3">
                  <div className="h-8 bg-blue-500 rounded-lg w-1/2" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-16 bg-blue-50 rounded-lg" />
                    <div className="h-16 bg-green-50 rounded-lg" />
                    <div className="h-16 bg-purple-50 rounded-lg" />
                  </div>
                  <div className="h-32 bg-gray-50 rounded-lg" />
                  <div className="flex gap-2">
                    <div className="h-10 bg-blue-500 rounded-lg flex-1" />
                    <div className="h-10 bg-gray-200 rounded-lg w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stats" className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-bold mb-2">{s.value}</div>
                <div className="text-sm text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Everything you need to run events</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Built for real-world workforce management, from onboarding to certificates.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-600">Four steps from signup to certificate</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Admin Creates', desc: 'Set up events and assign Event Heads' },
              { num: '02', title: 'T3 Leads', desc: 'Event Head builds teams and adds members' },
              { num: '03', title: 'Members Work', desc: 'Team members check in via QR and coordinate in chat' },
              { num: '04', title: 'Track & Certify', desc: 'Analytics track performance, certificates issued externally' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-5xl font-bold text-blue-100 mb-3">{s.num}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-500 to-indigo-600">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to modernize your event workflow?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">Join TBI Admins, Team Leads, and Volunteers using a single platform.</p>
          <button onClick={() => navigate('/login')} className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 inline-flex items-center gap-2">
            Sign In to Platform
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-white font-bold">TBI</span>
              <span className="text-sm">Workforce Platform</span>
            </div>
            <p className="text-sm">Built for Technology Business Incubators</p>
          </div>
        </div>
      </footer>
    </div>
  );
};


export const ChangePasswordPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const checks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match: newPassword && newPassword === confirm,
  };
  const allValid = Object.values(checks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!allValid) return setError('Please complete all requirements');
    setLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      alert('Password changed successfully. Please login again.');
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold">Password Change Required</h1>
            <p className="text-gray-500 mt-2 text-sm">
              You must set a new password before continuing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Your temp password"
                className="w-full h-12 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Strong password"
                className="w-full h-12 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                className="w-full h-12 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500" required />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'length', label: '8+ characters' },
                { key: 'upper', label: '1 uppercase' },
                { key: 'lower', label: '1 lowercase' },
                { key: 'number', label: '1 number' },
                { key: 'special', label: '1 special char' },
                { key: 'match', label: 'Passwords match' },
              ].map((c) => (
                <div key={c.key} className={`flex items-center gap-1.5 ${checks[c.key] ? 'text-green-600' : 'text-gray-400'}`}>
                  {checks[c.key] ? <CheckCircle size={14} /> : <X size={14} />}
                  <span>{c.label}</span>
                </div>
              ))}
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

            <button type="submit" disabled={loading || !allValid}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium rounded-lg transition">
              {loading ? 'Updating...' : 'Change Password & Continue'}
            </button>

            <button type="button" onClick={() => { logout(); navigate('/login'); }}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700">
              Cancel and logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


// ====================================================================
// PREFERENCES PAGE — Notification settings
// ====================================================================
export const PreferencesPage = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/preferences/me');
        // Ensure new categories have defaults
        const data = res.data.data;
        if (!data.categories.announcement) data.categories.announcement = true;
        if (!data.categories.review) data.categories.review = true;
        setPrefs(data);
        setOriginal(JSON.parse(JSON.stringify(data)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (key) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setPrefs((p) => ({
        ...p,
        [parent]: { ...p[parent], [child]: !p[parent][child] },
      }));
    } else {
      setPrefs((p) => ({ ...p, [key]: !p[key] }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/preferences/me', prefs);
      setPrefs(res.data.data);
      setOriginal(JSON.parse(JSON.stringify(res.data.data)));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(prefs) !== JSON.stringify(original);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!prefs || !prefs.categories) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Unable to Load Preferences</h2>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ROLE-BASED CATEGORIES
  const getCategoriesForRole = (role) => {
    if (role === 'T1_VOLUNTEER' || role === 'T2_ASSOCIATE') {
      return [
        { key: 'application', label: 'My Applications', desc: 'When your applications are approved, rejected, or waitlisted' },
        { key: 'event', label: 'Events', desc: 'New events published and event updates' },
        { key: 'chat', label: 'Chat Rooms', desc: 'When you are added to a chat room' },
        { key: 'attendance', label: 'Attendance', desc: 'Check-in confirmations and reminders' },
        { key: 'announcement', label: 'Announcements', desc: 'Important messages from leads and admins' },
        { key: 'system', label: 'System', desc: 'Role changes and account updates' },
      ];
    }

    if (role === 'T3_EXECUTIVE') {
      return [
        { key: 'application', label: 'Team Applications', desc: 'New applicants to your teams' },
        { key: 'event', label: 'My Events', desc: 'Updates on events you lead or manage' },
        { key: 'chat', label: 'Team Chats', desc: 'Activity in team chat rooms' },
        { key: 'attendance', label: 'Team Attendance', desc: 'Team check-in activity' },
        { key: 'review', label: 'Reviews', desc: 'When you receive or submit reviews' },
        { key: 'announcement', label: 'Announcements', desc: 'Broadcasts from admins' },
        { key: 'system', label: 'System', desc: 'Role changes and account updates' },
      ];
    }

    // Admin / Super Admin
    return [
      { key: 'application', label: 'Applications', desc: 'Application submissions and approvals' },
      { key: 'event', label: 'Events', desc: 'Event creation, updates, and closures' },
      { key: 'chat', label: 'Chat Activity', desc: 'Chat room creation and deletions' },
      { key: 'announcement', label: 'Announcements', desc: 'Broadcasts and team messages' },
      { key: 'system', label: 'System & Security', desc: 'User provisioning, role changes, revocations' },
    ];
  };

  const categories = getCategoriesForRole(user.role);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <p className="text-gray-500">Control how and when you receive notifications</p>
      </div>

      {/* Master channels */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-5">Delivery Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">In-App Notifications</p>
              <p className="text-xs text-gray-500">Show notifications in the bell icon</p>
            </div>
            <ToggleSwitch checked={prefs.inApp} onChange={() => toggle('inApp')} />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive notifications via email</p>
            </div>
            <ToggleSwitch checked={prefs.email} onChange={() => toggle('email')} />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
            <div>
              <p className="text-sm font-medium">SMS Notifications</p>
              <p className="text-xs text-gray-500">Receive critical alerts via SMS</p>
            </div>
            <ToggleSwitch checked={prefs.sms} onChange={() => toggle('sms')} />
          </div>
        </div>
      </div>

      {/* Role-based categories */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-2">Notification Types</h3>
        <p className="text-sm text-gray-500 mb-5">
          Categories available for your role: <span className="font-medium text-gray-700">
            {user.role.replace('_', ' ')}
          </span>
        </p>
        <div className="space-y-3">
          {categories.map((c) => (
            <div key={c.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs text-gray-500">{c.desc}</p>
              </div>
              <ToggleSwitch
                checked={prefs.categories[c.key] !== false}
                onChange={() => toggle(`categories.${c.key}`)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 sticky bottom-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        {hasChanges && (
          <button onClick={() => setPrefs(JSON.parse(JSON.stringify(original)))} className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
            Reset
          </button>
        )}
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle size={16} /> Saved
          </span>
        )}
      </div>
    </div>
  );
};

// ====================================================================
// TOGGLE SWITCH — Reusable toggle component
// ====================================================================
export const ToggleSwitch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-blue-500' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);


// ====================================================================
// ADD USER PAGE — Dedicated page for creating new users
// ====================================================================
export const AddUserPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const canCreateAdmin = currentUser.role === 'SUPER_ADMIN';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'T1_VOLUNTEER',
  });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/users', form);
      setCreated({
        name: res.data.data.name,
        email: res.data.data.email,
        role: res.data.data.role,
      });
      setForm({ name: '', email: '', phone: '', role: 'T1_VOLUNTEER' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = [
    { value: 'T1_VOLUNTEER', label: 'T1 Volunteer', desc: 'Event helper, applies to shifts', icon: 'T1', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'T2_ASSOCIATE', label: 'T2 Associate', desc: 'Team coordinator, assists T1s', icon: 'T2', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'T3_EXECUTIVE', label: 'T3 Executive', desc: 'Senior lead, manages teams', icon: 'T3', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  ];

  if (created) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">User Created Successfully</h2>
          <p className="text-gray-500 mb-6">
            An email with login credentials has been sent to <strong>{created.email}</strong>
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 max-w-md mx-auto">
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="text-xs text-gray-500">Name</span>
              <span className="text-sm font-medium">{created.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="text-xs text-gray-500">Email</span>
              <span className="text-sm font-medium">{created.email}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-500">Role</span>
              <span className="text-sm font-medium">{created.role.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setCreated(null)}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
            >
              + Add Another User
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              View All Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate('/admin/users')}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-4"
        >
          <ChevronLeft size={16} /> Back to Users
        </button>
        <h1 className="text-2xl font-bold">Add New User</h1>
        <p className="text-gray-500">Create a new account and send credentials via email</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Arjun Mehta"
              className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email Address *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="arjun@tbi.org"
                className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone (optional)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Assign Role *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {roleOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: opt.value })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    form.role === opt.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold ${opt.color} mb-2`}>
                    {opt.icon}
                  </span>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>User account is created with a random temporary password</li>
                <li>Credentials are emailed to the user automatically</li>
                <li>User must set a new password on first login (one-time use)</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? 'Creating User...' : 'Create User & Send Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ====================================================================
// ANNOUNCEMENTS PAGE
// Admin/SA can broadcast to ALL. T3/T2 can broadcast to their teams.
// ====================================================================
export const AnnouncementsPage = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', target: 'ALL', targetTeamId: '', targetEventId: '' });
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const isT3 = user.role === 'T3_EXECUTIVE';
  const isT2 = user.role === 'T2_ASSOCIATE';
  const canCreate = isAdmin || isT3 || isT2;

  // Load announcements + teams + events
  const fetchAll = async () => {
    try {
      const [annRes, teamsRes, eventsRes] = await Promise.all([
        api.get('/announcements'),
        (isT3 || isT2) ? api.get('/teams/me') : api.get('/teams'),
        (isT3 || isT2) ? api.get('/events/me') : api.get('/events'),
      ]);
      setAnnouncements(annRes.data.data);
      setTeams(teamsRes.data.data);
      setEvents(eventsRes.data.data);
    } catch (err) {
      console.error('Load failed:', err);
      setLoadError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Default target based on role
  useEffect(() => {
    if (isT3 || isT2) {
      setForm((f) => ({ ...f, target: 'TEAM' }));
    } else if (isAdmin) {
      setForm((f) => ({ ...f, target: 'ALL' }));
    }
  }, [user.role]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        target: form.target,
      };

      if (form.target === 'TEAM') {
        if (!form.targetTeamId) throw new Error('Please select a team');
        payload.targetTeamId = form.targetTeamId;
      }
      if (form.target === 'EVENT') {
        if (!form.targetEventId) throw new Error('Please select an event');
        payload.targetEventId = form.targetEventId;
      }

      await api.post('/announcements', payload);
      setModal(false);
      setForm({ title: '', message: '', target: isAdmin ? 'ALL' : 'TEAM', targetTeamId: '', targetEventId: '' });
      await fetchAll();
      alert('Announcement sent successfully');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to send');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(announcements.filter((a) => a._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const targetLabel = (ann) => {
    if (ann.target === 'ALL') return 'Everyone';
    if (ann.target === 'TEAM') return `Team: ${ann.targetTeamName || 'Unknown'}`;
    if (ann.target === 'EVENT') return `Event: ${ann.targetEventTitle || 'Unknown'}`;
    return ann.target;
  };

  if (loading) return <SkeletonTable rows={4} cols={3} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-gray-500">
            {isAdmin ? 'Broadcast messages to everyone or specific events' :
             'Send messages to your team'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={16} /> New Announcement
          </button>
        )}
      </div>

      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          Failed to load: {loadError}
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
          {canCreate && (
            <button onClick={() => setModal(true)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
              Send First Announcement
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{a.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {targetLabel(a)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    By {a.createdByName} ({a.createdByRole.replace('_', ' ')}) / {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>
                {(a.createdBy === user._id || isAdmin) && (
                  <button onClick={() => handleDelete(a._id)} className="text-red-500 hover:underline text-xs flex-shrink-0 ml-2">
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{a.message}</p>
              <p className="text-xs text-gray-400 mt-3">
                Sent to {a.recipientCount} {a.recipientCount === 1 ? 'person' : 'people'}
              </p>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">New Announcement</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Shift schedule updated"
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Type your message..."
                  className="w-full p-3 rounded-lg border border-gray-200 outline-none resize-none focus:border-blue-500"
                />
              </div>

              {/* ADMIN / SUPER ADMIN TARGET OPTIONS */}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Send To *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, target: 'ALL', targetTeamId: '', targetEventId: '' })}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        form.target === 'ALL'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className="w-5 h-5 text-blue-500 mb-2" />
                      <p className="text-sm font-semibold">Everyone</p>
                      <p className="text-xs text-gray-500 mt-0.5">All active users</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, target: 'EVENT', targetTeamId: '', targetEventId: '' })}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        form.target === 'EVENT'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Calendar className="w-5 h-5 text-purple-500 mb-2" />
                      <p className="text-sm font-semibold">Specific Event</p>
                      <p className="text-xs text-gray-500 mt-0.5">Event members only</p>
                    </button>
                  </div>
                </div>
              )}

              {/* EVENT SELECTOR (when target = EVENT) */}
              {isAdmin && form.target === 'EVENT' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Select Event *</label>
                  <select
                    required
                    value={form.targetEventId}
                    onChange={(e) => setForm({ ...form, targetEventId: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
                  >
                    <option value="">Choose an event...</option>
                    {events.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.title} {ev.date ? `(${ev.date})` : ''}
                      </option>
                    ))}
                  </select>
                  {events.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">No events available yet</p>
                  )}
                </div>
              )}

              {/* TEAM SELECTOR (for T3/T2) */}
              {(isT3 || isT2) && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Send To Team *</label>
                  <select
                    required
                    value={form.targetTeamId}
                    onChange={(e) => setForm({ ...form, target: 'TEAM', targetTeamId: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 outline-none focus:border-blue-500"
                  >
                    <option value="">Select a team...</option>
                    {teams.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} {t.eventTitle ? `- ${t.eventTitle}` : ''}
                      </option>
                    ))}
                  </select>
                  {teams.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      You aren't part of any team yet. Ask your Admin to add you to a team.
                    </p>
                  )}
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-start gap-2">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <span>Recipients will get an instant in-app notification.</span>
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? 'Sending...' : 'Send Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


// ====================================================================
// ANNOUNCEMENT POPUP — Shows unread announcements on login
// ====================================================================
export const AnnouncementPopup = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkKey = `announcements_shown_${user._id}_${new Date().toDateString()}`;
    const alreadyShown = sessionStorage.getItem(checkKey);
    if (alreadyShown) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/announcements');
        const list = res.data.data || [];
        // Show only last 24 hours of announcements
        const recent = list.filter((a) => {
          const created = new Date(a.createdAt).getTime();
          const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
          return created > dayAgo;
        }).slice(0, 5);

        if (recent.length > 0) {
          setAnnouncements(recent);
          setCurrentIndex(0);
          setVisible(true);
          sessionStorage.setItem(checkKey, 'true');
        }
      } catch (err) {
        // Silent fail — don't block the app
      }
    };

    // Small delay so the app can load
    setTimeout(fetchUnread, 800);
  }, [user]);

  if (!visible || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const isLast = currentIndex === announcements.length - 1;

  const handleNext = () => {
    if (isLast) {
      setVisible(false);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDismiss = () => setVisible(false);

  const targetLabel = (a) => {
    if (a.target === 'ALL') return 'Everyone';
    if (a.target === 'TEAM') return `Team: ${a.targetTeamName || ''}`;
    if (a.target === 'EVENT') return `Event: ${a.targetEventTitle || ''}`;
    return a.target;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider opacity-90 font-medium">
                  {announcements.length > 1 ? `Announcement ${currentIndex + 1} of ${announcements.length}` : 'Announcement'}
                </p>
                <p className="font-semibold text-lg">You have new updates</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="inline-block text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
            {targetLabel(current)}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">{current.title}</h3>

          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-5">
            {current.message}
          </p>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900">{current.createdByName}</p>
              <p className="text-[11px] text-gray-500">
                {current.createdByRole.replace('_', ' ')} / {new Date(current.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          {/* Dots indicator */}
          {announcements.length > 1 && (
            <div className="flex gap-1.5">
              {announcements.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIndex ? 'w-6 bg-blue-500' : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Dismiss
            </button>
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 text-sm"
            >
              {isLast ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};