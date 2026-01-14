import { getStoredToken, getStoredRole } from '../auth/storage';

export const accessControlProvider = {
  can: async ({ resource }) => {
    // Client-side only
    if (typeof window === 'undefined') {
      return { can: false };
    }

    // Use session-scoped helpers for per-tab isolation
    const token = getStoredToken();
    const role = getStoredRole() || 'user';

    if (!token) {
      return { can: false };
    }


    // Admin-only resources in Refine (admin pages / resources)
    const adminResources = ['users', 'transactions', 'wallets', 'settings', 'kyc', 'audit-logs'];

    if (adminResources.includes(resource || '')) {
      // Only admins can access these resources on the client
      if (role !== 'admin') {
        return {
          can: false,
          reason: 'Admin role required',
        };
      }
      return { can: true };
    }

    // Default: allow for non-admin resources when authenticated
    return { can: true };
  },
};

