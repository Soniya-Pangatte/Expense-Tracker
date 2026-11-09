import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { TransactionProvider } from './context/TransactionContext';

// Auth Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import AdminRoute from './components/auth/AdminRoute';

// Layout
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/admin/AdminLayout';

// Core Pages (Eagerly loaded for instant initial render)
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import AddExpense from './pages/AddExpense';
import Budgets from './pages/Budgets';
import RecurringExpenses from './pages/RecurringExpenses';
import Settings from './pages/Settings';

// Heavy Pages (Code-split with dynamic import for optimal performance)
const ScanReceipt = lazy(() => import('./pages/ScanReceipt'));
const BankImports = lazy(() => import('./pages/BankImports'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));

// Admin Pages (Code-split so standard users never download admin chunks)
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminSystem = lazy(() => import('./pages/admin/AdminSystem'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

function PageFallback() {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="flex items-center gap-2.5 text-xs font-semibold text-[#526C78] dark:text-[#83BDCF]">
        <svg className="animate-spin h-5 w-5 text-[#447F98]" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading SpendWise module...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <TransactionProvider>
            <BrowserRouter>
              <Suspense fallback={<PageFallback />}>
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
                    <Route path="/edit-transaction/:id" element={<AddExpense />} />
                    <Route path="/scan-receipt" element={<ScanReceipt />} />
                    <Route path="/bank-imports" element={<BankImports />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/recurring-expenses" element={<RecurringExpenses />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>

                  {/* Admin Portal Protected Routes (Requires Admin role) */}
                  <Route
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
                    <Route path="/admin/overview" element={<AdminOverview />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                    <Route path="/admin/system" element={<AdminSystem />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                  </Route>

                  {/* Catch-all fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TransactionProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
