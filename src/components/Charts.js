'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from 'recharts';
import { useBudget } from '@/context/BudgetContext';
import { addMonths, format, isWithinInterval } from 'date-fns';

const CustomTooltip = ({ active, payload, label, currency }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-card-bg rounded-lg shadow-lg border border-border">
          <p className="label font-bold text-text-primary">{`${label}`}</p>
          {payload.map((pld, index) => (
            <p key={`${pld.dataKey}-${index}`} style={{ color: pld.color }} className="text-sm">
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
        projectionDisplayCurrency, 
        setProjectionDisplayCurrency,
        startingCapitalCurrency 
    } = useBudget();

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

    const projectionData = useMemo(() => {
        // Convert starting capital to display currency
        const startingCapitalInBase = convertToBaseCurrency(currentCapital, startingCapitalCurrency);
        const startingCapitalInDisplay = convertToDisplayCurrency(startingCapitalInBase, settings.baseCurrency);
        let runningCapital = startingCapitalInDisplay;
        
        const sDate = new Date(startDate);

        return Array.from({ length: 12 }).map((_, i) => {
            const periodDate = addMonths(sDate, i);
            const interval = { start: periodDate, end: addMonths(sDate, i + 1) };

            let monthlyCosts = costs.reduce((acc, cost) => {
                const costAmount = convertToDisplayCurrency(cost.amount, cost.currency);
                if (cost.category === 'monthly') return acc + costAmount;
                if (cost.category === 'weekly') return acc + costAmount * 4.33;
                if (cost.category === 'yearly') return acc + costAmount / 12;
                if (cost.category === 'one-time' && cost.date && isWithinInterval(new Date(cost.date), interval)) return acc + costAmount;
                return acc;
            }, 0);

            let monthlyIncome = income.reduce((acc, inc) => {
                const incomeAmount = convertToDisplayCurrency(inc.amount, inc.currency);
                if (inc.category === 'monthly') return acc + incomeAmount;
                if (inc.category === 'biweekly') return acc + incomeAmount * 2;
                if (inc.category === 'weekly') return acc + incomeAmount * 4.33;
                if (inc.category === 'yearly') return acc + incomeAmount / 12;
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
    }, [costs, income, currentCapital, exchangeRates, startDate, projectionDisplayCurrency, startingCapitalCurrency, settings.baseCurrency, convertToBaseCurrency, convertToDisplayCurrency]);


    if (!exchangeRates) {
        return (
            <div className="flex justify-center items-center h-64 bg-card-bg rounded-lg">
                <div className="text-text-secondary">Loading charts...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Currency Selection */}
            <div className="flex justify-center items-center space-x-2 mb-6">
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

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="var(--color-text-secondary)" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--color-text-secondary)" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                    <Tooltip content={<CustomTooltip currency={projectionDisplayCurrency} />} cursor={{ fill: 'rgba(52, 211, 153, 0.1)' }}/>
                    <Legend wrapperStyle={{ fontSize: "14px" }} />
                    <Line type="monotone" dataKey="Capital" stroke="var(--color-accent-green)" strokeWidth={2} activeDot={{ r: 8, fill: 'var(--color-accent-green)' }} dot={{ r: 3, fill: 'var(--color-accent-green)' }} />
                </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="var(--color-text-secondary)" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--color-text-secondary)" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                    <Tooltip content={<CustomTooltip currency={projectionDisplayCurrency} />} cursor={{ fill: 'rgba(52, 211, 153, 0.1)' }}/>
                    <Legend wrapperStyle={{ fontSize: "14px" }} />
                    <Bar dataKey="Costs" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Income" fill="var(--color-accent-green)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
} 