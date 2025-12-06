# 🚀 Step-by-Step Guide to Run the Wallet App

## Prerequisites

Before starting, make sure you have:
- ✅ **Node.js** installed (v16 or higher)
- ✅ **MySQL** database running
- ✅ **npm** or **yarn** package manager

---

## Step 1: Set Up Database Configuration

### 1.1 Create Backend Environment File

Navigate to the backend directory and create a `.env` file:

```bash
cd "/home/naji/Desktop/Wallet App/backend"
```

Create `.env` file with your MySQL database credentials:

```bash
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=your_database_name

# Server Port (default: 5001)
PORT=5001

# JWT Secret (generate one if you don't have it)
JWT_SECRET=your_jwt_secret_key_here
```

**To generate JWT Secret:**
```bash
cd "/home/naji/Desktop/Wallet App/backend"
node generate-jwt-secret.js
```

---

## Step 2: Install Dependencies

### 2.1 Install Backend Dependencies

Open **Terminal 1** and run:

```bash
cd "/home/naji/Desktop/Wallet App/backend"
npm install
```

### 2.2 Install Next.js Frontend Dependencies

Open **Terminal 2** and run:

```bash
cd "/home/naji/Desktop/Wallet App/backend/next"
npm install
```

---

## Step 3: Set Up Next.js Environment (Optional)

If your backend API runs on a different port, create a `.env.local` file in the Next.js directory:

```bash
cd "/home/naji/Desktop/Wallet App/backend/next"
```

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5001
```

> **Note:** If your backend runs on port 5001 (default), the Next.js app will try to connect to it. Make sure both are running.

---

## Step 4: Start the Backend Server

In **Terminal 1**, start the Express backend server:

```bash
cd "/home/naji/Desktop/Wallet App/backend"
npm run dev
```

**Expected output:**
```
✅ MySQL connected successfully
Server is running on port 5001
```

> **Keep this terminal open!** The backend must be running for the app to work.

---

## Step 5: Start the Next.js Frontend

Open a **NEW Terminal** (Terminal 2), and start the Next.js app on port 4000:

```bash
cd "/home/naji/Desktop/Wallet App/backend/next"
PORT=4000 npm run dev
```

**Expected output:**
```
  ▲ Next.js 16.0.6
  - Local:        http://localhost:4000
  - Ready in [time]
```

> **Keep this terminal open too!**

---

## Step 6: Access the Application

### Open your browser and go to:

**Login Page:**
```
http://localhost:4000/login
```

### Default Admin Credentials:
- **Email:** `admin@admin.com`
- **Password:** `admin123`

---

## 📋 Quick Command Summary

### Option 1: Manual (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd "/home/naji/Desktop/Wallet App/backend"
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd "/home/naji/Desktop/Wallet App/backend/next"
PORT=4000 npm run dev
```

### Option 2: Using npm scripts (if configured)

**From project root:**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd backend/next && PORT=4000 npm run dev
```

---

## 🔍 Verify Everything is Running

1. **Backend should be on:** `http://localhost:5001`
   - Visit: `http://localhost:5001` 
   - Should see: "FXWallet backend is running"

2. **Frontend should be on:** `http://localhost:4000`
   - Visit: `http://localhost:4000/login`
   - Should see the login page

---

## ❌ Troubleshooting

### Problem: Backend won't start
- **Check:** MySQL is running
- **Check:** `.env` file exists with correct credentials
- **Check:** Port 5001 is not already in use

### Problem: Frontend won't start
- **Check:** Port 4000 is not already in use
- **Check:** Dependencies are installed (`npm install`)

### Problem: Can't login
- **Check:** Backend is running on port 5001
- **Check:** Database has admin user created
- **Check:** API connection (browser console for errors)

### Problem: Database connection error
- **Verify:** MySQL service is running: `sudo systemctl status mysql`
- **Verify:** Database credentials in `.env` are correct
- **Verify:** Database exists: `mysql -u root -p` then `SHOW DATABASES;`

---

## 📝 Important Notes

1. **Two servers needed:**
   - Backend (Express) → Port 5001
   - Frontend (Next.js) → Port 4000

2. **Both must run simultaneously** - don't close either terminal!

3. **Environment variables are required** for the backend to connect to MySQL

4. **Admin user:** Make sure you have an admin user in your database. If not, use:
   ```bash
   cd "/home/naji/Desktop/Wallet App/backend/next"
   node scripts/create-admin.js
   ```

---

## 🎯 What Happens When You Run?

1. **Backend Server (Port 5001):**
   - Connects to MySQL database
   - Initializes authentication and transactions
   - Provides API endpoints for the frontend

2. **Frontend Server (Port 4000):**
   - Starts Next.js development server
   - Serves the React application
   - Connects to backend API

3. **When you visit `http://localhost:4000/login`:**
   - Next.js serves the login page
   - Login requests go to backend API
   - On success, you're redirected to dashboard

---

## ✅ Success Checklist

- [ ] MySQL database is running
- [ ] Backend `.env` file is configured
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server running on port 5001
- [ ] Frontend server running on port 4000
- [ ] Can access `http://localhost:4000/login`
- [ ] Can login with admin credentials

---

**Need help?** Check the other documentation files:
- `QUICK_START.md` - Quick reference
- `CONNECTION_STATUS.md` - Connection troubleshooting
- `CREATE_ADMIN_USER.md` - Admin user setup

