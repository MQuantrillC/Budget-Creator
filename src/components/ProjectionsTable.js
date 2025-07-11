'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { addWeeks, addMonths, addYears, format, startOfWeek, isWithinInterval } from 'date-fns';

export default function ProjectionsTable() {
  const { costs, income, currentCapital, settings, exchangeRates, startDate } = useBudget();
  const [view, setView] = useState('monthly'); // monthly, weekly, yearly

  const convertToBaseCurrency = (amount, currency) => {
    if (!exchangeRates || currency === settings.baseCurrency) return amount;
    const rate = exchangeRates[currency];
    return rate ? amount / rate : amount;
  };

  const calculateProjections = (periodType, periods) => {
    const projections = [];
    let runningCapital = currentCapital;
    const sDate = new Date(startDate);

    for (let i = 0; i < periods; i++) {
      let endDate;
      let periodLabel;

      if (periodType === 'weekly') {
        endDate = addWeeks(sDate, i + 1);
        periodLabel = `Week of ${format(addWeeks(sDate, i), 'MMM d, yyyy')}`;
      } else if (periodType === 'monthly') {
        endDate = addMonths(sDate, i + 1);
        periodLabel = format(addMonths(sDate, i), 'MMMM yyyy');
      } else { // yearly
        endDate = addYears(sDate, i + 1);
        periodLabel = format(addYears(sDate, i), 'yyyy');
      }

      const interval = { start: addMonths(sDate, i), end: endDate };

      let periodCosts = 0;
      costs.forEach(cost => {
        const costAmount = convertToBaseCurrency(cost.amount, cost.currency);
        switch (cost.category) {
          case 'monthly': periodCosts += periodType === 'monthly' ? costAmount : (periodType === 'weekly' ? costAmount / 4.33 : costAmount * 12); break;
          case 'weekly': periodCosts += periodType === 'weekly' ? costAmount : (periodType === 'monthly' ? costAmount * 4.33 : costAmount * 52); break;
          case 'yearly': periodCosts += periodType === 'yearly' ? costAmount : (periodType === 'monthly' ? costAmount / 12 : costAmount / 52); break;
          case 'one-time': if (isWithinInterval(new Date(cost.date), interval)) { periodCosts += costAmount; } break;
        }
      });

      let periodIncome = 0;
      income.forEach(inc => {
        const incomeAmount = convertToBaseCurrency(inc.amount, inc.currency);
        switch (inc.category) {
            case 'monthly': periodIncome += periodType === 'monthly' ? incomeAmount : (periodType === 'weekly' ? incomeAmount / 4.33 : incomeAmount * 12); break;
            case 'biweekly': periodIncome += periodType === 'weekly' ? incomeAmount / 2 : (periodType === 'monthly' ? incomeAmount * 2 : incomeAmount * 26); break;
            case 'weekly': periodIncome += periodType === 'weekly' ? incomeAmount : (periodType === 'monthly' ? incomeAmount * 4.33 : incomeAmount * 52); break;
            case 'yearly': periodIncome += periodType === 'yearly' ? incomeAmount : (periodType === 'monthly' ? incomeAmount / 12 : incomeAmount / 52); break;
        }
      });
      
      runningCapital += (periodIncome - periodCosts);

      projections.push({
        period: periodLabel,
        costs: periodCosts,
        income: periodIncome,
        netChange: periodIncome - periodCosts,
        endCapital: runningCapital,
      });
    }
    return projections;
  };

  const projectionData = {
    weekly: calculateProjections('weekly', 52), // 1 year of weekly
    monthly: calculateProjections('monthly', 12), // 1 year of monthly
    yearly: calculateProjections('yearly', 5), // 5 years
  };

  if (!exchangeRates) {
    return <div className="p-4 bg-white rounded-lg shadow mt-8">Loading projections...</div>;
  }

  const data = projectionData[view];

  return (
    <div className="p-4 bg-white rounded-lg shadow mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Projections</h2>
        <div className="flex space-x-2">
          <button onClick={() => setView('weekly')} className={`px-3 py-1 text-sm rounded-md ${view === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Weekly</button>
          <button onClick={() => setView('monthly')} className={`px-3 py-1 text-sm rounded-md ${view === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Monthly</button>
          <button onClick={() => setView('yearly')} className={`px-3 py-1 text-sm rounded-md ${view === 'yearly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Yearly</button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-semibold">Period</th>
              <th className="text-right p-2 font-semibold">Costs</th>
              <th className="text-right p-2 font-semibold">Income</th>
              <th className="text-right p-2 font-semibold">Net Change</th>
              <th className="text-right p-2 font-semibold">End Capital</th>
            </tr>
          </thead>
          <tbody>
            {data.map((proj, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{proj.period}</td>
                <td className="p-2 text-right text-red-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(proj.costs)}</td>
                <td className="p-2 text-right text-green-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(proj.income)}</td>
                <td className={`p-2 text-right ${proj.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(proj.netChange)}</td>
                <td className="p-2 text-right font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(proj.endCapital)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 