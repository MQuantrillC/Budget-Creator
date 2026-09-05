'use client';

import { useState, useMemo } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { addWeeks, addMonths, addYears, format } from 'date-fns';
import { getLoanMonthlyPayment, isLoanActiveDuring } from '@/utils/loanCalculations';
import { formatMoney } from '@/utils/budgetMath';

export default function ProjectionsTable() {
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
  const [view, setView] = useState('monthly'); // monthly, weekly, yearly
  const [selectedCategory, setSelectedCategory] = useState('all');

  const convertToBaseCurrency = (amount, currency) => {
    if (!exchangeRates || currency === settings.baseCurrency) return amount;
    const rate = exchangeRates[currency];
    return rate ? amount / rate : amount;
  };

  const convertToDisplayCurrency = (amount, fromCurrency) => {
    if (!exchangeRates || fromCurrency === projectionDisplayCurrency) return amount;

    const baseAmount = convertToBaseCurrency(amount, fromCurrency);

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

  const calculateProjections = (periodType, periods) => {
    const projections = [];

    const startingCapitalInBase = convertToBaseCurrency(currentCapital, startingCapitalCurrency);
    const startingCapitalInDisplay = convertToDisplayCurrency(startingCapitalInBase, settings.baseCurrency);
    let runningCapital = startingCapitalInDisplay;

    const sDate = new Date(startDate + 'T12:00:00'); // Parse as local time to avoid timezone issues

    for (let i = 0; i < periods; i++) {
      let periodStart, periodEnd;
      let periodLabel;

      if (periodType === 'weekly') {
        periodStart = addWeeks(sDate, i);
        periodEnd = addWeeks(sDate, i + 1);
        periodLabel = `Week of ${format(periodStart, 'MMM d, yyyy')}`;
      } else if (periodType === 'monthly') {
        periodStart = addMonths(sDate, i);
        periodEnd = addMonths(sDate, i + 1);
        periodLabel = format(periodStart, 'MMMM yyyy');
      } else { // yearly
        periodStart = addYears(sDate, i);
        periodEnd = addYears(sDate, i + 1);
        periodLabel = format(periodStart, 'yyyy');
      }

      const interval = { start: periodStart, end: periodEnd };

      let periodCosts = 0;
      filteredCosts.forEach(cost => {
        const costAmount = convertToDisplayCurrency(cost.amount, cost.currency);
        switch (cost.category) {
          case 'monthly': periodCosts += periodType === 'monthly' ? costAmount : (periodType === 'weekly' ? costAmount * 12 / 52 : costAmount * 12); break;
          case 'weekly': periodCosts += periodType === 'weekly' ? costAmount : (periodType === 'monthly' ? costAmount * 52 / 12 : costAmount * 52); break;
          case 'biweekly': periodCosts += periodType === 'weekly' ? costAmount / 2 : (periodType === 'monthly' ? costAmount * 26 / 12 : costAmount * 26); break;
          case 'semiannually': periodCosts += periodType === 'monthly' ? costAmount / 6 : (periodType === 'weekly' ? costAmount / 26 : costAmount * 2); break;
          case 'yearly': periodCosts += periodType === 'yearly' ? costAmount : (periodType === 'monthly' ? costAmount / 12 : costAmount / 52); break;
          case 'one-time':
            if (cost.date && cost.date.trim() !== '') {
              const costDate = new Date(cost.date + 'T12:00:00');
              if (costDate >= interval.start && costDate < interval.end) {
                periodCosts += costAmount;
              }
            }
            break;
        }
      });

      // Loan payments only while the loan is still being repaid
      loans.forEach(loan => {
        if (isLoanActiveDuring(loan, interval.start, interval.end)) {
          const monthlyPayment = getLoanMonthlyPayment(loan);
          const loanPaymentInDisplay = convertToDisplayCurrency(monthlyPayment, loan.currency);

          if (periodType === 'monthly') {
            periodCosts += loanPaymentInDisplay;
          } else if (periodType === 'weekly') {
            periodCosts += loanPaymentInDisplay * 12 / 52;
          } else { // yearly
            periodCosts += loanPaymentInDisplay * 12;
          }
        }
      });

      let periodIncome = 0;
      filteredIncome.forEach(inc => {
        const incomeAmount = convertToDisplayCurrency(inc.amount, inc.currency);
        switch (inc.category) {
            case 'monthly': periodIncome += periodType === 'monthly' ? incomeAmount : (periodType === 'weekly' ? incomeAmount * 12 / 52 : incomeAmount * 12); break;
            case 'weekly': periodIncome += periodType === 'weekly' ? incomeAmount : (periodType === 'monthly' ? incomeAmount * 52 / 12 : incomeAmount * 52); break;
            case 'biweekly': periodIncome += periodType === 'weekly' ? incomeAmount / 2 : (periodType === 'monthly' ? incomeAmount * 26 / 12 : incomeAmount * 26); break;
            case 'semiannually': periodIncome += periodType === 'monthly' ? incomeAmount / 6 : (periodType === 'weekly' ? incomeAmount / 26 : incomeAmount * 2); break;
            case 'yearly': periodIncome += periodType === 'yearly' ? incomeAmount : (periodType === 'monthly' ? incomeAmount / 12 : incomeAmount / 52); break;
            case 'one-time':
              if (inc.date && inc.date.trim() !== '') {
                const incomeDate = new Date(inc.date + 'T12:00:00');
                if (incomeDate >= interval.start && incomeDate < interval.end) {
                  periodIncome += incomeAmount;
                }
              }
              break;
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
        <div className="flex justify-center items-center h-64 bg-card-deep rounded">
            <div className="ledger-label">Loading projections…</div>
        </div>
    );
  }

  const data = projectionData[view];

  const viewButton = (key, label) => (
    <button
      onClick={() => setView(key)}
      className={`px-3 py-1.5 text-xs font-ledger uppercase tracking-wider rounded-sm transition-colors ${
        view === key
          ? 'bg-credit text-[#f7f3e6] font-semibold'
          : 'bg-transparent text-ink-soft hover:bg-card-deep'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        {/* Currency and category selection */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-x-8">
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

        {/* View selection */}
        <div className="flex space-x-1 bg-card-deep border border-line p-1 rounded">
          {viewButton('weekly', 'Weekly')}
          {viewButton('monthly', 'Monthly')}
          {viewButton('yearly', 'Yearly')}
        </div>
      </div>

      <p className="sm:hidden ledger-figure text-[10px] text-ink-faint text-center mb-2">
        &larr; swipe table sideways to see all columns &rarr;
      </p>
      <div className="overflow-x-auto">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Period</th>
              <th className="text-right">Costs</th>
              <th className="text-right">Income</th>
              <th className="text-right">Net Change</th>
              <th className="text-right">End Capital</th>
            </tr>
          </thead>
          <tbody>
            {data.map((proj) => (
              <tr key={proj.period}>
                <td className="whitespace-nowrap">{proj.period}</td>
                <td className="ledger-figure text-debit text-right whitespace-nowrap">-{formatMoney(proj.costs, projectionDisplayCurrency)}</td>
                <td className="ledger-figure text-credit-deep text-right whitespace-nowrap">+{formatMoney(proj.income, projectionDisplayCurrency)}</td>
                <td className={`ledger-figure text-right whitespace-nowrap ${proj.netChange >= 0 ? 'text-credit-deep' : 'text-debit'}`}>{formatMoney(proj.netChange, projectionDisplayCurrency, { signDisplay: 'always' })}</td>
                <td className="ledger-figure font-semibold text-right whitespace-nowrap">{formatMoney(proj.endCapital, projectionDisplayCurrency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
