import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import {
  loginUser,
  registerUser,
  fetchProfile,
  fetchWallets,
  fetchCurrencies,
  fetchLatestFxRates,
  createExchange,
  createTransfer,
  fetchMyTransactions,
  fetchPortfolioSummary,
  fetchAdminStats,
  fetchAdminUsers,
  freezeUser,
  unfreezeUser,
  fetchAdminTransactions,
  fetchMyNotifications,
  markNotificationRead,
  updateProfile,
} from './api';

const isAuthenticated = () => !!localStorage.getItem('fxwallet_token');

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem('fxwallet_token', data.token);
      // Redirect admin to admin dashboard
      if (email.toLowerCase() === 'admin@admin.com') {
        navigate('/admin-dashboard');
      } else {
        navigate('/wallet');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h1>FXWallet Login</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p>
          Don&apos;t have an account?{' '}
          <button type="button" className="link-button" onClick={() => navigate('/register')}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await registerUser({ email, password, fullName });
      localStorage.setItem('fxwallet_token', data.token);
      navigate('/wallet');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h1>Create FXWallet Account</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p>
          Already have an account?{' '}
          <button type="button" className="link-button" onClick={() => navigate('/login')}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

function ExchangePage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [exchangeForm, setExchangeForm] = useState({
    sourceWalletId: '',
    targetWalletId: '',
    amount: '',
    note: '',
  });
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallets()
      .then(setWallets)
      .catch((err) => setActionError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleExchangeSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      await createExchange({
        sourceWalletId: Number(exchangeForm.sourceWalletId),
        targetWalletId: Number(exchangeForm.targetWalletId),
        amount: Number(exchangeForm.amount),
        note: exchangeForm.note,
      });
      setActionSuccess('Exchange completed successfully!');
      setExchangeForm({ sourceWalletId: '', targetWalletId: '', amount: '', note: '' });
      const updatedWallets = await fetchWallets();
      setWallets(updatedWallets);
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <button
        className="mobile-menu-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ 
        position: 'fixed',
        left: sidebarOpen ? '280px' : '70px',
        right: 0,
        top: 0,
        bottom: 0,
        overflowY: 'auto',
        padding: '1rem',
      }}>
      <header className="top-bar">
        <h1>Exchange Currency</h1>
        <nav className="top-nav">
          <Link to="/wallet">Back to Wallet</Link>
        </nav>
      </header>
      <section className="card actions-card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <h2>Quick exchange</h2>
        <form className="inline-form vertical" onSubmit={handleExchangeSubmit}>
          <label>
            From wallet
            <select
              value={exchangeForm.sourceWalletId}
              onChange={(e) =>
                setExchangeForm((f) => ({ ...f, sourceWalletId: e.target.value }))
              }
              required
            >
              <option value="">Select</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.currency_code} ({Number(w.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </label>
          <label>
            To wallet
            <select
              value={exchangeForm.targetWalletId}
              onChange={(e) =>
                setExchangeForm((f) => ({ ...f, targetWalletId: e.target.value }))
              }
              required
            >
              <option value="">Select</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.currency_code} ({Number(w.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input
              type="number"
              min="0"
              step="0.01"
              value={exchangeForm.amount}
              onChange={(e) =>
                setExchangeForm((f) => ({ ...f, amount: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Note (optional)
            <input
              type="text"
              value={exchangeForm.note}
              onChange={(e) =>
                setExchangeForm((f) => ({ ...f, note: e.target.value }))
              }
            />
          </label>
          <button type="submit">Exchange</button>
        </form>
        {actionError && <div className="error-text">{actionError}</div>}
        {actionSuccess && <div className="success-text">{actionSuccess}</div>}
      </section>
      </div>
    </div>
  );
}

function TransferPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [transferMode, setTransferMode] = useState('between'); // 'between' or 'quick'
  const [transferForm, setTransferForm] = useState({
    sourceWalletId: '',
    targetWalletId: '',
    amount: '',
    note: '',
  });
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallets()
      .then(setWallets)
      .catch((err) => setActionError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      await createTransfer({
        sourceWalletId: Number(transferForm.sourceWalletId),
        targetWalletId: Number(transferForm.targetWalletId),
        amount: Number(transferForm.amount),
        note: transferForm.note,
      });
      setActionSuccess('Transfer completed successfully!');
      setTransferForm({ sourceWalletId: '', targetWalletId: '', amount: '', note: '' });
      const updatedWallets = await fetchWallets();
      setWallets(updatedWallets);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleModeChange = (mode) => {
    setTransferMode(mode);
    setTransferForm({ sourceWalletId: '', targetWalletId: '', amount: '', note: '' });
    setActionError('');
    setActionSuccess('');
  };

  // Filter wallets for "between" mode - exclude source wallet from target options
  const availableTargetWallets = wallets.filter(
    (w) => w.id.toString() !== transferForm.sourceWalletId
  );

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', minHeight: '100vh' }}>
        <button
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div style={{ 
          position: 'fixed',
          left: sidebarOpen ? '280px' : '70px',
          right: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          padding: '1rem',
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <button
        className="mobile-menu-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ 
        position: 'fixed',
        left: sidebarOpen ? '280px' : '70px',
        right: 0,
        top: 0,
        bottom: 0,
        overflowY: 'auto',
        padding: '1rem',
      }}>
      <header className="top-bar">
        <h1>Send / Transfer</h1>
        <nav className="top-nav">
          <Link to="/wallet">Back to Wallet</Link>
        </nav>
      </header>
      <section className="card actions-card" style={{ maxWidth: '700px', margin: '2rem auto' }}>
        <h2>Transfer Options</h2>
        
        {/* Transfer Mode Selection */}
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => handleModeChange('between')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '2px solid',
              borderColor: transferMode === 'between' ? '#2563eb' : '#e2e8f0',
              borderRadius: '8px',
              background: transferMode === 'between' ? '#eff6ff' : 'white',
              color: transferMode === 'between' ? '#2563eb' : '#64748b',
              fontWeight: transferMode === 'between' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Between My Wallets
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('quick')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '2px solid',
              borderColor: transferMode === 'quick' ? '#2563eb' : '#e2e8f0',
              borderRadius: '8px',
              background: transferMode === 'quick' ? '#eff6ff' : 'white',
              color: transferMode === 'quick' ? '#2563eb' : '#64748b',
              fontWeight: transferMode === 'quick' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Quick Transfer (Same Currency)
          </button>
        </div>

        <form className="inline-form vertical" onSubmit={handleTransferSubmit}>
          <label>
            From wallet
            <select
              value={transferForm.sourceWalletId}
              onChange={(e) =>
                setTransferForm((f) => ({ ...f, sourceWalletId: e.target.value }))
              }
              required
            >
              <option value="">Select wallet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.currency_code} - Balance: {Number(w.balance).toFixed(2)} {w.currency_code}
                </option>
              ))}
            </select>
          </label>

          {transferMode === 'between' ? (
            <label>
              To wallet (my wallets)
              <select
                value={transferForm.targetWalletId}
                onChange={(e) =>
                  setTransferForm((f) => ({ ...f, targetWalletId: e.target.value }))
                }
                required
                disabled={!transferForm.sourceWalletId}
              >
                <option value="">
                  {transferForm.sourceWalletId ? 'Select target wallet' : 'Select source wallet first'}
                </option>
                {availableTargetWallets
                  .filter((w) => {
                    // Only show wallets with same currency as source
                    const sourceWallet = wallets.find((sw) => sw.id.toString() === transferForm.sourceWalletId);
                    return sourceWallet && w.currency_code === sourceWallet.currency_code;
                  })
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.currency_code} - Balance: {Number(w.balance).toFixed(2)} {w.currency_code}
                    </option>
                  ))}
              </select>
              {transferForm.sourceWalletId && availableTargetWallets.filter((w) => {
                const sourceWallet = wallets.find((sw) => sw.id.toString() === transferForm.sourceWalletId);
                return sourceWallet && w.currency_code === sourceWallet.currency_code;
              }).length === 0 && (
                <div style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.25rem' }}>
                  No wallets with same currency available
                </div>
              )}
            </label>
          ) : (
            <label>
              To wallet ID (can be another user&apos;s wallet)
              <input
                type="number"
                value={transferForm.targetWalletId}
                onChange={(e) =>
                  setTransferForm((f) => ({ ...f, targetWalletId: e.target.value }))
                }
                placeholder="Enter wallet ID"
                required
              />
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Enter the wallet ID of the recipient (must be same currency)
              </div>
            </label>
          )}

          <label>
            Amount
            <input
              type="number"
              min="0"
              step="0.01"
              value={transferForm.amount}
              onChange={(e) =>
                setTransferForm((f) => ({ ...f, amount: e.target.value }))
              }
              placeholder="0.00"
              required
            />
            {transferForm.sourceWalletId && (
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Available: {wallets.find((w) => w.id.toString() === transferForm.sourceWalletId)?.balance || '0.00'}
              </div>
            )}
          </label>

          <label>
            Note (optional)
            <input
              type="text"
              value={transferForm.note}
              onChange={(e) =>
                setTransferForm((f) => ({ ...f, note: e.target.value }))
              }
              placeholder="Add a note for this transfer"
            />
          </label>

          <button type="submit" style={{ marginTop: '1rem' }}>
            {transferMode === 'between' ? 'Transfer Between Wallets' : 'Send Transfer'}
          </button>
        </form>
        {actionError && <div className="error-text">{actionError}</div>}
        {actionSuccess && <div className="success-text">{actionSuccess}</div>}
      </section>
      </div>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [fxRates, setFxRates] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [updatingWalletId, setUpdatingWalletId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

    const load = async () => {
      try {
        const [profileData, walletsData, txData, portfolioData, notifData] = await Promise.all([
          fetchProfile(),
          fetchWallets(),
          fetchMyTransactions(),
          fetchPortfolioSummary().catch(() => null),
          fetchMyNotifications().catch(() => ({ notifications: [] })),
        ]);
        setProfile(profileData);
        setWallets(walletsData);
        setTransactions(txData);
        setPortfolio(portfolioData);
        setNotifications(notifData.notifications || []);

        const fxData = await fetchLatestFxRates(profileData.baseCurrency || 'USD');
        setFxRates(fxData.rates || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      setUpdatingWalletId(null);
      }
    };

  useEffect(() => {
    setLoading(true);
    load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('fxwallet_token');
    navigate('/login');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)),
      );
    } catch (err) {
      // ignore minor error in UI
    }
  };

  const handleWalletClick = async (w) => {
    if (profile && w.currency_code === profile.baseCurrency) return;
    // Directly update without confirmation (professional flow)
    if (updatingWalletId) return; // Prevent double clicks

    try {
      setUpdatingWalletId(w.id);
      await updateProfile({ ...profile, baseCurrency: w.currency_code });
      
      // Reload data to reflect changes
      await load();
      
      // Show success message briefly
      setActionSuccess(`Base currency updated to ${w.currency_code}`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setUpdatingWalletId(null);
    }
  };

  if (loading && !profile) {
    return (
      <div className="page-container" style={{ display: 'flex', minHeight: '100vh' }}>
        <button
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div style={{ 
          position: 'fixed',
          left: sidebarOpen ? '280px' : '70px',
          right: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          padding: '1rem',
        }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container" style={{ display: 'flex', minHeight: '100vh' }}>
        <button
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div style={{ 
          position: 'fixed',
          left: sidebarOpen ? '280px' : '70px',
          right: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          padding: '1rem',
        }}>
          Error: {error}
        </div>
      </div>
    );
  }

  const totalValue =
    portfolio && typeof portfolio.totalPortfolioValue === 'number'
      ? portfolio.totalPortfolioValue.toFixed(2)
      : '0.00';

  return (
    <div className="page-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <button
        className="mobile-menu-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ 
        position: 'fixed',
        left: sidebarOpen ? '280px' : '70px',
        right: 0,
        top: 0,
        bottom: 0,
        overflowY: 'auto',
        padding: '1rem',
      }}>
      <header className="top-bar">
        <h1>FXWallet Wallet</h1>
        <nav className="top-nav">
          <Link to="/wallet">Wallet</Link>
          <div className="notif-wrapper">
            <button
              type="button"
              className="notif-bell"
              onClick={() => setShowNotifications((s) => !s)}
            >
              <span className="bell-icon">🔔</span>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="notif-dropdown">
                <div className="notif-header">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                      onClick={() => handleNotificationClick(n.id)}
                    >
                      <div className="notif-title">{n.title}</div>
                      {n.body && <div className="notif-body">{n.body}</div>}
                      <div className="notif-meta">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      {/* Hero balance card */}
      <section className="hero-card">
        <div className="hero-main">
          <div className="hero-label">Total balance</div>
          <div className="hero-balance">
            {totalValue} <span className="hero-currency">{portfolio?.baseCurrency || profile.baseCurrency}</span>
          </div>
          <div className="hero-sub">
            {portfolio?.stats?.last30Days?.totalTransactions || 0} transactions in the last 30 days
          </div>
        </div>
        <div className="hero-user">
          <div className="hero-user-name">{profile.fullName || profile.email}</div>
          <div className="hero-user-meta">
            Base: {profile.baseCurrency} · TZ: {profile.timezone}
          </div>
        </div>
      </section>
      
      {actionSuccess && <div className="success-text" style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 'bold' }}>{actionSuccess}</div>}

      {/* Quick actions */}
      <section className="card quick-actions-card">
        <div className="quick-actions">
          <button
            type="button"
            className="quick-action-btn primary"
            onClick={() => navigate('/exchange')}
          >
            Exchange
          </button>
          <button
            type="button"
            className="quick-action-btn"
            onClick={() => navigate('/transfer')}
          >
            Send / Transfer
          </button>
          <button type="button" className="quick-action-btn muted">
            Top up (soon)
          </button>
        </div>
      </section>
      {/* Wallet carousel */}
      <section className="card wallets-card">
        <h2>Your wallets (click to set base currency)</h2>
        {wallets.length === 0 ? (
          <p>No wallets yet. Create an account or contact support.</p>
        ) : (
          <div className="wallets-strip">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="wallet-card"
                onClick={() => handleWalletClick(w)}
                style={{ 
                  cursor: 'pointer', 
                  opacity: updatingWalletId === w.id ? 0.7 : 1,
                  transform: updatingWalletId === w.id ? 'scale(0.98)' : 'none',
                  transition: 'all 0.2s'
                }}
                title={`Set ${w.currency_code} as base currency`}
              >
                <div className="wallet-card-header">
                  <span className="wallet-currency">{w.currency_code}</span>
                  <span className={`wallet-status ${w.status}`}>{w.status}</span>
                </div>
                <div className="wallet-balance">
                  {updatingWalletId === w.id ? (
                    <span style={{ fontSize: '1rem' }}>Updating...</span>
                  ) : (
                    <>
                  {Number(w.balance).toFixed(2)} {w.currency_code}
                    </>
                  )}
                </div>
                <div className="wallet-address">{w.address}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FX + actions grid */}
      <section className="main-grid">
        <section className="card fx-card">
          <h2>FX rates (base {profile.baseCurrency})</h2>
          {fxRates.length === 0 ? (
            <p>FX rates not available.</p>
          ) : (
            <div className="fx-rates-grid">
              {fxRates.slice(0, 8).map((r) => (
                <div key={r.quote_currency} className="fx-rate-item">
                  <div className="fx-rate-code">
                    {profile.baseCurrency} / {r.quote_currency}
                  </div>
                  <div className="fx-rate-value">{Number(r.rate).toFixed(4)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="card history-card">
        <h2>Recent transactions</h2>
        {transactions.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          <table className="simple-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Rate</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.type}</td>
                  <td>
                    {t.source_amount} {t.source_currency}
                  </td>
                  <td>
                    {t.target_amount} {t.target_currency}
                  </td>
                  <td>{t.fee_amount > 0 ? `Fee: ${t.fee_amount}` : '-'}</td>
                  <td>{t.fx_rate ? Number(t.fx_rate).toFixed(4) : '-'}</td>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      </div>
    </div>
  );
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'settings', 'users'
  
  // Content management state
  const [contentItems, setContentItems] = useState([
    { id: 1, title: 'Welcome Message', content: 'Welcome to FXWallet', type: 'text', status: 'active' },
    { id: 2, title: 'Terms of Service', content: 'Terms and conditions...', type: 'text', status: 'active' },
    { id: 3, title: 'Privacy Policy', content: 'Privacy policy content...', type: 'text', status: 'active' },
  ]);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', type: 'text' });

  const handleLogout = () => {
    localStorage.removeItem('fxwallet_token');
    navigate('/login');
  };

  const handleEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({ title: item.title, content: item.content, type: item.type });
  };

  const handleSave = () => {
    if (editingItem) {
      setContentItems(contentItems.map(item => 
        item.id === editingItem 
          ? { ...item, ...editForm }
          : item
      ));
      setSuccessMsg('Content updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      // Add new item
      const newItem = {
        id: contentItems.length + 1,
        ...editForm,
        status: 'active'
      };
      setContentItems([...contentItems, newItem]);
      setSuccessMsg('Content added successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setEditingItem(null);
    setEditForm({ title: '', content: '', type: 'text' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      setContentItems(contentItems.filter(item => item.id !== id));
      setSuccessMsg('Content deleted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditForm({ title: '', content: '', type: 'text' });
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{
        background: 'white',
        padding: '1.5rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#2563eb', fontSize: '1.75rem' }}>
          Admin Dashboard - Content Management
        </h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1.5rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Logout
        </button>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #e2e8f0'
        }}>
          <button
            onClick={() => setActiveTab('content')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'content' ? '#2563eb' : 'transparent',
              color: activeTab === 'content' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'content' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            Content Management
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'settings' ? '#2563eb' : 'transparent',
              color: activeTab === 'settings' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'settings' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            Settings
          </button>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '1rem',
            background: '#d1fae5',
            color: '#059669',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            {successMsg}
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Content Items</h2>
              {!editingItem && (
                <button
                  onClick={() => setEditingItem('new')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  + Add New Content
                </button>
              )}
            </div>

            {editingItem && (
              <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
                  {editingItem === 'new' ? 'Add New Content' : 'Edit Content'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter title"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Type
                    </label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="text">Text</option>
                      <option value="html">HTML</option>
                      <option value="markdown">Markdown</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Content
                    </label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={8}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                      placeholder="Enter content"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleCancel}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#e2e8f0',
                        color: '#64748b',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {contentItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{item.title}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>
                      Type: {item.type} | Status: {item.status}
                    </p>
                    <p style={{ margin: 0, color: '#475569' }}>{item.content}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(item)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, color: '#1e293b' }}>Admin Settings</h2>
            <p style={{ color: '#64748b' }}>Settings panel coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, txData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(1, 20, search),
        fetchAdminTransactions(1, 20),
      ]);
      setStats(statsData);
      setUsers(usersData.users || []);
      setTransactions(txData.transactions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async (userId) => {
    try {
      await freezeUser(userId);
      setActionMsg('User frozen');
      loadData();
    } catch (err) {
      setActionMsg('Error: ' + err.message);
    }
  };

  const handleUnfreeze = async (userId) => {
    try {
      await unfreezeUser(userId);
      setActionMsg('User unfrozen');
      loadData();
    } catch (err) {
      setActionMsg('Error: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fxwallet_token');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', minHeight: '100vh' }}>
        <button
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div style={{ 
          position: 'fixed',
          left: sidebarOpen ? '280px' : '70px',
          right: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          padding: '1rem',
        }}>
          Loading admin panel...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container" style={{ display: 'flex', minHeight: '100vh' }}>
        <button
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div style={{ 
          position: 'fixed',
          left: sidebarOpen ? '280px' : '70px',
          right: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          padding: '1rem',
        }}>
          <div className="error-text">Admin access denied or error: {error}</div>
          <Link to="/wallet">Back to Wallet</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <button
        className="mobile-menu-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ 
        position: 'fixed',
        left: sidebarOpen ? '280px' : '70px',
        right: 0,
        top: 0,
        bottom: 0,
        overflowY: 'auto',
        padding: '1rem',
      }}>
      <header className="top-bar">
        <h1>FXWallet Admin Panel</h1>
        <nav className="top-nav">
          <Link to="/wallet">Wallet</Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      {/* Admin Stats */}
      {stats && (
        <section className="card stats-card">
          <h2>System Overview</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{stats.users?.totalUsers || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Users</span>
              <span className="stat-value">{stats.users?.activeUsers || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">New (7d)</span>
              <span className="stat-value">{stats.users?.newUsersLast7Days || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Transactions (24h)</span>
              <span className="stat-value">{stats.transactions?.txLast24Hours || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Exchanges</span>
              <span className="stat-value">{stats.transactions?.totalExchanges || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Transfers</span>
              <span className="stat-value">{stats.transactions?.totalTransfers || 0}</span>
            </div>
          </div>
        </section>
      )}

      {actionMsg && <div className="info-text">{actionMsg}</div>}

      {/* User Management */}
      <section className="card">
        <h2>User Management</h2>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        <table className="simple-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Active</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.full_name || '-'}</td>
                <td>{u.role}</td>
                <td>{u.is_active ? 'Yes' : 'No'}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  {u.is_active ? (
                    <button type="button" onClick={() => handleFreeze(u.id)} className="btn-danger">
                      Freeze
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleUnfreeze(u.id)} className="btn-success">
                      Unfreeze
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Transaction Monitoring */}
      <section className="card">
        <h2>Recent Transactions (All Users)</h2>
        <table className="simple-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Rate</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.user_email}</td>
                <td>{t.type}</td>
                <td>{t.source_amount} {t.source_currency}</td>
                <td>{t.target_amount} {t.target_currency}</td>
                <td>{t.fx_rate ? Number(t.fx_rate).toFixed(4) : '-'}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exchange"
        element={
          <ProtectedRoute>
            <ExchangePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transfer"
        element={
          <ProtectedRoute>
            <TransferPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={isAuthenticated() ? '/wallet' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
