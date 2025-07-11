'use client';

import { useBudget } from '@/context/BudgetContext';
import ProjectionsTable from '@/components/ProjectionsTable';
import Charts from '@/components/Charts';
import Tooltip from '@/components/Tooltip';

export default function HomePage() {
  const { costs, income, currentCapital, settings, exchangeRates } = useBudget();

  const convertTo_BaseCurrency = (amount, currency) => {
    if (!exchangeRates || currency === settings.baseCurrency) {
      return amount;
    }
    // The API gives rates from the base currency. To convert TO the base, we need to divide.
    // Let's assume the free API doesn't support converting from any currency, just from the base.
    // A better API would allow converting from any currency to any other.
    // For now, this is a limitation we'll accept.
    // The rates are given as 1 BASE = X OTHER. So amount in OTHER / X = amount in BASE
    const rate = exchangeRates[currency];
    return rate ? amount / rate : amount;
  }

  // Basic calculation for total monthly costs
  const totalMonthlyCosts = costs
    .filter(cost => cost.category === 'monthly')
    .reduce((acc, cost) => acc + convertTo_BaseCurrency(cost.amount, cost.currency), 0);

  // Basic calculation for total monthly income
  const totalMonthlyIncome = income
    .filter(inc => inc.category === 'monthly')
    .reduce((acc, inc) => acc + convertTo_BaseCurrency(inc.amount, inc.currency), 0);
  
  const burnRate = totalMonthlyIncome - totalMonthlyCosts;

  if (!exchangeRates) {
    return <div>Loading exchange rates...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <Tooltip text="The total capital you currently have.">
            <h2 className="text-lg font-semibold text-gray-700">Current Capital</h2>
          </Tooltip>
          <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(currentCapital)}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <Tooltip text="Total of all recurring monthly costs, converted to your base currency.">
            <h2 className="text-lg font-semibold text-gray-700">Total Monthly Costs</h2>
          </Tooltip>
          <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(totalMonthlyCosts)}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <Tooltip text="Total of all recurring monthly income, converted to your base currency.">
            <h2 className="text-lg font-semibold text-gray-700">Total Monthly Income</h2>
          </Tooltip>
          <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(totalMonthlyIncome)}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <Tooltip text="The difference between your monthly income and monthly costs (surplus or deficit).">
            <h2 className="text-lg font-semibold text-gray-700">Monthly Burn Rate</h2>
          </Tooltip>
          <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(burnRate)}</p>
        </div>
      </div>
      <Charts />
      <ProjectionsTable />
    </div>
  );
} 