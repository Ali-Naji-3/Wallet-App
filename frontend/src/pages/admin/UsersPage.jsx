import { useNavigate } from 'react-router-dom';
import ResourceList from '../../components/admin/ResourceList';
import { fetchAdminUsers, freezeUser, unfreezeUser } from '../../api';
import './admin.css';

/**
 * Example Users Resource Page (Filament-like)
 * Demonstrates how to use ResourceList component
 */
function UsersPage() {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'fullName',
      label: 'Full Name',
      sortable: true,
      accessor: (row) => row.fullName || '—',
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <span className={`resource-show-badge ${value === 'admin' ? 'primary' : 'default'}`}>
          {value || 'user'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`resource-show-badge ${value ? 'success' : 'danger'}`}>
          {value ? 'Active' : 'Frozen'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const actions = [
    {
      key: 'view',
      label: 'View',
      icon: '👁️',
      showLabel: false,
      handler: (row) => navigate(`/admin/users/${row.id}`),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: '✏️',
      showLabel: false,
      handler: (row) => navigate(`/admin/users/${row.id}/edit`),
    },
    {
      key: 'freeze',
      label: 'Freeze',
      icon: '❄️',
      showLabel: false,
      variant: 'danger',
      handler: async (row) => {
        if (window.confirm(`Freeze user ${row.email}?`)) {
          await freezeUser(row.id);
          window.location.reload();
        }
      },
      disabled: (row) => !row.isActive,
    },
    {
      key: 'unfreeze',
      label: 'Unfreeze',
      icon: '🔥',
      showLabel: false,
      variant: 'success',
      handler: async (row) => {
        if (window.confirm(`Unfreeze user ${row.email}?`)) {
          await unfreezeUser(row.id);
          window.location.reload();
        }
      },
      disabled: (row) => row.isActive,
    },
  ];

  const bulkActions = [
    {
      key: 'freeze',
      label: 'Freeze Selected',
      icon: '❄️',
      variant: 'danger',
      handler: async (selected) => {
        if (window.confirm(`Freeze ${selected.length} users?`)) {
          await Promise.all(selected.map((user) => freezeUser(user.id)));
        }
      },
    },
  ];

  return (
    <ResourceList
      title="Users"
      resource="users"
      fetchData={async () => {
        const result = await fetchAdminUsers(1, 100);
        return result.users || [];
      }}
      columns={columns}
      actions={actions}
      bulkActions={bulkActions}
      onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
      createButton={false}
      exportButton={true}
    />
  );
}

export default UsersPage;


