const API_BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('fxwallet_token');
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const registerUser = async ({ email, password, fullName }) => {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, fullName }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to register');
  }
  return res.json();
};

export const loginUser = async ({ email, password }) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to login');
  }
  return res.json();
};

export const fetchProfile = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load profile');
  }
  return res.json();
};

export const updateProfile = async ({ fullName, baseCurrency, timezone }) => {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ fullName, baseCurrency, timezone }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to update profile');
  }
  return res.json();
};

export const fetchWallets = async () => {
  const res = await fetch(`${API_BASE_URL}/wallets/my`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load wallets');
  }
  return res.json();
};

export const fetchCurrencies = async () => {
  const res = await fetch(`${API_BASE_URL}/wallets/currencies`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load currencies');
  }
  return res.json();
};

export const fetchLatestFxRates = async (base = 'USD') => {
  const res = await fetch(`${API_BASE_URL}/wallets/fx/latest?base=${encodeURIComponent(base)}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load FX rates');
  }
  return res.json();
};

export const createExchange = async ({ sourceWalletId, targetWalletId, amount, note }) => {
  const res = await fetch(`${API_BASE_URL}/transactions/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ sourceWalletId, targetWalletId, amount, note }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to perform exchange');
  }
  return res.json();
};

export const createTransfer = async ({ sourceWalletId, targetWalletId, amount, note }) => {
  const res = await fetch(`${API_BASE_URL}/transactions/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ sourceWalletId, targetWalletId, amount, note }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to perform transfer');
  }
  return res.json();
};

export const fetchMyTransactions = async () => {
  const res = await fetch(`${API_BASE_URL}/transactions/my`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load transactions');
  }
  return res.json();
};

// Notifications
export const fetchMyNotifications = async (limit = 10) => {
  const res = await fetch(`${API_BASE_URL}/notifications/my?limit=${limit}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load notifications');
  }
  return res.json();
};

export const markNotificationRead = async (id) => {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to update notification');
  }
  return res.json();
};

// Dashboard APIs
export const fetchPortfolioSummary = async () => {
  const res = await fetch(`${API_BASE_URL}/dashboard/portfolio`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load portfolio');
  }
  return res.json();
};

export const fetchRecentActivity = async (limit = 10) => {
  const res = await fetch(`${API_BASE_URL}/dashboard/activity?limit=${limit}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load activity');
  }
  return res.json();
};

// Admin APIs
export const fetchAdminStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/stats`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load admin stats');
  }
  return res.json();
};

export const fetchAdminUsers = async (page = 1, limit = 20, search = '') => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  
  const res = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load users');
  }
  return res.json();
};

export const fetchAdminUserDetails = async (userId) => {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load user details');
  }
  return res.json();
};

export const freezeUser = async (userId) => {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/freeze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to freeze user');
  }
  return res.json();
};

export const unfreezeUser = async (userId) => {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/unfreeze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to unfreeze user');
  }
  return res.json();
};

export const fetchAdminTransactions = async (page = 1, limit = 50, type = '') => {
  const params = new URLSearchParams({ page, limit });
  if (type) params.append('type', type);
  
  const res = await fetch(`${API_BASE_URL}/admin/transactions?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load transactions');
  }
  return res.json();
};
