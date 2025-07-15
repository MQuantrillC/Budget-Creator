'use client';

import { useState, useMemo } from 'react';
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
    timeframe,
    projectionDisplayCurrency, 
    setProjectionDisplayCurrency,
    startingCapitalCurrency 
  } = useBudget();
  const [view, setView] = useState('monthly'); // monthly, weekly, yearly
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const getTimeframePeriods = () => {
    switch (timeframe) {
      case '6M': return 6;
      case '1Y': return 12;
      case '2Y': return 24;
      case '3Y': return 36;
      default: return 12;
    }
  };

  // Get all unique categories from costs and income
  const allCategories = useMemo(() => {
    const costCategories = costs.map(cost => cost.description);
    const incomeCategories = income.map(inc => inc.description);
    return [...new Set([...costCategories, ...incomeCategories])].sort();
  }, [costs, income]);

  // Filter costs and income based on selected category
  const filteredCosts = useMemo(() => {
    if (selectedCategory === 'all') return costs;
    return costs.filter(cost => cost.description === selectedCategory);
  }, [costs, selectedCategory]);

  const filteredIncome = useMemo(() => {
    if (selectedCategory === 'all') return income;
    return income.filter(inc => inc.description === selectedCategory);
  }, [income, selectedCategory]);

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
      filteredCosts.forEach(cost => {
        const costAmount = convertToDisplayCurrency(cost.amount, cost.currency);
        switch (cost.category) {
          case 'monthly': periodCosts += periodType === 'monthly' ? costAmount : (periodType === 'weekly' ? costAmount / 4.33 : costAmount * 12); break;
          case 'weekly': periodCosts += periodType === 'weekly' ? costAmount : (periodType === 'monthly' ? costAmount * 4.33 : costAmount * 52); break;
          case 'biweekly': periodCosts += periodType === 'weekly' ? costAmount / 2 : (periodType === 'monthly' ? costAmount * 2.17 : costAmount * 26); break;
          case 'semiannually': periodCosts += periodType === 'monthly' ? costAmount / 6 : (periodType === 'weekly' ? costAmount / 26 : costAmount * 2); break;
          case 'yearly': periodCosts += periodType === 'yearly' ? costAmount : (periodType === 'monthly' ? costAmount / 12 : costAmount / 52); break;
          case 'one-time': if (cost.date && isWithinInterval(new Date(cost.date), interval)) { periodCosts += costAmount; } break;
        }
      });

      let periodIncome = 0;
      filteredIncome.forEach(inc => {
        const incomeAmount = convertToDisplayCurrency(inc.amount, inc.currency);
        switch (inc.category) {
            case 'monthly': periodIncome += periodType === 'monthly' ? incomeAmount : (periodType === 'weekly' ? incomeAmount / 4.33 : incomeAmount * 12); break;
            case 'weekly': periodIncome += periodType === 'weekly' ? incomeAmount : (periodType === 'monthly' ? incomeAmount * 4.33 : incomeAmount * 52); break;
            case 'biweekly': periodIncome += periodType === 'weekly' ? incomeAmount / 2 : (periodType === 'monthly' ? incomeAmount * 2.17 : incomeAmount * 26); break;
            case 'semiannually': periodIncome += periodType === 'monthly' ? incomeAmount / 6 : (periodType === 'weekly' ? incomeAmount / 26 : incomeAmount * 2); break;
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
    weekly: calculateProjections('weekly', Math.min(52, getTimeframePeriods() * 4)), // Cap at 52 weeks
    monthly: calculateProjections('monthly', getTimeframePeriods()),
    yearly: calculateProjections('yearly', Math.min(5, Math.ceil(getTimeframePeriods() / 12))), // Cap at 5 years
  };

  if (!exchangeRates) {
    return (
        <div className="flex justify-center items-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-gray-600 dark:text-gray-400">Loading projections...</div>
        </div>
    );
  }

  const data = projectionData[view];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        {/* Currency and Category Selection */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
          <div className="flex items-center space-x-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Display Currency:</p>
            <select
              value={projectionDisplayCurrency}
              onChange={(e) => setProjectionDisplayCurrency(e.target.value)}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 font-medium text-gray-900 dark:text-gray-100"
            >
              {settings.availableCurrencies.map(c => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Category Filter:</p>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 font-medium text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Categories</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Selection */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button 
            onClick={() => setView('weekly')} 
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'weekly' ? 'bg-green-500 text-white font-semibold' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setView('monthly')} 
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'monthly' ? 'bg-green-500 text-white font-semibold' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setView('yearly')} 
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'yearly' ? 'bg-green-500 text-white font-semibold' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            Yearly
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Period</th>
              <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-right">Costs</th>
              <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-right">Income</th>
              <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-right">Net Change</th>
              <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-right">End Capital</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((proj) => (
              <tr key={proj.period} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="p-4 text-gray-900 dark:text-gray-100 whitespace-nowrap">{proj.period}</td>
                <td className="p-4 text-red-600 dark:text-red-400 font-mono text-right whitespace-nowrap">-{new Intl.NumberFormat('en-US', { style: 'currency', currency: projectionDisplayCurrency }).format(proj.costs)}</td>
                <td className="p-4 text-green-600 dark:text-green-400 font-mono text-right whitespace-nowrap">+{new Intl.NumberFormat('en-US', { style: 'currency', currency: projectionDisplayCurrency }).format(proj.income)}</td>
                <td className={`p-4 font-mono text-right whitespace-nowrap ${proj.netChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: projectionDisplayCurrency, signDisplay: 'always' }).format(proj.netChange)}</td>
                <td className="p-4 text-gray-900 dark:text-gray-100 font-semibold font-mono text-right whitespace-nowrap">{new Intl.NumberFormat('en-US', { style: 'currency', currency: projectionDisplayCurrency }).format(proj.endCapital)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 