'use client';

import { useMemo, useState, useCallback } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from 'recharts';
import { useBudget } from '@/context/BudgetContext';
import { addMonths, format } from 'date-fns';
import { getLoanMonthlyPayment, isLoanActiveDuring } from '@/utils/loanCalculations';
import { formatMoney } from '@/utils/budgetMath';

const CHART_COLORS = {
  capital: '#2e6b4e',   // credit green
  income: '#2e6b4e',
  costs: '#a03d2c',     // debit red
};

const CustomTooltip = ({ active, payload, label, currency }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 ledger-card">
          <p className="ledger-label mb-1">{`${label}`}</p>
          {payload.map((pld, index) => (
            <p key={`${pld.dataKey}-${index}`} style={{ color: pld.color }} className="ledger-figure text-sm">
              {`${pld.name}: ${formatMoney(pld.value, currency)}`}
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
        loans,
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

        const baseAmount = convertToBaseCurrency(amount, fromCurrency);

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

    // All unique categories from costs and income
    const allCategories = useMemo(() => {
        const costCategories = costs.map(cost => cost.description);
        const incomeCategories = income.map(inc => inc.description);
        return [...new Set([...costCategories, ...incomeCategories])].sort();
    }, [costs, income]);

    const filteredCosts = useMemo(() => {
        if (selectedCategory === 'all') return costs;
        return costs.filter(cost => cost.description === selectedCategory);
    }, [costs, selectedCategory]);

    const filteredIncome = useMemo(() => {
        if (selectedCategory === 'all') return income;
        return income.filter(inc => inc.description === selectedCategory);
    }, [income, selectedCategory]);

    const projectionData = useMemo(() => {
        // Starting capital in display currency
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
                if (cost.category === 'weekly') return acc + costAmount * (52 / 12);
                if (cost.category === 'biweekly') return acc + costAmount * (26 / 12);
                if (cost.category === 'semiannually') return acc + costAmount / 6;
                if (cost.category === 'yearly') return acc + costAmount / 12;
                if (cost.category === 'one-time' && cost.date && cost.date.trim() !== '') {
                    const costDate = new Date(cost.date + 'T12:00:00');
                    if (costDate >= interval.start && costDate < interval.end) {
                        return acc + costAmount;
                    }
                }
                return acc;
            }, 0);

            // Loan payments only while the loan is still being repaid
            const monthlyLoanPayments = loans.reduce((acc, loan) => {
                if (isLoanActiveDuring(loan, interval.start, interval.end)) {
                    const monthlyPayment = getLoanMonthlyPayment(loan);
                    return acc + convertToDisplayCurrency(monthlyPayment, loan.currency);
                }
                return acc;
            }, 0);

            monthlyCosts += monthlyLoanPayments;

            let monthlyIncome = filteredIncome.reduce((acc, inc) => {
                const incomeAmount = convertToDisplayCurrency(inc.amount, inc.currency);
                if (inc.category === 'monthly') return acc + incomeAmount;
                if (inc.category === 'weekly') return acc + incomeAmount * (52 / 12);
                if (inc.category === 'biweekly') return acc + incomeAmount * (26 / 12);
                if (inc.category === 'semiannually') return acc + incomeAmount / 6;
                if (inc.category === 'yearly') return acc + incomeAmount / 12;
                if (inc.category === 'one-time' && inc.date && inc.date.trim() !== '') {
                    const incomeDate = new Date(inc.date + 'T12:00:00');
                    if (incomeDate >= interval.start && incomeDate < interval.end) {
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
    }, [filteredCosts, filteredIncome, loans, currentCapital, startDate, startingCapitalCurrency, settings.baseCurrency, convertToBaseCurrency, convertToDisplayCurrency, getTimeframePeriods]);


    if (!exchangeRates) {
        return (
            <div className="flex justify-center items-center h-64 bg-card-deep rounded">
                <div className="ledger-label">Loading charts…</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Currency and category selection */}
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-x-8 mb-6">
                <div className="flex items-center space-x-3">
                    <p className="ledger-label">Display Currency</p>
                    <select
                        value={projectionDisplayCurrency}
                        onChange={(e) => setProjectionDisplayCurrency(e.target.value)}
                        className="ledger-input !w-auto"
                    >
                        {settings.availableCurrencies.map(c => (
                            <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center space-x-3">
                    <p className="ledger-label">Category Filter</p>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="ledger-input !w-auto"
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
                    <Tooltip content={<CustomTooltip currency={projectionDisplayCurrency} />} cursor={{ fill: 'rgba(46, 107, 78, 0.08)' }}/>
                    <Legend wrapperStyle={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: 'var(--font-plex-mono)' }} />
                    <Line type="monotone" dataKey="Capital" stroke={CHART_COLORS.capital} strokeWidth={2} activeDot={{ r: 7, fill: CHART_COLORS.capital }} dot={{ r: 3, fill: CHART_COLORS.capital }} />
                </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-secondary)" tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                    <Tooltip content={<CustomTooltip currency={projectionDisplayCurrency} />} cursor={{ fill: 'rgba(46, 107, 78, 0.08)' }}/>
                    <Legend wrapperStyle={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: 'var(--font-plex-mono)' }} />
                    <Bar dataKey="Costs" fill={CHART_COLORS.costs} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Income" fill={CHART_COLORS.income} radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
