import { useState, useMemo } from 'react';

/**
 * Professional DataTable Component
 * Features: Sorting, Filtering, Pagination, Bulk Actions, Selection
 */
function DataTable({
  data = [],
  columns = [],
  onRowClick,
  onBulkAction,
  bulkActions = [],
  searchable = true,
  pagination = true,
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const value = col.accessor ? col.accessor(row) : row[col.key];
        return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = columns.find((c) => c.key === sortConfig.key)?.accessor
        ? columns.find((c) => c.key === sortConfig.key).accessor(a)
        : a[sortConfig.key];
      const bValue = columns.find((c) => c.key === sortConfig.key)?.accessor
        ? columns.find((c) => c.key === sortConfig.key).accessor(b)
        : b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(paginatedData.map((_, i) => i)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (index) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleBulkAction = (action) => {
    const selectedData = Array.from(selectedRows).map((i) => paginatedData[i]);
    onBulkAction?.(action, selectedData);
    setSelectedRows(new Set());
  };

  return (
    <div className={`data-table-container ${className}`}>
      {/* Toolbar */}
      <div className="data-table-toolbar">
        {searchable && (
          <div className="data-table-search">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="data-table-search-input"
            />
            <span className="data-table-search-icon">🔍</span>
          </div>
        )}
        <div className="data-table-info">
          Showing {paginatedData.length} of {sortedData.length} entries
          {selectedRows.size > 0 && (
            <span className="data-table-selected">({selectedRows.size} selected)</span>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && bulkActions.length > 0 && (
        <div className="data-table-bulk-actions">
          {bulkActions.map((action) => (
            <button
              key={action.key}
              onClick={() => handleBulkAction(action)}
              className={`data-table-bulk-btn ${action.variant || 'default'}`}
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {bulkActions.length > 0 && (
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                >
                  <div className="data-table-header-cell">
                    <span>{col.label}</span>
                    {col.sortable !== false && sortConfig.key === col.key && (
                      <span className="data-table-sort-icon">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)} className="data-table-loading">
                  <div className="data-table-spinner">Loading...</div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)} className="data-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'data-table-row-clickable' : ''}
                >
                  {bulkActions.length > 0 && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={() => handleSelectRow(rowIndex)}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : col.accessor
                          ? col.accessor(row)
                          : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="data-table-pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="data-table-pagination-btn"
          >
            ← Previous
          </button>
          <div className="data-table-pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="data-table-pagination-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default DataTable;

