const API_BASE = 'http://localhost:5000/api/v1';

export const api = {
  get: async (url) => {
    const token = localStorage.getItem('tbi_token');
    const res = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'API request failed');
      err.response = { data, status: res.status };
      throw err;
    }
    return { data };
  },
  post: async (url, body) => {
    const token = localStorage.getItem('tbi_token');
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
      const err = new Error(data.message || 'API request failed');
      err.response = { data, status: res.status };
      throw err;
    }
    return { data };
  },
  patch: async (url, body) => {
    const token = localStorage.getItem('tbi_token');
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
      const err = new Error(data.message || 'API request failed');
      err.response = { data, status: res.status };
      throw err;
    }
    return { data };
  },
  delete: async (url) => {
    const token = localStorage.getItem('tbi_token');
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'API request failed');
      err.response = { data, status: res.status };
      throw err;
    }
    return { data };
  },
};

export default api;
