import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StatWidget, ChartWidget, TableWidget } from '../../components/admin/DashboardWidget';
import { fetchAdminStats, fetchAdminUsers, fetchAdminTransactions } from '../../api';
import './admin-dashboard.css';

/**
 * Independent Admin Dashboard Page
 * Completely separate from DashboardPage with its own layout
 */
function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setError('');
      
      // First, ensure admin user exists and has admin role
      try {
        await fetch('http://localhost:3000/api/admin/create-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch(() => {}); // Ignore errors, just try to create
      } catch (e) {
        // Ignore
      }
      
      const [statsData, usersData, txData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(1, 5).catch(() => ({ users: [] })),
        fetchAdminTransactions(1, 10).catch(() => ({ transactions: [] })),
      ]);
      setStats(statsData);
      setRecentUsers(usersData.users || []);
      setRecentTransactions(txData.transactions || []);
    } catch (err) {
      // Check if it's a forbidden error - user might not have admin role
      if (err.message.includes('Forbidden') || err.message.includes('Admin access required')) {
        setError('You do not have admin access. Please ensure your account has admin role. If you just logged in with admin@admin.com, the account may need to be updated. Please contact support or run the SQL script to set your role to admin.');
      } else {
        setError(err.message || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fxwallet_token');
    navigate('/login');
  };

  if (loading && !stats) {
    return (
      <div className="admin-dashboard-container">
        <div className="admin-dashboard-loading">
          <div className="admin-dashboard-spinner">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Independent Header */}
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-header-left">
          <h1 className="admin-dashboard-title">Admin Dashboard</h1>
          <p className="admin-dashboard-subtitle">System overview and statistics</p>
        </div>
        <nav className="admin-dashboard-nav">
          <Link to="/dashboard" className="admin-dashboard-nav-link">
            User Dashboard
          </Link>
          <Link to="/admin/users" className="admin-dashboard-nav-link">
            Manage Users
          </Link>
          <button type="button" onClick={handleLogout} className="admin-dashboard-logout-btn">
            Logout
          </button>
        </nav>
      </header>

      {/* Error Message */}
      {error && (
        <div className="admin-dashboard-error">
          <span>⚠️</span> 
          <div style={{ flex: 1 }}>
            {error}
            {error.includes('Forbidden') && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
                <strong>Quick Fix:</strong> Your account may need admin role. 
                <button 
                  onClick={async () => {
                    try {
                      await fetch('http://localhost:3000/api/admin/create-admin', { method: 'POST' });
                      setTimeout(() => window.location.reload(), 500);
                    } catch (e) {
                      alert('Please update your role in database: UPDATE users SET role = "admin" WHERE email = "admin@admin.com";');
                    }
                  }}
                  style={{ 
                    marginLeft: '0.5rem', 
                    padding: '0.25rem 0.75rem', 
                    background: '#10b981', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Fix Now
                </button>
              </div>
            )}
          </div>
          <button onClick={loadData} className="admin-dashboard-error-retry">
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="admin-dashboard-main">
        {/* Stats Grid */}
        <section className="admin-dashboard-section">
          <h2 className="admin-dashboard-section-title">Statistics</h2>
          <div className="admin-dashboard-stats-grid">
            <StatWidget
              title="Total Users"
              value={stats?.users?.totalUsers || 0}
              icon="👥"
              color="primary"
              loading={loading}
              onClick={() => navigate('/admin/users')}
            />
            <StatWidget
              title="Active Users"
              value={stats?.users?.activeUsers || 0}
              icon="✅"
              color="success"
              loading={loading}
              onClick={() => navigate('/admin/users')}
            />
            <StatWidget
              title="New Users (7d)"
              value={stats?.users?.newUsersLast7Days || 0}
              icon="🆕"
              color="primary"
              loading={loading}
            />
            <StatWidget
              title="Total Transactions"
              value={stats?.transactions?.totalTransactions || 0}
              icon="📊"
              color="primary"
              loading={loading}
              onClick={() => navigate('/admin/transactions')}
            />
            <StatWidget
              title="Transactions (24h)"
              value={stats?.transactions?.txLast24Hours || 0}
              icon="⚡"
              color="warning"
              loading={loading}
            />
            <StatWidget
              title="Total Exchanges"
              value={stats?.transactions?.totalExchanges || 0}
              icon="💱"
              color="success"
              loading={loading}
            />
            <StatWidget
              title="Total Transfers"
              value={stats?.transactions?.totalTransfers || 0}
              icon="📤"
              color="primary"
              loading={loading}
            />
            <StatWidget
              title="Total Wallets"
              value={stats?.wallets?.totalWallets || 0}
              icon="💼"
              color="primary"
              loading={loading}
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="admin-dashboard-section">
          <h2 className="admin-dashboard-section-title">Quick Actions</h2>
          <div className="admin-dashboard-actions-grid">
            <Link to="/admin/users" className="admin-dashboard-action-card">
              <div className="admin-dashboard-action-icon">👥</div>
              <div className="admin-dashboard-action-title">Manage Users</div>
              <div className="admin-dashboard-action-desc">View and manage all users</div>
            </Link>
            <Link to="/admin/transactions" className="admin-dashboard-action-card">
              <div className="admin-dashboard-action-icon">📊</div>
              <div className="admin-dashboard-action-title">View Transactions</div>
              <div className="admin-dashboard-action-desc">Monitor all transactions</div>
            </Link>
            <Link to="/admin/wallets" className="admin-dashboard-action-card">
              <div className="admin-dashboard-action-icon">💼</div>
              <div className="admin-dashboard-action-title">Manage Wallets</div>
              <div className="admin-dashboard-action-desc">View and manage wallets</div>
            </Link>
          </div>
        </section>

        {/* Recent Data */}
        <section className="admin-dashboard-section">
          <h2 className="admin-dashboard-section-title">Recent Activity</h2>
          <div className="admin-dashboard-tables-grid">
            {/* Recent Users */}
            <TableWidget title="Recent Users">
              {recentUsers.length === 0 ? (
                <p className="admin-dashboard-empty">No users yet</p>
              ) : (
                <>
                  <table className="admin-dashboard-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <tr
                          key={user.id}
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="admin-dashboard-table-row-clickable"
                        >
                          <td>{user.id}</td>
                          <td>{user.email}</td>
                          <td>
                            <span
                              className={`admin-dashboard-badge ${
                                user.isActive ? 'admin-dashboard-badge-success' : 'admin-dashboard-badge-danger'
                              }`}
                            >
                              {user.isActive ? 'Active' : 'Frozen'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="admin-dashboard-table-footer">
                    <Link to="/admin/users" className="admin-dashboard-table-link">
                      View All Users →
                    </Link>
                  </div>
                </>
              )}
            </TableWidget>

            {/* Recent Transactions */}
            <TableWidget title="Recent Transactions">
              {recentTransactions.length === 0 ? (
                <p className="admin-dashboard-empty">No transactions yet</p>
              ) : (
                <>
                  <table className="admin-dashboard-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          onClick={() => navigate(`/admin/transactions/${tx.id}`)}
                          className="admin-dashboard-table-row-clickable"
                        >
                          <td>
                            <span
                              className={`admin-dashboard-badge ${
                                tx.type === 'exchange' ? 'admin-dashboard-badge-success' : 'admin-dashboard-badge-primary'
                              }`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td>
                            {tx.source_amount} {tx.source_currency} → {tx.target_amount}{' '}
                            {tx.target_currency}
                          </td>
                          <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="admin-dashboard-table-footer">
                    <Link to="/admin/transactions" className="admin-dashboard-table-link">
                      View All Transactions →
                    </Link>
                  </div>
                </>
              )}
            </TableWidget>
          </div>
        </section>

        {/* System Info */}
        <section className="admin-dashboard-section">
          <h2 className="admin-dashboard-section-title">System Information</h2>
          <div className="admin-dashboard-system-info">
            <div className="admin-dashboard-system-item">
              <div className="admin-dashboard-system-label">Total Balance</div>
              <div className="admin-dashboard-system-value">
                {stats?.wallets?.totalBalance
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(stats.wallets.totalBalance)
                  : '—'}
              </div>
            </div>
            <div className="admin-dashboard-system-item">
              <div className="admin-dashboard-system-label">Admin Users</div>
              <div className="admin-dashboard-system-value">{stats?.users?.adminUsers || 0}</div>
            </div>
            <div className="admin-dashboard-system-item">
              <div className="admin-dashboard-system-label">Last Updated</div>
              <div className="admin-dashboard-system-value">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
