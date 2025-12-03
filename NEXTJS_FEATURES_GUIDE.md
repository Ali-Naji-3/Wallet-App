# 🚀 Next.js Features Guide: SSG, ISR, SSR, CSR, SWR

## 📚 **What Each Feature Does**

### **SSG (Static Site Generation)**
- Pages are **pre-built at build time**
- HTML is generated once, served instantly
- **Best for**: Pages that don't change often (About, Terms, etc.)

### **ISR (Incremental Static Regeneration)**
- Pages are **pre-built but can update** without rebuilding
- Revalidate after X seconds
- **Best for**: Pages that change occasionally (Product listings, Blog posts)

### **SSR (Server-Side Rendering)**
- Pages are **generated on each request**
- Always fresh data from server
- **Best for**: User-specific pages (Dashboard, Profile)

### **CSR (Client-Side Rendering)**
- Pages load in browser, fetch data with JavaScript
- **Best for**: Interactive pages (Forms, Real-time updates)

### **SWR (Stale-While-Revalidate)**
- Data fetching library by Vercel
- Shows cached data instantly, updates in background
- **Best for**: Real-time data that needs to stay fresh

---

## 🎯 **When to Use Each**

| Feature | Use Case | Example |
|---------|----------|---------|
| **SSG** | Static content | About page, Terms of Service |
| **ISR** | Content that updates occasionally | Product catalog, Blog posts |
| **SSR** | User-specific, always fresh | Dashboard, User profile |
| **CSR** | Interactive, real-time | Forms, Live chat |
| **SWR** | Data that needs frequent updates | FX rates, Wallet balance |

---

## 💻 **Implementation Examples**

### **1. SSG - Static Page**

```javascript
// app/about/page.js
export default function AboutPage() {
  return <div>About Us - Static Content</div>;
}

// This page is pre-built at build time
```

### **2. ISR - Incremental Static Regeneration**

```javascript
// app/products/page.js
export async function generateStaticParams() {
  // Pre-generate some pages
  return [{ id: '1' }, { id: '2' }];
}

export async function generateStaticProps() {
  const products = await fetchProducts();
  return {
    props: { products },
    revalidate: 60, // Revalidate every 60 seconds
  };
}
```

### **3. SSR - Server-Side Rendering**

```javascript
// app/dashboard/page.js
export default async function DashboardPage() {
  // This runs on the server for each request
  const data = await fetch('http://localhost:3000/api/dashboard/portfolio', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const portfolio = await data.json();
  
  return <div>Dashboard: {portfolio.totalPortfolioValue}</div>;
}
```

### **4. CSR - Client-Side Rendering**

```javascript
// app/exchange/page.js
'use client'; // This makes it a Client Component

import { useState, useEffect } from 'react';

export default function ExchangePage() {
  const [wallets, setWallets] = useState([]);
  
  useEffect(() => {
    // Fetch data in browser
    fetch('/api/wallets/my')
      .then(res => res.json())
      .then(setWallets);
  }, []);
  
  return <div>Exchange: {wallets.length} wallets</div>;
}
```

### **5. SWR - Stale-While-Revalidate**

```javascript
// app/dashboard/page.js
'use client';

import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(res => res.json());

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR(
    '/api/dashboard/portfolio',
    fetcher,
    { refreshInterval: 5000 } // Refresh every 5 seconds
  );
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;
  
  return <div>Balance: {data?.totalPortfolioValue}</div>;
}
```

---

## 🔧 **Setup SWR**

```bash
cd backend/next
npm install swr
```

---

## 📝 **Best Practices**

1. **Use SSG** for public, static pages
2. **Use ISR** for content that updates occasionally
3. **Use SSR** for user-specific, authenticated pages
4. **Use CSR** for interactive components
5. **Use SWR** for data that needs frequent updates

---

**Next**: I'll implement these in your wallet app! 🚀

