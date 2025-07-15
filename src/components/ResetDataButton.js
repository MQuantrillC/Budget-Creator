'use client';

import { useBudget } from '@/context/BudgetContext';
import { Eraser } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetDataButton() {
  const { resetAllData } = useBudget();

  const handleClick = () => {
    // Add a confirmation dialog before resetting
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      resetAllData();
      toast.success('All data has been reset.');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
    >
      <Eraser className="h-3 w-3 mr-1.5" />
      Reset Data
    </button>
  );
} 