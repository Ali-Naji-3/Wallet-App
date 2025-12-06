import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Professional ResourceShow Component (Filament-like)
 * Displays a single resource with:
 * - Organized sections/groups
 * - Action buttons
 * - Related resources
 * - Custom renderers
 */
function ResourceShow({
  title,
  resource,
  fetchData,
  sections = [],
  actions = [],
  headerActions = [],
  onDelete,
  className = '',
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await fetchData(id);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      await action.handler(data);
      if (action.reload !== false) {
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this ${resource}?`)) {
      return;
    }
    try {
      await onDelete(id);
      navigate(`/admin/${resource}`);
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="resource-show-loading">
        <div className="resource-show-spinner">Loading...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="resource-show-error">
        <span>⚠️</span> {error}
        <button onClick={loadData} className="resource-error-retry">
          Retry
        </button>
        <button onClick={() => navigate(`/admin/${resource}`)} className="resource-error-back">
          Back to List
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="resource-show-empty">
        <p>Resource not found</p>
        <button onClick={() => navigate(`/admin/${resource}`)}>
          Back to List
        </button>
      </div>
    );
  }

  const renderValue = (field, value) => {
    if (field.render) {
      return field.render(value, data);
    }

    if (value === null || value === undefined) {
      return <span className="resource-show-null">—</span>;
    }

    if (field.type === 'date' || field.type === 'datetime') {
      return new Date(value).toLocaleString();
    }

    if (field.type === 'boolean') {
      return value ? '✓ Yes' : '✗ No';
    }

    if (field.type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: field.currency || 'USD',
      }).format(value);
    }

    if (field.type === 'badge') {
      return (
        <span className={`resource-show-badge ${field.variant || 'default'}`}>
          {value}
        </span>
      );
    }

    return String(value);
  };

  return (
    <div className={`resource-show ${className}`}>
      {/* Header */}
      <div className="resource-show-header">
        <div className="resource-show-header-left">
          <button
            onClick={() => navigate(`/admin/${resource}`)}
            className="resource-show-back"
          >
            ← Back
          </button>
          <div>
            <h1 className="resource-show-title">
              {title || `${resource} #${id}`}
            </h1>
            {data.name && <p className="resource-show-subtitle">{data.name}</p>}
          </div>
        </div>
        <div className="resource-show-header-actions">
          {headerActions.map((action) => (
            <button
              key={action.key}
              onClick={() => handleAction(action)}
              className={`resource-show-header-btn ${action.variant || 'default'}`}
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </button>
          ))}
          <button
            onClick={() => navigate(`/admin/${resource}/${id}/edit`)}
            className="resource-show-header-btn primary"
          >
            ✏️ Edit
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="resource-show-header-btn danger"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="resource-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Sections */}
      <div className="resource-show-content">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="resource-show-section">
            {section.title && (
              <h2 className="resource-show-section-title">{section.title}</h2>
            )}
            {section.description && (
              <p className="resource-show-section-description">
                {section.description}
              </p>
            )}
            <div className="resource-show-grid">
              {section.fields.map((field) => {
                const value = field.accessor
                  ? field.accessor(data)
                  : data[field.key];
                return (
                  <div key={field.key} className="resource-show-field">
                    <div className="resource-show-field-label">{field.label}</div>
                    <div className="resource-show-field-value">
                      {renderValue(field, value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="resource-show-actions">
            <h3 className="resource-show-actions-title">Actions</h3>
            <div className="resource-show-actions-grid">
              {actions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => handleAction(action)}
                  className={`resource-show-action-btn ${action.variant || 'default'}`}
                  disabled={action.disabled?.(data)}
                >
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResourceShow;




