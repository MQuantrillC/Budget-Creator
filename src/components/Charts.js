'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from 'recharts';
import { useBudget } from '@/context/BudgetContext';
import { addMonths, format } from 'date-fns';

export default function Charts() {
    const { costs, income, currentCapital, settings, exchangeRates, startDate } = useBudget();

    const convertToBaseCurrency = (amount, currency) => {
        if (!exchangeRates || currency === settings.baseCurrency) return amount;
        const rate = exchangeRates[currency];
        return rate ? amount / rate : amount;
    };

    const projectionData = useMemo(() => {
        let runningCapital = currentCapital;
        const sDate = new Date(startDate);

        return Array.from({ length: 12 }).map((_, i) => {
            const periodDate = addMonths(sDate, i);
            const interval = { start: periodDate, end: addMonths(sDate, i + 1) };

            let monthlyCosts = costs.reduce((acc, cost) => {
                const costAmount = convertToBaseCurrency(cost.amount, cost.currency);
                if (cost.category === 'monthly') return acc + costAmount;
                if (cost.category === 'weekly') return acc + costAmount * 4.33;
                if (cost.category === 'yearly') return acc + costAmount / 12;
                if (cost.category === 'one-time' && cost.date && isWithinInterval(new Date(cost.date), interval)) return acc + costAmount;
                return acc;
            }, 0);

            let monthlyIncome = income.reduce((acc, inc) => {
                const incomeAmount = convertToBaseCurrency(inc.amount, inc.currency);
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
    }, [costs, income, currentCapital, exchangeRates, startDate, settings.baseCurrency]);


    if (!exchangeRates) {
        return <div className="p-4 bg-white rounded-lg shadow mt-8">Loading charts...</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Capital Over Time</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Capital" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Costs vs. Income</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Costs" fill="#ef4444" />
                        <Bar dataKey="Income" fill="#22c55e" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
} 