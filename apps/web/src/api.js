const BACKEND_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:5000');
const API_BASE = `${BACKEND_URL}/api/v1`;

const getToken = () => {
  return (typeof window !== 'undefined' ? (sessionStorage.getItem('tbi_token') || localStorage.getItem('tbi_token')) : null);
};

const touchActivity = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('app:activity'));
  }
};

const handleUnauthorized = (status, message = '') => {
  if (status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    sessionStorage.removeItem('tbi_user');
    sessionStorage.removeItem('tbi_token');
    localStorage.removeItem('tbi_user');
    localStorage.removeItem('tbi_token');
    const msg = String(message || '').toLowerCase();
    const reason = msg.includes('timed out') ? 'timeout' : msg.includes('session ended') ? 'session_ended' : 'session_expired';
    window.location.href = `/login?reason=${reason}`;
  }
};

export const api = {
  get: async (url) => {
    touchActivity();
    const token = getToken();
    const res = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      handleUnauthorized(res.status, data?.message);
      const err = new Error(data.message || 'API request failed');
      err.response = { data, status: res.status };
      throw err;
    }
    return { data };
  },
  post: async (url, body) => {
    touchActivity();
    const token = getToken();
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      handleUnauthorized(res.status, data?.message);
      const err = new Error(data.message || 'API request failed');
      err.response = { data, status: res.status };
      throw err;
    }
    return { data };
  },
  patch: async (url, body) => {
    touchActivity();
    const token = getToken();
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      handleUnauthorized(res.status, data?.message);
      const err = new Error(data.message || 'API request failed');
      err.response = { data, status: res.status };
      throw err;
    }
    return { data };
  },
  delete: async (url) => {
    touchActivity();
    const token = getToken();
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      handleUnauthorized(res.status, data?.message);
      const err = new Error(data.message || 'API request failed');
      err.response = { data, status: res.status };
      throw err;
    }
    return { data };
  },
};

export default api;
