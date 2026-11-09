import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ScanLine, Landmark, PieChart } from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Add Manual Expense',
      desc: 'Record a cash or card expense',
      icon: PlusCircle,
      path: '/add-expense',
      color: 'hover:border-[#C4DCE3]',
      iconColor: 'text-[#243D49] dark:text-[#83BDCF] bg-[#B9D9E1]/20 dark:bg-[#B9D9E1]/20',
    },
    {
      title: 'Scan Paper Receipt',
      desc: 'AI OCR text extraction',
      icon: ScanLine,
      path: '/scan-receipt',
      color: 'hover:border-purple-500/50',
      iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20',
    },
    {
      title: 'Import Bank Data',
      desc: 'Upload statement or sync',
      icon: Landmark,
      path: '/bank-imports',
      color: 'hover:border-blue-500/50',
      iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20',
    },
    {
      title: 'Adjust Budgets',
      desc: 'Set monthly category caps',
      icon: PieChart,
      path: '/budgets',
      color: 'hover:border-amber-500/50',
      iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.title}
            onClick={() => navigate(act.path)}
            className={`p-4 rounded-2xl bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] shadow-card hover:shadow-card-hover text-left flex items-center gap-3.5 transition-all group ${act.color}`}
          >
            <div className={`p-3 rounded-xl ${act.iconColor} transition-transform group-hover:scale-105 shrink-0`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-[#243D49] dark:text-[#D6EBF3] group-hover:text-[#447F98] transition-colors truncate">
                {act.title}
              </h4>
              <p className="text-xs text-[#526C78] dark:text-[#83BDCF] truncate">
                {act.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

