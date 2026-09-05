'use client';

import { useBudget } from '@/context/BudgetContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { TrendingDown, TrendingUp, PieChart } from 'lucide-react';
import { getLoanMonthlyPayment } from '@/utils/loanCalculations';
import { makeConverters, toYearlyAmount, formatMoney } from '@/utils/budgetMath';

export default function PercentageBreakdown() {
  const { costs, income, loans, settings, exchangeRates } = useBudget();

  const { toBase } = makeConverters(exchangeRates, settings.baseCurrency);

  const calculateYearlyAmount = (item) =>
    toYearlyAmount(toBase(item.amount, item.currency), item.category);

  const expensesWithYearlyAmounts = costs.map(cost => ({
    ...cost,
    yearlyAmount: calculateYearlyAmount(cost)
  }));

  // Loan payments count as expenses
  const loanExpenses = loans.map(loan => {
    const monthlyPayment = getLoanMonthlyPayment(loan);
    const yearlyAmount = toBase(monthlyPayment * 12, loan.currency);
    return {
      id: `loan-${loan.id}`,
      description: `${loan.name} (Loan Payment)`,
      category: 'loan',
      yearlyAmount,
      currency: loan.currency
    };
  });

  const allExpensesWithYearlyAmounts = [...expensesWithYearlyAmounts, ...loanExpenses];

  const incomeWithYearlyAmounts = income.map(inc => ({
    ...inc,
    yearlyAmount: calculateYearlyAmount(inc)
  }));

  const totalYearlyExpenses = allExpensesWithYearlyAmounts.reduce((sum, expense) => sum + expense.yearlyAmount, 0);
  const totalYearlyIncome = incomeWithYearlyAmounts.reduce((sum, inc) => sum + inc.yearlyAmount, 0);

  const expensePercentages = allExpensesWithYearlyAmounts
    .map(expense => ({
      ...expense,
      percentage: totalYearlyExpenses > 0 ? (expense.yearlyAmount / totalYearlyExpenses) * 100 : 0
    }))
    .sort((a, b) => b.yearlyAmount - a.yearlyAmount);

  const incomePercentages = incomeWithYearlyAmounts
    .map(inc => ({
      ...inc,
      percentage: totalYearlyIncome > 0 ? (inc.yearlyAmount / totalYearlyIncome) * 100 : 0
    }))
    .sort((a, b) => b.yearlyAmount - a.yearlyAmount);

  if (!exchangeRates) {
    return (
      <div className="flex justify-center items-center h-32 bg-card-deep rounded">
        <div className="ledger-label">Loading breakdown…</div>
      </div>
    );
  }

  const breakdownRow = (item, barColor, textColor) => (
    <div key={item.id} className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink text-sm truncate">{item.description}</p>
          <p className="ledger-figure text-[11px] text-ink-faint uppercase tracking-wide">{item.category}</p>
        </div>
        <div className="text-right ml-4">
          <p className={`ledger-figure text-sm font-semibold ${textColor}`}>
            {item.percentage.toFixed(1)}%
          </p>
          <p className="ledger-figure text-xs text-ink-soft">
            {formatMoney(item.yearlyAmount, settings.baseCurrency)}
          </p>
        </div>
      </div>
      <div className="w-full bg-card-deep border border-line rounded-sm h-2 overflow-hidden">
        <div
          className={`${barColor} h-full transition-all duration-300`}
          style={{ width: `${item.percentage}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-2 mb-2">
            <PieChart className="h-5 w-5 text-inkblue" />
            <h2 className="font-display text-3xl font-semibold text-ink">Percentage Breakdown</h2>
          </div>
          <p className="text-ink-soft">Annual expense and income distribution</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses */}
          <Card>
            <CardHeader className="!pb-3">
              <CardTitle className="!text-xl flex items-center">
                <TrendingDown className="h-5 w-5 text-debit mr-2" />
                Expense Distribution
              </CardTitle>
              <div className="ledger-figure text-sm text-ink-soft mt-1">
                Total Annual: {formatMoney(totalYearlyExpenses, settings.baseCurrency)}
              </div>
            </CardHeader>
            <CardContent>
              {expensePercentages.length > 0 ? (
                <div className="space-y-4">
                  {expensePercentages.map((expense) => breakdownRow(expense, 'bg-debit', 'text-debit'))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingDown className="h-6 w-6 text-ink-faint mx-auto mb-3" />
                  <p className="text-ink-soft text-sm">No expenses to analyze.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income */}
          <Card>
            <CardHeader className="!pb-3">
              <CardTitle className="!text-xl flex items-center">
                <TrendingUp className="h-5 w-5 text-credit-deep mr-2" />
                Income Distribution
              </CardTitle>
              <div className="ledger-figure text-sm text-ink-soft mt-1">
                Total Annual: {formatMoney(totalYearlyIncome, settings.baseCurrency)}
              </div>
            </CardHeader>
            <CardContent>
              {incomePercentages.length > 0 ? (
                <div className="space-y-4">
                  {incomePercentages.map((inc) => breakdownRow(inc, 'bg-credit', 'text-credit-deep'))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-6 w-6 text-ink-faint mx-auto mb-3" />
                  <p className="text-ink-soft text-sm">No income to analyze.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
