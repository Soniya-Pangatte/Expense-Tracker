# SpendWise – Smart Personal Finance & Expense Management System

A modern, responsive full-stack web application designed for personal finance management, tracking income and expenses through three unified entry methods:
1. **Manual Expense Entry**
2. **Receipt Scanning using OCR (Tesseract.js)**
3. **Bank Transaction Imports (with Duplicate Detection)**

---

## 🎨 Design System & Color Palette

SpendWise follows a modern, earthy financial SaaS aesthetic inspired by Monarch Money, Splitwise, and Wallet:

### Light Theme
- **Background**: `#F7F8F5`
- **Cards**: `#FFFFFF`
- **Primary**: `#64866A` (Sage Green)
- **Text**: `#26332B`
- **Secondary Text**: `#858D84`
- **Borders**: `#E7EBE4`

### Dark Theme
- **Background**: `#171D1A`
- **Cards**: `#222B26`
- **Primary**: `#8AAA8D` (Soft Sage)
- **Text**: `#F1F4EF`
- **Secondary Text**: `#A1AAA1`
- **Borders**: `#2E3832`

---

## 🛠 Tech Stack

- **Frontend**: React.js 18, Vite, JavaScript (ES6+), Tailwind CSS, React Router DOM v6
- **Data Visualization**: Recharts (Cashflow Area Chart, Expense Distribution Donut Chart)
- **Icons**: Lucide React
- **Typography**: Plus Jakarta Sans & Inter
- **State & Theme**: React Context (`ThemeContext`, `TransactionContext`)

---

## 📁 Project Structure

```
Expense Tracker/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   └── Card.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── BudgetProgressWidget.jsx
│   │   │   │   ├── CategoryBreakdownChart.jsx
│   │   │   │   ├── QuickActions.jsx
│   │   │   │   ├── RecentTransactionsTable.jsx
│   │   │   │   ├── SpendingTrendChart.jsx
│   │   │   │   └── StatCard.jsx
│   │   │   └── layout/
│   │   │       ├── MainLayout.jsx
│   │   │       ├── Navbar.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── context/
│   │   │   ├── ThemeContext.jsx
│   │   │   └── TransactionContext.jsx
│   │   ├── data/
│   │   │   └── mockData.js
│   │   ├── pages/
│   │   │   ├── AddExpense.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── BankImports.jsx
│   │   │   ├── Budgets.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── RecurringExpenses.jsx
│   │   │   ├── ScanReceipt.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Transactions.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── package.json
└── README.md
```

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# Install client dependencies
npm --prefix client install
```

### Development Server
```bash
# Start frontend on http://localhost:3000
npm --prefix client run dev
```

### Production Build
```bash
npm --prefix client run build
```

---

## 📋 Development Roadmap

- [x] **Phase 1**: Project Initialization, Design System, Layout, & Dynamic Dashboard
- [ ] **Phase 2**: Manual Expense Management, Full Form Validations, Search & Filters
- [ ] **Phase 3**: Budgets, Recurring Expenses & Deep Financial Analytics
- [ ] **Phase 4**: Supabase PostgreSQL Schema, RLS, & Authentication Integration
- [ ] **Phase 5**: OCR Receipt Scanning Pipeline with Review & Confirmation
- [ ] **Phase 6**: Bank Transaction Imports & Duplicate Detection Engine
- [ ] **Phase 7**: Comprehensive Testing, Polish, & Deployment Setup

