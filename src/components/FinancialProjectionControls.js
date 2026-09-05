'use client';

import { useBudget } from '@/context/BudgetContext';
import { Calendar, Clock } from 'lucide-react';
import DateInput from './DateInput';

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
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-8 p-5 bg-card-deep border border-line rounded">
      {/* Start Date */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-ink-soft" />
          <label htmlFor="startDate" className="ledger-label">
            Start Date
          </label>
        </div>
        <DateInput
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="DD/MM/YYYY"
        />
      </div>

      {/* Timeframe */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-ink-soft" />
          <label htmlFor="timeframe" className="ledger-label">
            Timeframe
          </label>
        </div>
        <select
          id="timeframe"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="ledger-input !w-auto"
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
