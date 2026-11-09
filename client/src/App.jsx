import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { TransactionProvider } from './context/TransactionContext';

// Auth Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';

// Layout
import MainLayout from './components/layout/MainLayout';

// Public Landing Page
import LandingPage from './pages/LandingPage';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Application Pages (Protected)
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import Transactions from './pages/Transactions';
import AddExpense from './pages/AddExpense';
import ScanReceipt from './pages/ScanReceipt';
import BankImports from './pages/BankImports';
import Budgets from './pages/Budgets';
import RecurringExpenses from './pages/RecurringExpenses';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <TransactionProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Public-only Auth Routes (Redirects authenticated users to /dashboard) */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Signup />
                    </PublicRoute>
                  }
                />
                {/* Legacy /signup route redirects to /register */}
                <Route path="/signup" element={<Navigate to="/register" replace />} />

                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPassword />
                    </PublicRoute>
                  }
                />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected Application Routes (Requires verified active session) */}
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/ai-assistant" element={<AIAssistant />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/add-expense" element={<AddExpense />} />
                  <Route path="/scan-receipt" element={<ScanReceipt />} />
                  <Route path="/bank-imports" element={<BankImports />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/recurring-expenses" element={<RecurringExpenses />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </TransactionProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
