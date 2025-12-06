# Admin Dashboard Hybrid - Quick Start Checklist

## 🚀 Phase 1: Foundation (Week 1)

### Day 1: Refine.dev Setup

**Installation:**
```bash
# In backend/next directory
npm install @refinedev/core @refinedev/nextjs-router @refinedev/react-hook-form @refinedev/react-table
npm install @tanstack/react-table @tanstack/react-query
```

**Configuration Files to Create:**
- [ ] `app/providers.tsx` - Refine provider wrapper
- [ ] `lib/refine/refine-config.ts` - Refine configuration
- [ ] `app/(admin)/layout.tsx` - Admin layout with Refine

**Deliverable:** Refine running with basic routing

---

### Day 2: ShadCN UI Setup

**Installation:**
```bash
npx shadcn-ui@latest init
```

**Components to Install:**
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add command
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add tabs
```

**Additional Libraries:**
```bash
npm install sonner lucide-react date-fns recharts zod
```

**Deliverable:** ShadCN UI working with theme

---

### Day 3: Data Provider

**Files to Create:**
- [ ] `lib/refine/data-provider.ts` - Main data provider
- [ ] `lib/api/client.ts` - Axios instance with JWT
- [ ] `lib/api/endpoints.ts` - API endpoint definitions

**API Methods to Implement:**
- [ ] `getList` - Get paginated list
- [ ] `getOne` - Get single resource
- [ ] `create` - Create resource
- [ ] `update` - Update resource
- [ ] `deleteOne` - Delete resource
- [ ] `getMany` - Get multiple by IDs

**Deliverable:** Data provider connected to your API

---

### Day 4: Auth Provider

**Files to Create:**
- [ ] `lib/refine/auth-provider.ts` - Auth provider
- [ ] `lib/hooks/use-auth.ts` - Auth hook

**Auth Methods to Implement:**
- [ ] `login` - JWT login
- [ ] `logout` - Clear tokens
- [ ] `check` - Verify authentication
- [ ] `getPermissions` - Get user role
- [ ] `getIdentity` - Get user info

**Deliverable:** Authentication working with your API

---

### Day 5: Admin Layout

**Files to Create:**
- [ ] `components/admin/layout/sidebar.tsx` - Sidebar navigation
- [ ] `components/admin/layout/header.tsx` - Top header
- [ ] `components/admin/layout/breadcrumb.tsx` - Breadcrumb trail
- [ ] `app/(admin)/layout.tsx` - Main admin layout

**Features to Add:**
- [ ] Collapsible sidebar
- [ ] User menu dropdown
- [ ] Search command (Cmd+K)
- [ ] Notifications icon
- [ ] Theme toggle

**Deliverable:** Professional admin layout complete

---

## 🎯 Phase 2: First Resource (Week 2)

### Day 1: Users List Page

**File:** `app/(admin)/users/page.tsx`

**Features:**
- [ ] Data table with ShadCN
- [ ] Columns: ID, Email, Name, Role, Status
- [ ] Sorting
- [ ] Filtering (role, status)
- [ ] Search (email, name)
- [ ] Pagination
- [ ] Row actions (view, edit, delete)
- [ ] Bulk actions (activate, deactivate)

**Components to Create:**
- [ ] `components/admin/users/users-table.tsx`
- [ ] `components/admin/users/users-columns.tsx`
- [ ] `components/admin/users/users-filters.tsx`

**Deliverable:** Working users list page

---

### Day 2: Users Create Form

**File:** `app/(admin)/users/create/page.tsx`

**Features:**
- [ ] Form with React Hook Form + Zod
- [ ] Fields: email, password, name, role
- [ ] Validation
- [ ] Error handling
- [ ] Success message

**Components to Create:**
- [ ] `components/admin/users/user-form.tsx`
- [ ] `lib/validations/user-schema.ts`

**Deliverable:** Create user form working

---

### Day 3: Users Edit Form

**File:** `app/(admin)/users/[id]/edit/page.tsx`

**Features:**
- [ ] Pre-filled form
- [ ] Same validation as create
- [ ] Update handling
- [ ] Navigate back on success

**Deliverable:** Edit user form working

---

### Day 4: Users Show Page

**File:** `app/(admin)/users/[id]/page.tsx`

**Features:**
- [ ] User details display
- [ ] Sections: Profile, Settings, KYC, Activity
- [ ] Related wallets table
- [ ] Recent transactions table
- [ ] Action buttons (freeze, reset password)

**Components to Create:**
- [ ] `components/admin/users/user-details.tsx`
- [ ] `components/admin/users/user-wallets.tsx`
- [ ] `components/admin/users/user-transactions.tsx`

**Deliverable:** Complete user resource

---

### Day 5: Testing & Polish

**Tasks:**
- [ ] Test all CRUD operations
- [ ] Check responsive design
- [ ] Verify permissions
- [ ] Test error scenarios
- [ ] Add loading states
- [ ] Polish UI/UX

**Deliverable:** Users resource production-ready

---

## 🎨 Phase 3: Dashboard (Week 3)

### Day 1: Dashboard Layout

**File:** `app/(admin)/dashboard/page.tsx`

**Sections:**
- [ ] Stats grid (4x2)
- [ ] Charts row
- [ ] Tables row (recent users, recent transactions)
- [ ] Activity feed

**Deliverable:** Dashboard layout

---

### Day 2: Stats Widgets

**Components to Create:**
- [ ] `components/admin/dashboard/stat-card.tsx`

**Widgets:**
- [ ] Total Users (with trend)
- [ ] Active Users
- [ ] Total Transactions
- [ ] Total Wallets
- [ ] Revenue
- [ ] New Users (7d)

**Deliverable:** Stats widgets complete

---

### Day 3: Charts

**Components to Create:**
- [ ] `components/admin/dashboard/user-growth-chart.tsx`
- [ ] `components/admin/dashboard/transaction-volume-chart.tsx`
- [ ] `components/admin/dashboard/currency-distribution-chart.tsx`

**Using:** Recharts library

**Deliverable:** Charts complete

---

### Day 4: Activity Feed

**Component:** `components/admin/dashboard/activity-feed.tsx`

**Features:**
- [ ] Recent activity list
- [ ] Real-time updates
- [ ] Grouping by date
- [ ] Click to view details

**Deliverable:** Activity feed complete

---

### Day 5: Dashboard Complete

**Tasks:**
- [ ] Add refresh mechanism
- [ ] Optimize data loading
- [ ] Add loading states
- [ ] Test responsive design
- [ ] Polish UI

**Deliverable:** Dashboard production-ready

---

## 📦 Phase 4: Additional Resources (Week 4-5)

### Wallets Resource (Week 4, Day 1-3)
- [ ] List page
- [ ] Show page (with transaction history)
- [ ] Actions (freeze, unfreeze, adjust balance)
- [ ] Filters (currency, status, balance range)

### Transactions Resource (Week 4, Day 4-5)
- [ ] List page
- [ ] Show page
- [ ] Advanced filters
- [ ] Export functionality
- [ ] Flag system

### KYC Management (Week 5, Day 1-2)
- [ ] KYC queue page
- [ ] Document viewer
- [ ] Approval/rejection workflow
- [ ] Status tracker

### System Settings (Week 5, Day 3-4)
- [ ] Currency management
- [ ] Fee configuration
- [ ] Rate spreads
- [ ] Limits configuration

### Audit Logs (Week 5, Day 5)
- [ ] Logs viewer
- [ ] Advanced filters
- [ ] Export logs
- [ ] Search functionality

---

## 🎯 Success Criteria

### Week 1 ✅
- [ ] Refine.dev integrated
- [ ] ShadCN UI working
- [ ] Auth connected
- [ ] Admin layout complete

### Week 2 ✅
- [ ] Users resource complete
- [ ] CRUD operations working
- [ ] Permissions enforced

### Week 3 ✅
- [ ] Dashboard complete
- [ ] Charts working
- [ ] Real-time updates

### Week 4-5 ✅
- [ ] All resources complete
- [ ] Advanced features added
- [ ] Production ready

---

## 📚 Key Files Reference

### Configuration
- `tailwind.config.ts` - Tailwind + ShadCN theme
- `components.json` - ShadCN configuration
- `lib/refine/refine-config.ts` - Refine setup

### Providers
- `lib/refine/data-provider.ts` - API integration
- `lib/refine/auth-provider.ts` - Authentication
- `lib/refine/access-control.ts` - Permissions

### Layout
- `app/(admin)/layout.tsx` - Admin layout
- `components/admin/layout/sidebar.tsx` - Sidebar
- `components/admin/layout/header.tsx` - Header

### Components
- `components/ui/*` - ShadCN components
- `components/admin/tables/data-table.tsx` - Reusable table
- `components/admin/forms/resource-form.tsx` - Reusable form

---

## 🔧 Useful Commands

### Development
```bash
npm run dev                 # Start Next.js dev server
npm run build              # Build for production
npm run start              # Start production server
```

### ShadCN
```bash
npx shadcn-ui@latest add [component]    # Add component
npx shadcn-ui@latest diff              # Check for updates
```

### Testing
```bash
npm run test               # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

---

## 🎨 Design Tokens

### Colors (customize in `tailwind.config.ts`)
- **Primary:** Blue (#3b82f6)
- **Success:** Green (#10b981)
- **Warning:** Yellow (#f59e0b)
- **Danger:** Red (#ef4444)
- **Muted:** Gray (#6b7280)

### Typography
- **Font:** Inter (default)
- **Sizes:** xs, sm, base, lg, xl, 2xl, 3xl
- **Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
- **Base unit:** 4px (0.25rem)
- **Common:** 1, 2, 3, 4, 6, 8, 12, 16, 20, 24

---

## 🚨 Common Issues & Solutions

### Issue: Refine router not working
**Solution:** Check `app/providers.tsx` and ensure `RouterProvider` is configured

### Issue: ShadCN components not styled
**Solution:** Verify `globals.css` imports and Tailwind config

### Issue: API calls failing
**Solution:** Check CORS settings and API URL in `.env`

### Issue: Auth token not persisting
**Solution:** Check localStorage usage in auth provider

### Issue: Table not rendering data
**Solution:** Verify data provider response format matches Refine expectations

---

## 📞 Need Help?

### Documentation
- **Full Plan:** See `ADMIN_HYBRID_PLAN.md`
- **Refine Docs:** https://refine.dev/docs/
- **ShadCN Docs:** https://ui.shadcn.com/

### Debugging
- Check browser console for errors
- Verify API responses in Network tab
- Use React DevTools for component inspection
- Check Refine DevTools (built-in)

---

## ✅ Final Checklist

Before going to production:

### Functionality
- [ ] All CRUD operations working
- [ ] Authentication & permissions correct
- [ ] Forms validating properly
- [ ] Tables sorting/filtering/paginating
- [ ] Dashboard loading correctly
- [ ] All actions working

### UI/UX
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark mode working
- [ ] Loading states everywhere
- [ ] Error states handled
- [ ] Success messages shown
- [ ] Smooth transitions

### Performance
- [ ] Page load < 2 seconds
- [ ] API responses < 300ms
- [ ] No console errors
- [ ] Images optimized
- [ ] Bundle size acceptable

### Security
- [ ] JWT working correctly
- [ ] Permissions enforced
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Input validation

### Testing
- [ ] Manual testing complete
- [ ] Unit tests written
- [ ] E2E tests for critical flows
- [ ] Cross-browser tested

### Deployment
- [ ] Environment variables set
- [ ] Build succeeds
- [ ] Production optimizations
- [ ] Monitoring configured
- [ ] Backup strategy

---

**Ready to start building! 🚀**

Start with Day 1: Install Refine.dev packages

