import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Wallet } from 'lucide-react';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#D6EBF3] dark:bg-[#152B35] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#447F98] flex items-center justify-center text-[#D6EBF3] shadow-md animate-pulse mb-4">
          <Wallet size={28} />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#243D49] dark:text-[#D6EBF3]">
          <svg className="animate-spin h-4 w-4 text-[#447F98]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading SpendWise...</span>
        </div>
      </div>
    );
  }

  if (user) {
    // If user is already authenticated, redirect away from login/register to dashboard
    const fromPath = location.state?.from?.pathname;
    const destination = fromPath && fromPath !== '/' && fromPath !== '/login' && fromPath !== '/register' && fromPath !== '/signup'
      ? fromPath
      : '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children;
}
