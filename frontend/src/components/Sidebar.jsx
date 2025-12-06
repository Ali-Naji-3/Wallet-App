import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchProfile } from '../api';

function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    transactions: false,
    admin: false,
  });
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchProfile();
        setUserProfile(profile);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    loadProfile();
  }, []);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      title: 'Wallet',
      icon: '📊',
      path: '/wallet',
      exact: true,
    },
    {
      title: 'Exchange',
      icon: '💱',
      path: '/exchange',
    },
    {
      title: 'Send / Transfer',
      icon: '📤',
      path: '/transfer',
    },
    {
      title: 'Transactions',
      icon: '📝',
      path: '/transactions',
      hasSubmenu: true,
      submenu: [
        { title: 'All Transactions', path: '/transactions' },
        { title: 'Exchanges', path: '/transactions?type=exchange' },
        { title: 'Transfers', path: '/transactions?type=transfer' },
      ],
    },
    {
      title: 'FX Rates',
      icon: '📈',
      path: '/fx-rates',
    },
    {
      title: 'Settings',
      icon: '⚙️',
      path: '/settings',
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: isOpen ? '280px' : '70px',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          transition: 'width 0.3s ease, transform 0.3s ease',
          zIndex: 999,
          overflowY: 'auto',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: '1.5rem 1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'flex-start' : 'center',
          }}
        >
          {isOpen && (
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
              FXWallet
            </h2>
          )}
        </div>

        {/* User Profile Section */}
        {userProfile && (
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: isOpen ? '40px' : '32px',
                height: isOpen ? '40px' : '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isOpen ? '1.2rem' : '1rem',
                flexShrink: 0,
              }}
            >
              👤
            </div>
            {isOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'white',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {userProfile.fullName || userProfile.email?.split('@')[0] || 'User'}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '0.25rem',
                  }}
                >
                  {userProfile.email || ''}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Menu */}
        <nav style={{ padding: '1rem 0' }}>
          {menuItems.map((item) => {
            // Skip admin items if not admin (you can add role check later)
            if (item.adminOnly) {
              // For now, show it - you can add role check
            }

            const active = isActive(item.path);

            if (item.hasSubmenu) {
              return (
                <div key={item.path}>
                  <button
                    onClick={() => toggleSection(item.path.split('/')[1])}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.95rem',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.1)')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                    {isOpen && (
                      <>
                        <span style={{ flex: 1 }}>{item.title}</span>
                        <span>{expandedSections[item.path.split('/')[1]] ? '▼' : '▶'}</span>
                      </>
                    )}
                  </button>
                  {isOpen && expandedSections[item.path.split('/')[1]] && (
                    <div style={{ paddingLeft: '2.5rem' }}>
                      {item.submenu.map((sub) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          style={{
                            display: 'block',
                            padding: '0.5rem 1rem',
                            color: 'rgba(255, 255, 255, 0.8)',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.1)')}
                          onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                        >
                          {sub.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  color: active ? '#60a5fa' : 'white',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  background: active ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                  borderLeft: active ? '3px solid #60a5fa' : '3px solid transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.target.style.background = 'transparent';
                  }
                }}
                title={!isOpen ? item.title : ''}
              >
                <span style={{ fontSize: '1.2rem', minWidth: '24px' }}>{item.icon}</span>
                {isOpen && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '0.5rem 1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
            }}
          >
            FXWallet v1.0
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;

