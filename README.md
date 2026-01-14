# 🚀 FXWallet - Premium Digital Wallet Platform

FXWallet is a state-of-the-art, professional digital wallet application built with **Next.js 15**, **Refine**, and **MySQL**. It features a stunning, premium design with advanced analytics, multi-currency support (USD, EUR, LBP), and a robust administrative dashboard.

![Dashboard Preview](https://img.shields.io/badge/Status-Project_Live-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-blue)
![Database](https://img.shields.io/badge/Database-MySQL-blue)

---

## ✨ Key Features

### 👤 User Dashboard
- **Dynamic Recent Transactions**: Real-time transaction history with smart filtering.
- **Advanced Analytics**: Interactive charts (Recharts) for income, expenses, and category trends.
- **Multi-Currency Wallets**: Native support for **USD**, **EUR**, and **LBP** with automatic wallet creation.
- **Professional PDF Export**: Generate transaction receipts and reports with custom branding.
- **Smart Cards**: Premium virtual card UI with balance visibility controls.

### 🛡️ Administrative Panel
- **Comprehensive User Management**: Inspect user profiles, wallets, and activity stats via a dedicated modal.
- **Transaction Monitoring**: Full audit trail of all platform transactions with advanced search and filtering.
- **Wallet Control**: Administrative ability to credit funds (with auto-create wallet logic) and manage wallet lifecycle (Deletion/Bulk Delete).
- **Hard Deletion Protection**: Safety checks for foreign key constraints to prevent data inconsistency.

### 🔒 Security & Performance
- **Per-Tab Session Isolation**: Advanced JWT management using `sessionStorage` to prevent identity mismatch across browser tabs.
- **Admin Guardian**: Middleware-level and API-level role verification.
- **Optimized Data Flow**: Server-side processing for complex queries and efficient database joins.
- **Real-time Notifications**: SSE (Server-Sent Events) for immediate transactional feedback.

---

## 🛠️ Technology Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | [Next.js](https://nextjs.org/), [Refine](https://refine.dev/), [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/) |
| **Components** | [Shadcn UI](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/) |
| **Backend** | [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers), [MySQL2](https://github.com/sidorares/node-mysql2) |
| **Auth** | [JWT](https://jwt.io/), [BcryptJS](https://github.com/dcodeIO/bcrypt.js) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Exports** | [jsPDF](https://github.com/parallax/jsPDF), [SheetJS (XLSX)](https://sheetjs.com/) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Database

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ali-Naji-3/Wallet-App.git
   cd Wallet-App
   ```

2. **Backend Setup:**
   ```bash
   cd backend/next
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env.local` file in `backend/next/`:
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=your_user
   MYSQL_PASSWORD=your_password
   MYSQL_DB=fxwallet
   JWT_SECRET=your_super_secret_key
   ```

4. **Initialize Database:**
   Run the SQL scripts provided in the root directory to set up the schema.

5. **Run Development Server:**
   ```bash
   npm run dev
   ```
   *Access the app at `http://localhost:4000`*

---

## 🔧 Developer Utility Scripts

We've provided several scripts to manage the platform efficiently:

- **Promote User to Admin**:
  ```bash
  node -r dotenv/config scripts/promote-user.js your-email@example.com dotenv_config_path=.env.local
  ```
- **Seed Mock Transactions**:
  ```bash
  node -r dotenv/config scripts/seed-transactions.js dotenv_config_path=.env.local
  ```
- **Backfill Default Wallets (USD/EUR/LBP)**:
  ```bash
  node -r dotenv/config scripts/ensure-default-wallets.js dotenv_config_path=.env.local
  ```

---

## 📂 Project Structure

```bash
├── backend/next/
│   ├── app/                # Next.js App Router (Pages & API)
│   ├── components/         # Reusable UI components (Shadcn/Custom)
│   ├── hooks/              # Custom React hooks (Auth, Notifications)
│   ├── lib/                # Database config, Auth helpers, API client
│   └── scripts/            # Database management & Seeding
├── frontend/               # (Legacy/Vite) Frontend reference
└── [Root Documents]        # Implementation plans and setup guides
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by the FXWallet Team.
