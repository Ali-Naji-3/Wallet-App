import { useState, useEffect } from 'react';

/**
 * Professional Dashboard Widget Component (Filament-like)
 * Reusable widget system for dashboard statistics and charts
 */
function DashboardWidget({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'primary',
  loading = false,
  onClick,
  className = '',
  children,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted && loading) {
    return (
      <div className={`dashboard-widget dashboard-widget-loading ${className}`}>
        <div className="dashboard-widget-skeleton" />
      </div>
    );
  }

  return (
    <div
      className={`dashboard-widget dashboard-widget-${color} ${onClick ? 'dashboard-widget-clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {children ? (
        <div className="dashboard-widget-custom">
          {title && <h3 className="dashboard-widget-title">{title}</h3>}
          {children}
        </div>
      ) : (
        <>
          <div className="dashboard-widget-header">
            {icon && <div className="dashboard-widget-icon">{icon}</div>}
            <div className="dashboard-widget-content">
              {title && <h3 className="dashboard-widget-title">{title}</h3>}
              {loading ? (
                <div className="dashboard-widget-loading-value">Loading...</div>
              ) : (
                <div className="dashboard-widget-value">{value}</div>
              )}
              {trend !== undefined && (
                <div
                  className={`dashboard-widget-trend ${
                    trend >= 0 ? 'dashboard-widget-trend-up' : 'dashboard-widget-trend-down'
                  }`}
                >
                  {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Stat Widget - Simple statistic display
 */
export function StatWidget({ title, value, icon, trend, trendLabel, color, loading, onClick, className }) {
  return (
    <DashboardWidget
      title={title}
      value={value}
      icon={icon}
      trend={trend}
      trendLabel={trendLabel}
      color={color}
      loading={loading}
      onClick={onClick}
      className={className}
    />
  );
}

/**
 * Chart Widget - For displaying charts
 */
export function ChartWidget({ title, children, className }) {
  return (
    <DashboardWidget className={`dashboard-widget-chart ${className}`}>
      {title && <h3 className="dashboard-widget-title">{title}</h3>}
      <div className="dashboard-widget-chart-content">{children}</div>
    </DashboardWidget>
  );
}

/**
 * Table Widget - For displaying data tables
 */
export function TableWidget({ title, children, className }) {
  return (
    <DashboardWidget className={`dashboard-widget-table ${className}`}>
      {title && <h3 className="dashboard-widget-title">{title}</h3>}
      <div className="dashboard-widget-table-content">{children}</div>
    </DashboardWidget>
  );
}

export default DashboardWidget;


