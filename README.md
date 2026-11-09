# SpendWise – Smart Personal Finance & Expense Management System

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![React](https://img.shields.io/badge/React-18.3-blue.svg)]()
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)]()
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)]()
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ECF8E.svg)]()
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-1.5%20Flash-orange.svg)]()

> **SpendWise** is a full-stack, enterprise-grade personal financial management platform built with React, Vite, Node.js, Express, Supabase PostgreSQL, and Google Gemini AI. It empowers users to track wealth, control budgets, automate receipt scanning, import bank statements, generate advanced financial reports, consult an AI financial advisor, and manage operations through a secure Admin Portal.

---

## 📑 Table of Contents
1. [Key Features by Phase](#-key-features)
2. [Technology Stack](#-technology-stack)
3. [System Architecture](#-system-architecture)
4. [Repository Structure](#-repository-structure)
5. [Prerequisites & Installation](#-prerequisites--installation)
6. [Environment Variable Configuration](#-environment-variable-configuration)
7. [Database Setup & Migrations](#-database-setup--migrations)
8. [Local Development Commands](#-local-development-commands)
9. [Automated Testing](#-automated-testing)
10. [Production Deployment Guide](#-production-deployment-guide)
11. [Security & Privacy Guarantees](#-security--privacy-guarantees)
12. [Known Limitations](#-known-limitations)

---

## ✨ Key Features

### 1. Authentication & Security (Phase 0)
- **Supabase Auth Integration:** Email/password authentication, JWT verification, and session persistence.
- **Row Level Security (RLS):** Strict database-level isolation ensuring users can only read and write their own records (`auth.uid() = user_id`).
- **Instant Preview Demo Mode:** Zero-friction evaluation mode allowing test drives without immediate database connectivity.

### 2. Transaction Management (Phase 1)
- **Unified Transaction Engine:** Income and expense tracking with real-time updates.
- **Categorization & Metadata:** 10+ standard categories, custom categories, payment methods (Cash, UPI, Credit Card, Debit Card, Bank Transfer).
- **Source Tracking:** Explicitly tags entries as `manual`, `receipt`, `bank`, or `recurring`.
- **Search & Filtering:** Multi-criteria filtering by date range, category, payment method, type, and merchant.

### 3. Budgets & Recurring Expenses (Phase 2)
- **Overall Monthly Budgets:** Month-specific spending caps with dynamic utilization pacing.
- **Category-Wise Budgets:** Granular limits per expense category with early warnings ($\ge 80\%$) and overspending alerts.
- **Recurring Commitments:** Subscription and bill management with frequency tracking, upcoming payment reminders, and pause/resume controls.

### 4. Smart Receipt Scanning & Multimodal OCR (Phase 3)
- **AI-Powered OCR:** Multimodal visual processing using Google Gemini Vision (`gemini-1.5-flash`) with deterministic regex fallback.
- **Automatic Extraction:** Detects merchant name, transaction date, line items, tax, and total amount.
- **Deduplication:** SHA-256 file hashing prevents duplicate receipt uploads.
- **Review & Commit:** Side-by-side receipt image preview and edit modal before writing to the database.

### 5. Smart Bank Statement Import (Phase 4)
- **Universal Format Support:** Parses CSV and OFX bank statements.
- **Intelligent Column Detection:** Auto-detects Date, Description, Amount, Debit, and Credit columns with manual remapping override.
- **Debit / Credit Classification:** Standardizes withdrawal and deposit signs across varied banking conventions.
- **Duplicate Detection:** Multi-factor hash matching against both the active file and previously imported batches.

### 6. Advanced Financial Analytics & Reports (Phase 5)
- **Financial Health Indicators:** Net savings, savings rate, average daily spend, and month-over-month variances.
- **Visual Analytics:** Cashflow area charts, category distribution donut charts, and monthly comparisons using Recharts.
- **Interactive Drill-Downs:** Click on any category slice to inspect underlying transactions in the selected period.
- **Multi-Format Exports:** Export filtered financial datasets to CSV, Excel (`.xlsx`), and print-ready PDF reports.

### 7. SpendWise AI Personal Finance Assistant (Phase 6)
- **Ground-Truth Financial Intelligence:** Pre-aggregated metrics computed on the backend are injected into the prompt, preventing LLM arithmetic hallucinations.
- **Natural Language Answering:** Answers questions such as *"Where am I spending the most?"*, *"Which category increased compared to last month?"*, and *"How can I reduce expenses?"*.
- **Safe Spending Pace:** Calculates safe remaining discretionary allowances after accounting for unpaid recurring bills.
- **Dual Fallback Engine:** Operates via Google Generative AI or local deterministic rule engine if API keys are offline.

### 8. Admin Dashboard & RBAC (Phase 7)
- **Role-Based Access Control:** Strict separation between `user` and `admin` roles verified by backend middleware.
- **Platform Telemetry:** Aggregate metrics tracking total users, active users, transaction volume, budgets, receipts, and bank imports.
- **User Management Directory:** Search, filter, inspect metadata, toggle status (activate/deactivate), and delegate roles.
- **Financial Privacy Guard:** Individual financial descriptions, receipts, and bank statements are strictly hidden from administrators.
- **System Monitoring:** Infrastructure health checks, service latencies, server uptime, and administrative event audit trails.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, JavaScript (JSX), Tailwind CSS, Lucide React, Three.js / React Three Fiber |
| **Data Visualization** | Recharts (Area charts, Bar charts, Donut charts) |
| **Backend API** | Node.js (v20+), Express 4, CORS, Dotenv |
| **Database & Auth** | Supabase (PostgreSQL 15+), Row Level Security (RLS), Supabase Storage |
| **Artificial Intelligence** | Google Generative AI (`@google/generative-ai`), Gemini 1.5 Flash Vision & Text |
| **Code Splitting** | `React.lazy()` & dynamic chunking via Rollup |

---

## 🏗 System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React 18 SPA (Vite)                  │
│   ├── User Application (/dashboard, /transactions)     │
│   ├── AI Financial Assistant (/ai-assistant)           │
│   └── Admin Control Portal (/admin/*)                  │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
            │ REST Calls                     │ Auth / Direct RLS Queries
            ▼                                ▼
┌───────────────────────┐        ┌───────────────────────┐
│ Node.js Express API   │        │ Supabase Cloud        │
│  ├── /api/ai          │        │  ├── PostgreSQL DB    │
│  ├── /api/receipts    │───────>│  ├── Row Level Sec.   │
│  ├── /api/bank-imports│        │  ├── Storage Buckets  │
│  └── /api/admin       │        │  └── User Auth (JWT)  │
└───────────┬───────────┘        └───────────────────────┘
            │
            ▼
┌───────────────────────┐
│ Google Gemini 1.5     │
│ (Multimodal Vision    │
│  & Text Advisory)     │
└───────────────────────┘
```

---

## 📁 Repository Structure

```
Expense Tracker/
├── client/                               # Frontend React + Vite Application
│   ├── public/                           # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                    # Admin portal layout, navbar, sidebar
│   │   │   ├── ai/                       # AI Chat drawer, chat box, insights
│   │   │   ├── analytics/                # Financial charts, drilldowns, export modals
│   │   │   ├── auth/                     # ProtectedRoute, AdminRoute, PublicRoute
│   │   │   ├── common/                   # Reusable UI buttons, cards, badges
│   │   │   ├── dashboard/                # Widgets, cashflow charts, budget widgets
│   │   │   ├── layout/                   # User MainLayout, Sidebar, Navbar
│   │   │   ├── receipts/                 # Receipt dropzone, OCR review modals
│   │   │   └── transactions/             # Transaction tables, forms, filters
│   │   ├── context/                      # AuthContext, CurrencyContext, ThemeContext, TransactionContext
│   │   ├── pages/                        # Dashboard, AIAssistant, Transactions, etc.
│   │   │   └── admin/                    # AdminOverview, AdminUsers, AdminAnalytics, AdminSystem, AdminSettings
│   │   ├── services/                     # aiService, adminService, exportService
│   │   ├── App.jsx                       # Master router with lazy code splitting
│   │   └── main.jsx                      # Vite entry point
│   ├── .env.example                      # Client environment template
│   ├── vercel.json                       # SPA redirect configuration for Vercel
│   └── vite.config.js                    # Vite configuration & chunking rules
│
├── server/                               # Backend Node.js Express API Server
│   ├── src/
│   │   ├── config/                       # Supabase client & admin client configuration
│   │   ├── middleware/                   # requireAuth & requireAdmin RBAC guards
│   │   ├── routes/                       # aiRoutes, receiptRoutes, bankImportRoutes, adminRoutes
│   │   ├── services/                     # financialAnalysisEngine, geminiService, adminService, receiptOCRService
│   │   └── index.js                      # Express server entry point & health check
│   ├── .env.example                      # Server environment template
│   ├── Dockerfile                        # Production container image
│   ├── Procfile                          # Deployment process configuration
│   ├── test_phase6_qa.js                 # Automated AI verification suite
│   ├── test_phase7_qa.js                 # Automated Admin RBAC verification suite
│   └── test_phase8_master_qa.js          # Master end-to-end regression test suite
│
├── supabase_master_production_schema.sql # Unified production PostgreSQL schema
└── README.md                             # Project documentation
```

---

## 💻 Prerequisites & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Package Manager**: `npm` (v9+) or `bun`
- **Supabase Account**: Free project from [supabase.com](https://supabase.com)
- **Google Gemini API Key**: Free key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation
Clone the repository and install all dependencies:

```bash
# Clone the repository
git clone https://github.com/Soniya-Pangatte/Expense-Tracker.git
cd Expense-Tracker

# Install dependencies for both client and server
npm install
npm run install:all
```

---

## 🔐 Environment Variable Configuration

### 1. Server Environment (`server/.env`)
Create `server/.env` based on `server/.env.example`:

```env
NODE_ENV=production
PORT=5000

# CORS Allowed Origins
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Supabase Credentials (Project Settings > API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# Optional Bootstrap Admin Emails
ADMIN_EMAILS=admin@spendwise.io
```

### 2. Client Environment (`client/.env`)
Create `client/.env` based on `client/.env.example`:

```env
# Public Supabase API configuration (VITE_ variables are bundled in client assets)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> [!IMPORTANT]
> Never commit actual `.env` files to source control. Only commit `.env.example` templates.

---

## 🗄 Database Setup & Migrations

Deploy the consolidated schema to your Supabase PostgreSQL instance:

1. Open your **Supabase Dashboard** > **SQL Editor**.
2. Copy and paste the entire contents of [`supabase_master_production_schema.sql`](./supabase_master_production_schema.sql).
3. Click **Run** to execute the script.
4. Create two public Storage Buckets in **Supabase Dashboard** > **Storage**:
   - `receipts` (Public or authenticated access)
   - `bank-imports` (Authenticated access)
5. To designate your first administrator, run:
   ```sql
   SELECT public.assign_user_role('your-admin-email@domain.com', 'admin');
   ```

---

## 🏃 Local Development Commands

### Run Both Services Concurrently:
```bash
# Terminal 1: Start Backend API (Port 5000)
npm run server:dev

# Terminal 2: Start Frontend Client (Port 3000 / 5173)
npm run client:dev
```

Open your browser to `http://localhost:5173` (or `http://localhost:3000`).

---

## 🧪 Automated Testing

SpendWise includes automated test suites covering all financial logic, AI reasoning, and RBAC protection:

```bash
# Run Master End-to-End Regression Test Suite (Phases 0–8)
node server/test_phase8_master_qa.js

# Run SpendWise AI Advisory QA Suite (Phase 6)
node server/test_phase6_qa.js

# Run Admin Portal & RBAC Security Suite (Phase 7)
node server/test_phase7_qa.js
```

---

## 🚀 Production Deployment Guide

### Option 1: Frontend on Vercel & Backend on Render (Recommended)

#### Frontend (Vercel):
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Set **Build Command** to `vite build` and **Output Directory** to `dist`.
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

#### Backend (Render / Railway):
1. Create a new **Web Service** on [Render](https://render.com) pointing to the repository.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install --production`.
4. Set **Start Command** to `node src/index.js`.
5. Add environment variables:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `CORS_ORIGIN=https://your-vercel-domain.vercel.app`
6. Deploy.

### Option 2: Containerized Deployment (Docker)
The backend includes a production-ready [`server/Dockerfile`](./server/Dockerfile):

```bash
cd server
docker build -t spendwise-api .
docker run -p 5000:5000 --env-file .env spendwise-api
```

---

## 🛡 Security & Privacy Guarantees

1. **Row Level Security (RLS):** Every financial table (`transactions`, `budgets`, `receipt_uploads`, `bank_imports`, `ai_messages`) enforces strict ownership via `auth.uid() = user_id`.
2. **Zero Admin Exposure of Financial Records:** The Admin Dashboard displays only anonymized aggregate counts. Individual merchant names, amounts, receipt images, and statements are never accessible to administrators.
3. **Protected Role Escalation:** Public users cannot self-assign an admin role during signup. Admin delegation requires a database stored procedure or an action by an existing admin.
4. **Key Protection:** `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` reside exclusively on the Node.js server and are never bundled in frontend code.

---

## ⚠️ Known Limitations

1. **Multi-Currency Real-Time Forex:** Currency conversions prioritize the user's primary selected currency rather than fetching live forex rates.
2. **External Email Notifications:** Account activation/deactivation takes effect immediately in the database; email dispatch requires an external SMTP server configured in Supabase Auth.
3. **OCR Processing Time:** Multimodal OCR on dense receipts typically takes 2–4 seconds depending on Gemini API response times.

---

## 📄 License
This project is licensed under the ISC License.
