'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { addWeeks, addMonths, addYears, format, isWithinInterval } from 'date-fns';

export default function ProjectionsTable() {
  const { 
    costs, 
    income, 
    currentCapital, 
    settings, 
    exchangeRates, 
    startDate, 
    projectionDisplayCurrency, 
    setProjectionDisplayCurrency,
    startingCapitalCurrency 
  } = useBudget();
  const [view, setView] = useState('monthly'); // monthly, weekly, yearly

  const convertToBaseCurrency = (amount, currency) => {
    if (!exchangeRates || currency === settings.baseCurrency) return amount;
    const rate = exchangeRates[currency];
    return rate ? amount / rate : amount;
  };

  const convertToDisplayCurrency = (amount, fromCurrency) => {
    if (!exchangeRates || fromCurrency === projectionDisplayCurrency) return amount;
    
    // First convert to base currency
    const baseAmount = convertToBaseCurrency(amount, fromCurrency);
    
    // Then convert to display currency
    if (projectionDisplayCurrency === settings.baseCurrency) return baseAmount;
    const displayRate = exchangeRates[projectionDisplayCurrency];
    return displayRate ? baseAmount * displayRate : baseAmount;
  };

  const calculateProjections = (periodType, periods) => {
    const projections = [];
    
    // Convert starting capital to display currency
    const startingCapitalInBase = convertToBaseCurrency(currentCapital, startingCapitalCurrency);
    const startingCapitalInDisplay = convertToDisplayCurrency(startingCapitalInBase, settings.baseCurrency);
    let runningCapital = startingCapitalInDisplay;
    
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
        const costAmount = convertToDisplayCurrency(cost.amount, cost.currency);
        switch (cost.category) {
          case 'monthly': periodCosts += periodType === 'monthly' ? costAmount : (periodType === 'weekly' ? costAmount / 4.33 : costAmount * 12); break;
          case 'weekly': periodCosts += periodType === 'weekly' ? costAmount : (periodType === 'monthly' ? costAmount * 4.33 : costAmount * 52); break;
          case 'yearly': periodCosts += periodType === 'yearly' ? costAmount : (periodType === 'monthly' ? costAmount / 12 : costAmount / 52); break;
          case 'one-time': if (cost.date && isWithinInterval(new Date(cost.date), interval)) { periodCosts += costAmount; } break;
        }
      });

      let periodIncome = 0;
      income.forEach(inc => {
        const incomeAmount = convertToDisplayCurrency(inc.amount, inc.currency);
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
    return (
        <div className="flex justify-center items-center h-64 bg-card-bg rounded-lg">
            <div className="text-text-secondary">Loading projections...</div>
        </div>
    );
  }

  const data = projectionData[view];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        {/* Currency Selection */}
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-600 font-medium">Display Currency:</p>
          <select
            value={projectionDisplayCurrency}
            onChange={(e) => setProjectionDisplayCurrency(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
          >
            {settings.availableCurrencies.map(c => (
              <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
            ))}
          </select>
        </div>

        {/* View Selection */}
        <div className="flex space-x-1 bg-background p-1 rounded-lg">
          <button onClick={() => setView('weekly')} className={`px-3 py-1 text-sm rounded-md transition-colors ${view === 'weekly' ? 'bg-accent-green text-black font-semibold' : 'bg-transparent text-text-secondary hover:bg-white/10'}`}>Weekly</button>
          <button onClick={() => setView('monthly')} className={`px-3 py-1 text-sm rounded-md transition-colors ${view === 'monthly' ? 'bg-accent-green text-black font-semibold' : 'bg-transparent text-text-secondary hover:bg-white/10'}`}>Monthly</button>
          <button onClick={() => setView('yearly')} className={`px-3 py-1 text-sm rounded-md transition-colors ${view === 'yearly' ? 'bg-accent-green text-black font-semibold' : 'bg-transparent text-text-secondary hover:bg-white/10'}`}>Yearly</button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-background">
            <tr>
              <th className="p-4 font-semibold text-text-secondary uppercase tracking-wider">Period</th>
              <th className="p-4 font-semibold text-text-secondary uppercase tracking-wider text-right">Costs</th>
              <th className="p-4 font-semibold text-text-secondary uppercase tracking-wider text-right">Income</th>
              <th className="p-4 font-semibold text-text-secondary uppercase tracking-wider text-right">Net Change</th>
              <th className="p-4 font-semibold text-text-secondary uppercase tracking-wider text-right">End Capital</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((proj) => (
              <tr key={proj.period} className="hover:bg-background transition-colors">
                <td className="p-4 text-text-primary whitespace-nowrap">{proj.period}</td>
                <td className="p-4 text-red-400 font-mono text-right whitespace-nowrap">-{new Intl.NumberFormat('en-US', { style: 'currency', currency: projectionDisplayCurrency }).format(proj.costs)}</td>
                <td className="p-4 text-accent-green font-mono text-right whitespace-nowrap">+{new Intl.NumberFormat('en-US', { style: 'currency', currency: projectionDisplayCurrency }).format(proj.income)}</td>
                <td className={`p-4 font-mono text-right whitespace-nowrap ${proj.netChange >= 0 ? 'text-accent-green' : 'text-red-400'}`}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: projectionDisplayCurrency, signDisplay: 'always' }).format(proj.netChange)}</td>
                <td className="p-4 text-text-primary font-semibold font-mono text-right whitespace-nowrap">{new Intl.NumberFormat('en-US', { style: 'currency', currency: projectionDisplayCurrency }).format(proj.endCapital)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 