'use client';

import { useBudget } from '@/context/BudgetContext';
import { Calendar, Clock } from 'lucide-react';

export default function FinancialProjectionControls() {
  const { 
    startDate, 
    setStartDate, 
    timeframe, 
    setTimeframe 
  } = useBudget();

  const timeframeOptions = [
    { value: '6M', label: '6 Months' },
    { value: '1Y', label: '1 Year' },
    { value: '2Y', label: '2 Years' },
    { value: '3Y', label: '3 Years' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      {/* Start Date Control */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <label htmlFor="startDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Date:
          </label>
        </div>
        <input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 transition-colors"
        />
      </div>

      {/* Timeframe Control */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <label htmlFor="timeframe" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Timeframe:
          </label>
        </div>
        <select
          id="timeframe"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 transition-colors"
        >
          {timeframeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 