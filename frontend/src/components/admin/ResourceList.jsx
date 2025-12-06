import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from './DataTable';

/**
 * Professional ResourceList Component (Filament-like)
 * Automatically generates list pages for resources with:
 * - Data table with sorting, filtering, pagination
 * - Bulk actions
 * - Header actions (create, export, etc.)
 * - Resource-specific columns and actions
 */
function ResourceList({
  title,
  resource,
  fetchData,
  columns,
  actions = [],
  headerActions = [],
  bulkActions = [],
  onRowClick,
  emptyMessage = 'No records found',
  createButton = true,
  exportButton = false,
  searchPlaceholder = 'Search...',
  className = '',
}) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    loadData();
  }, [resource]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await fetchData();
      setData(Array.isArray(result) ? result : result.data || result.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate(`/admin/${resource}/create`);
  };

  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row);
    } else {
      navigate(`/admin/${resource}/${row.id}`);
    }
  };

  const handleBulkAction = async (action, selectedData) => {
    try {
      await action.handler(selectedData);
      await loadData();
      setSelectedRows([]);
    } catch (err) {
      setError(err.message || 'Bulk action failed');
    }
  };

  const handleAction = async (action, row) => {
    try {
      await action.handler(row);
      await loadData();
    } catch (err) {
      setError(err.message || 'Action failed');
    }
  };

  // Add action columns to table columns
  const tableColumns = [
    ...columns,
    ...(actions.length > 0
      ? [
          {
            key: 'actions',
            label: 'Actions',
            sortable: false,
            render: (value, row) => (
              <div className="resource-actions">
                {actions.map((action) => (
                  <button
                    key={action.key}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(action, row);
                    }}
                    className={`resource-action-btn ${action.variant || 'default'}`}
                    title={action.label}
                    disabled={action.disabled?.(row)}
                  >
                    {action.icon && <span>{action.icon}</span>}
                    {action.showLabel && <span>{action.label}</span>}
                  </button>
                ))}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className={`resource-list ${className}`}>
      {/* Header */}
      <div className="resource-header">
        <div className="resource-header-left">
          <h1 className="resource-title">{title || resource}</h1>
          {data.length > 0 && (
            <span className="resource-count">{data.length} {resource}</span>
          )}
        </div>
        <div className="resource-header-actions">
          {exportButton && (
            <button
              onClick={() => {
                // Export functionality
                const csv = [
                  columns.map((c) => c.label).join(','),
                  ...data.map((row) =>
                    columns.map((c) => {
                      const value = c.accessor ? c.accessor(row) : row[c.key];
                      return `"${String(value || '').replace(/"/g, '""')}"`;
                    }).join(',')
                  ),
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${resource}-export.csv`;
                a.click();
              }}
              className="resource-header-btn secondary"
            >
              📥 Export
            </button>
          )}
          {headerActions.map((action) => (
            <button
              key={action.key}
              onClick={() => action.handler()}
              className={`resource-header-btn ${action.variant || 'default'}`}
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </button>
          ))}
          {createButton && (
            <button onClick={handleCreate} className="resource-header-btn primary">
              ➕ Create {resource}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="resource-error">
          <span>⚠️</span> {error}
          <button onClick={loadData} className="resource-error-retry">
            Retry
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="resource-table-container">
        <DataTable
          data={data}
          columns={tableColumns}
          onRowClick={handleRowClick}
          onBulkAction={handleBulkAction}
          bulkActions={bulkActions}
          loading={loading}
          emptyMessage={emptyMessage}
          searchable={true}
          pagination={true}
          pageSize={20}
        />
      </div>
    </div>
  );
}

export default ResourceList;


