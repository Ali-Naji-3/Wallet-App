// API Endpoints Configuration
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    LOGOUT: '/api/auth/logout',
  },
  
  // Admin - Users
  ADMIN_USERS: {
    LIST: '/api/admin/users',
    GET: (id) => `/api/admin/users/${id}`,
    CREATE: '/api/admin/users',
    UPDATE: (id) => `/api/admin/users/${id}`,
    DELETE: (id) => `/api/admin/users/${id}`,
    FREEZE: (id) => `/api/admin/users/${id}/freeze`,
    UNFREEZE: (id) => `/api/admin/users/${id}/unfreeze`,
    RESET_PASSWORD: (id) => `/api/admin/users/${id}/reset-password`,
    PROMOTE: (id) => `/api/admin/users/${id}/promote`,
  },
  
  // Admin - Transactions
  ADMIN_TRANSACTIONS: {
    LIST: '/api/admin/transactions',
    GET: (id) => `/api/admin/transactions/${id}`,
  },
  
  // Admin - Stats
  ADMIN_STATS: {
    DASHBOARD: '/api/admin/stats',
  },
  
  // Wallets
  WALLETS: {
    MY: '/api/wallets/my',
    CURRENCIES: '/api/wallets/currencies',
    FX_LATEST: '/api/wallets/fx/latest',
  },
  
  // Transactions
  TRANSACTIONS: {
    MY: '/api/transactions/my',
  },
  
  // Dashboard
  DASHBOARD: {
    PORTFOLIO: '/api/dashboard/portfolio',
  },
  
  // Notifications
  NOTIFICATIONS: {
    MY: '/api/notifications/my',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
  },
  
  // Admin - Support
  ADMIN_SUPPORT: {
    SEARCH: '/api/admin/support/search',
    SEND_VERIFICATION: '/api/admin/support/send-verification',
    RECENT_EMAILS: '/api/admin/support/recent-emails',
    SAVE_REQUEST: '/api/admin/support/save-request',
    GET_REQUESTS: '/api/admin/support/requests',
  },
  
  // Support (User-facing)
  SUPPORT: {
    SUBMIT_REQUEST: '/api/support/submit',
  },
};

