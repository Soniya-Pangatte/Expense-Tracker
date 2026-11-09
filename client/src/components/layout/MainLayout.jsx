import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIChatDrawer from '../ai/AIChatDrawer';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/': 'Dashboard',
  '/ai-assistant': 'SpendWise AI Assistant',
  '/transactions': 'Transactions',
  '/add-expense': 'Add Transaction',
  '/scan-receipt': 'Receipt Scanner (OCR)',
  '/bank-imports': 'Bank Transaction Imports',
  '/budgets': 'Budget Management',
  '/recurring-expenses': 'Recurring Expenses',
  '/analytics': 'Analytics & Reports',
  '/settings': 'Account & Preferences',
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentTitle = pageTitles[location.pathname] || 'SpendWise';

  return (
    <div className="min-h-screen bg-[#D6EBF3] dark:bg-[#152B35] text-[#243D49] dark:text-[#D6EBF3] flex transition-colors">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          onOpenSidebar={() => setSidebarOpen(true)}
          pageTitle={currentTitle}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Global Floating AI Assistant Drawer */}
        <AIChatDrawer />
      </div>
    </div>
  );
}

