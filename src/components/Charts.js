'use client';

import { useMemo, useState, useCallback } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from 'recharts';
import { useBudget } from '@/context/BudgetContext';
import { addMonths, format } from 'date-fns';

const CustomTooltip = ({ active, payload, label, currency }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="label font-bold text-gray-900 dark:text-gray-100">{`${label}`}</p>
          {payload.map((pld, index) => (
            <p key={`${pld.dataKey}-${index}`} style={{ color: pld.color }} className="text-sm text-gray-700 dark:text-gray-300">
              {`${pld.name}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(pld.value)}`}
            </p>
          ))}
        </div>
      );
    }
  
    return null;
};

export default function Charts() {
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

    const [selectedCategory, setSelectedCategory] = useState('all');

    const convertToBaseCurrency = useCallback((amount, currency) => {
        if (!exchangeRates || currency === settings.baseCurrency) return amount;
        const rate = exchangeRates[currency];
        return rate ? amount / rate : amount;
    }, [exchangeRates, settings.baseCurrency]);

    const convertToDisplayCurrency = useCallback((amount, fromCurrency) => {
        if (!exchangeRates || fromCurrency === projectionDisplayCurrency) return amount;
        
        // First convert to base currency
        const baseAmount = convertToBaseCurrency(amount, fromCurrency);
        
        // Then convert to display currency
        if (projectionDisplayCurrency === settings.baseCurrency) return baseAmount;
        const displayRate = exchangeRates[projectionDisplayCurrency];
        return displayRate ? baseAmount * displayRate : baseAmount;
    }, [exchangeRates, projectionDisplayCurrency, convertToBaseCurrency, settings.baseCurrency]);

    const getTimeframePeriods = useCallback(() => {
        switch (timeframe) {
            case '6M': return 6;
            case '1Y': return 12;
            case '2Y': return 24;
            case '3Y': return 36;
            default: return 12;
        }
    }, [timeframe]);

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

    const projectionData = useMemo(() => {
        // Convert starting capital to display currency
        const startingCapitalInBase = convertToBaseCurrency(currentCapital, startingCapitalCurrency);
        const startingCapitalInDisplay = convertToDisplayCurrency(startingCapitalInBase, settings.baseCurrency);
        let runningCapital = startingCapitalInDisplay;
        
        const sDate = new Date(startDate + 'T12:00:00'); // Parse as local time to avoid timezone issues
        const periods = getTimeframePeriods();

        return Array.from({ length: periods }).map((_, i) => {
            const periodDate = addMonths(sDate, i);
            const interval = { start: periodDate, end: addMonths(sDate, i + 1) };

            let monthlyCosts = filteredCosts.reduce((acc, cost) => {
                const costAmount = convertToDisplayCurrency(cost.amount, cost.currency);
                if (cost.category === 'monthly') return acc + costAmount;
                if (cost.category === 'weekly') return acc + costAmount * 4.33;
                if (cost.category === 'biweekly') return acc + costAmount * 2.17; // Biweekly = 2.17 times per month
                if (cost.category === 'semiannually') return acc + costAmount / 6; // Semiannually = 1/6 per month
                if (cost.category === 'yearly') return acc + costAmount / 12;
                if (cost.category === 'one-time' && cost.date && cost.date.trim() !== '') {
                    const costDate = new Date(cost.date + 'T12:00:00'); // Add time to avoid timezone issues
                    const intervalStart = new Date(interval.start);
                    const intervalEnd = new Date(interval.end);
                    
                    // For one-time expenses, check if the date falls within the current period
                    // Use explicit date comparison: date >= start AND date < end
                    if (costDate >= intervalStart && costDate < intervalEnd) {
                        return acc + costAmount;
                    }
                }
                return acc;
            }, 0);

            let monthlyIncome = filteredIncome.reduce((acc, inc) => {
                const incomeAmount = convertToDisplayCurrency(inc.amount, inc.currency);
                if (inc.category === 'monthly') return acc + incomeAmount;
                if (inc.category === 'weekly') return acc + incomeAmount * 4.33;
                if (inc.category === 'biweekly') return acc + incomeAmount * 2.17; // Biweekly = 2.17 times per month
                if (inc.category === 'semiannually') return acc + incomeAmount / 6; // Semiannually = 1/6 per month
                if (inc.category === 'yearly') return acc + incomeAmount / 12;
                if (inc.category === 'one-time' && inc.date && inc.date.trim() !== '') {
                    const incomeDate = new Date(inc.date + 'T12:00:00'); // Add time to avoid timezone issues
                    const intervalStart = new Date(interval.start);
                    const intervalEnd = new Date(interval.end);
                    
                    // For one-time income, check if the date falls within the current period
                    // Use explicit date comparison: date >= start AND date < end
                    if (incomeDate >= intervalStart && incomeDate < intervalEnd) {
                        return acc + incomeAmount;
                    }
                }
                return acc;
            }, 0);

            runningCapital += (monthlyIncome - monthlyCosts);

            return {
                name: format(periodDate, 'MMM yy'),
                Capital: runningCapital,
                Costs: monthlyCosts,
                Income: monthlyIncome,
            };
        });
    }, [filteredCosts, filteredIncome, currentCapital, startDate, startingCapitalCurrency, settings.baseCurrency, convertToBaseCurrency, convertToDisplayCurrency, getTimeframePeriods]);


    if (!exchangeRates) {
        return (
            <div className="flex justify-center items-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-gray-600 dark:text-gray-400">Loading charts...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Currency and Category Selection */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-6">
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

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-secondary)" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                    <Tooltip content={<CustomTooltip currency={projectionDisplayCurrency} />} cursor={{ fill: 'rgba(52, 211, 153, 0.1)' }}/>
                    <Legend wrapperStyle={{ fontSize: "14px", color: "var(--text-secondary)" }} />
                    <Line type="monotone" dataKey="Capital" stroke="var(--color-green-500)" strokeWidth={2} activeDot={{ r: 8, fill: 'var(--color-green-500)' }} dot={{ r: 3, fill: 'var(--color-green-500)' }} />
                </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-secondary)" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                    <Tooltip content={<CustomTooltip currency={projectionDisplayCurrency} />} cursor={{ fill: 'rgba(52, 211, 153, 0.1)' }}/>
                    <Legend wrapperStyle={{ fontSize: "14px", color: "var(--text-secondary)" }} />
                    <Bar dataKey="Costs" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Income" fill="var(--color-green-500)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
} 