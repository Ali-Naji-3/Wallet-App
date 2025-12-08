# Professional Filament-like Resource Management System

## 🎯 Overview

A complete, professional resource management system similar to Laravel Filament, built with React and Next.js. This system provides automatic CRUD generation, forms, tables, and dashboard widgets.

## 📦 Components

### 1. **ResourceList** - List/Index Pages
Automatically generates list pages with:
- ✅ Data tables with sorting, filtering, pagination
- ✅ Bulk actions
- ✅ Row actions (view, edit, delete, custom)
- ✅ Header actions (create, export, custom)
- ✅ Search functionality
- ✅ Loading states

**Location:** `frontend/src/components/admin/ResourceList.jsx`

**Example Usage:**
```jsx
import ResourceList from '../../components/admin/ResourceList';

<ResourceList
  title="Users"
  resource="users"
  fetchData={async () => {
    const result = await fetchAdminUsers(1, 100);
    return result.users || [];
  }}
  columns={[
    { key: 'id', label: 'ID', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
  ]}
  actions={[
    {
      key: 'edit',
      label: 'Edit',
      icon: '✏️',
      handler: (row) => navigate(`/admin/users/${row.id}/edit`),
    },
  ]}
  bulkActions={[
    {
      key: 'delete',
      label: 'Delete Selected',
      handler: async (selected) => {
        await Promise.all(selected.map(item => deleteItem(item.id)));
      },
    },
  ]}
  createButton={true}
  exportButton={true}
/>
```

---

### 2. **ResourceForm** - Create/Edit Forms
Automatically generates forms with:
- ✅ Dynamic field rendering (text, textarea, select, checkbox, radio, date, etc.)
- ✅ Validation
- ✅ Form sections/groups
- ✅ Custom field renderers
- ✅ Loading states

**Location:** `frontend/src/components/admin/ResourceForm.jsx`

**Example Usage:**
```jsx
import ResourceForm from '../../components/admin/ResourceForm';

<ResourceForm
  title="Create User"
  resource="users"
  mode="create" // or "edit"
  fields={[
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'user@example.com',
    },
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' },
      ],
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'checkbox',
    },
  ]}
  sections={[
    {
      title: 'Basic Information',
      fields: ['email', 'fullName'],
    },
    {
      title: 'Permissions',
      fields: ['role', 'isActive'],
    },
  ]}
  onSubmit={async (data) => {
    await createUser(data);
  }}
/>
```

**Supported Field Types:**
- `text`, `email`, `password`, `number`, `tel`, `url`
- `textarea`
- `select`
- `checkbox`
- `radio`
- `date`, `datetime-local`
- Custom renderers via `render` function

---

### 3. **ResourceShow** - Detail/Show Pages
Displays a single resource with:
- ✅ Organized sections
- ✅ Action buttons
- ✅ Custom value renderers
- ✅ Related resources

**Location:** `frontend/src/components/admin/ResourceShow.jsx`

**Example Usage:**
```jsx
import ResourceShow from '../../components/admin/ResourceShow';

<ResourceShow
  title="User Details"
  resource="users"
  fetchData={async (id) => {
    return await getUser(id);
  }}
  sections={[
    {
      title: 'Basic Information',
      fields: [
        { key: 'id', label: 'ID' },
        { key: 'email', label: 'Email' },
        { key: 'fullName', label: 'Full Name' },
        {
          key: 'role',
          label: 'Role',
          type: 'badge',
          variant: 'primary',
        },
        {
          key: 'isActive',
          label: 'Status',
          type: 'boolean',
        },
        {
          key: 'created_at',
          label: 'Created At',
          type: 'datetime',
        },
      ],
    },
  ]}
  actions={[
    {
      key: 'resetPassword',
      label: 'Reset Password',
      icon: '🔑',
      handler: async (user) => {
        await resetUserPassword(user.id);
      },
    },
  ]}
  onDelete={async (id) => {
    await deleteUser(id);
  }}
/>
```

---

### 4. **DashboardWidget** - Dashboard Statistics
Reusable widget system for dashboards:
- ✅ Stat widgets
- ✅ Chart widgets
- ✅ Table widgets
- ✅ Custom widgets
- ✅ Trend indicators

**Location:** `frontend/src/components/admin/DashboardWidget.jsx`

**Example Usage:**
```jsx
import { StatWidget, ChartWidget, TableWidget } from '../../components/admin/DashboardWidget';

// Stat Widget
<StatWidget
  title="Total Users"
  value="1,234"
  icon="👥"
  trend={12.5}
  trendLabel="vs last month"
  color="primary"
/>

// Chart Widget
<ChartWidget title="User Growth">
  {/* Your chart component here */}
</ChartWidget>

// Table Widget
<TableWidget title="Recent Users">
  {/* Your table component here */}
</TableWidget>
```

---

### 5. **ActionButton** - Action Buttons
Professional action buttons with:
- ✅ Loading states
- ✅ Confirmations
- ✅ Modal actions
- ✅ Multiple variants

**Location:** `frontend/src/components/admin/ActionButton.jsx`

**Example Usage:**
```jsx
import ActionButton, { ModalAction } from '../../components/admin/ActionButton';

// Simple Action
<ActionButton
  label="Delete"
  icon="🗑️"
  variant="danger"
  confirmMessage="Are you sure?"
  onClick={async () => {
    await deleteItem();
  }}
/>

// Modal Action
<ModalAction
  trigger={<button>Open Modal</button>}
  title="Confirm Action"
  onConfirm={async () => {
    await performAction();
  }}
>
  <p>Are you sure you want to perform this action?</p>
</ModalAction>
```

---

## 🎨 Styling

All components are styled with professional CSS located in:
- `frontend/src/components/admin/admin.css`

The CSS uses CSS variables defined in `App.css`:
- `--primary`, `--primary-dark`
- `--success`, `--danger`, `--warning`
- `--bg`, `--card-bg`
- `--text`, `--text-muted`
- `--border`

---

## 📝 Example Pages

### Users Resource Page
**Location:** `frontend/src/pages/admin/UsersPage.jsx`

Complete example showing:
- List page with columns
- Row actions (view, edit, freeze, unfreeze)
- Bulk actions
- Export functionality

---

## 🚀 Quick Start

1. **Import the CSS:**
```jsx
import './components/admin/admin.css';
```

2. **Create a List Page:**
```jsx
import ResourceList from '../components/admin/ResourceList';

function MyResourcePage() {
  return (
    <ResourceList
      title="My Resource"
      resource="my-resource"
      fetchData={async () => {
        // Fetch your data
        return data;
      }}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ]}
    />
  );
}
```

3. **Create a Form Page:**
```jsx
import ResourceForm from '../components/admin/ResourceForm';

function CreateResourcePage() {
  return (
    <ResourceForm
      title="Create Resource"
      resource="my-resource"
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
      ]}
      onSubmit={async (data) => {
        await createResource(data);
      }}
    />
  );
}
```

4. **Create a Show Page:**
```jsx
import ResourceShow from '../components/admin/ResourceShow';

function ShowResourcePage() {
  return (
    <ResourceShow
      title="Resource Details"
      resource="my-resource"
      fetchData={async (id) => {
        return await getResource(id);
      }}
      sections={[
        {
          fields: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
          ],
        },
      ]}
    />
  );
}
```

---

## 🔧 Advanced Features

### Custom Field Renderers
```jsx
{
  name: 'customField',
  label: 'Custom Field',
  render: (formData, handleChange, errors, submitting) => {
    return (
      <div>
        <input
          value={formData.customField}
          onChange={(e) => handleChange('customField', e.target.value)}
        />
      </div>
    );
  },
}
```

### Custom Value Renderers (Show Page)
```jsx
{
  key: 'status',
  label: 'Status',
  render: (value, row) => {
    return <CustomStatusBadge status={value} />;
  },
}
```

### Relationship Fields
```jsx
{
  name: 'categoryId',
  label: 'Category',
  type: 'select',
  options: async () => {
    const categories = await fetchCategories();
    return categories.map(c => ({ value: c.id, label: c.name }));
  },
}
```

---

## 📚 Best Practices

1. **Consistent Naming:** Use consistent resource names (plural for lists, singular for forms)
2. **Error Handling:** Always handle errors in your fetch functions
3. **Loading States:** Use loading states for better UX
4. **Validation:** Add validation rules to form fields
5. **Accessibility:** Ensure all interactive elements are keyboard accessible

---

## 🎯 Next Steps

1. Create more resource pages (Wallets, Transactions, etc.)
2. Add more dashboard widgets
3. Implement real-time updates (WebSockets)
4. Add export functionality (PDF, Excel)
5. Implement advanced filtering
6. Add relationship management

---

## 📖 Similar to Filament

This system provides similar functionality to Laravel Filament:
- ✅ Resource management
- ✅ Automatic CRUD generation
- ✅ Form builder
- ✅ Data tables
- ✅ Dashboard widgets
- ✅ Actions system
- ✅ Professional UI

But with the flexibility of React/Next.js!

---

## 🤝 Support

For questions or issues, refer to the component source code or create an issue.







