'use client';

import { useBudget } from '@/context/BudgetContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { TrendingDown, TrendingUp, PieChart } from 'lucide-react';
import { getLoanMonthlyPayment } from '@/utils/loanCalculations';

export default function PercentageBreakdown() {
  const { costs, income, loans, settings, exchangeRates } = useBudget();

  const convertToBaseCurrency = (amount, currency) => {
    if (!exchangeRates || currency === settings.baseCurrency) {
      return amount;
    }
    const rate = exchangeRates[currency];
    return rate ? amount / rate : amount;
  };

  // Calculate yearly totals for each expense and income
  const calculateYearlyAmount = (item) => {
    const baseAmount = convertToBaseCurrency(item.amount, item.currency);
    switch (item.category) {
      case 'monthly': return baseAmount * 12;
      case 'weekly': return baseAmount * 52;
      case 'biweekly': return baseAmount * 26;
      case 'semiannually': return baseAmount * 2;
      case 'yearly': return baseAmount;
      case 'one-time': return baseAmount;
      default: return baseAmount;
    }
  };

  // Calculate yearly amounts for all expenses and income
  const expensesWithYearlyAmounts = costs.map(cost => ({
    ...cost,
    yearlyAmount: calculateYearlyAmount(cost)
  }));

  // Add loan payments as expenses
  const loanExpenses = loans.map(loan => {
    const monthlyPayment = getLoanMonthlyPayment(loan);
    const yearlyAmount = convertToBaseCurrency(monthlyPayment * 12, loan.currency);
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

  // Calculate totals
  const totalYearlyExpenses = allExpensesWithYearlyAmounts.reduce((sum, expense) => sum + expense.yearlyAmount, 0);
  const totalYearlyIncome = incomeWithYearlyAmounts.reduce((sum, inc) => sum + inc.yearlyAmount, 0);

  // Calculate percentages and sort by amount (descending)
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
      <div className="flex justify-center items-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-gray-600 dark:text-gray-400">Loading breakdown...</div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 rounded-full bg-purple-900/30">
              <PieChart className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Percentage Breakdown</h2>
          <p className="text-base text-gray-600 dark:text-gray-400">Annual expense and income distribution</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses Breakdown */}
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                Expense Distribution
              </CardTitle>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Annual: {new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(totalYearlyExpenses)}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {expensePercentages.length > 0 ? (
                <div className="space-y-3">
                  {expensePercentages.map((expense) => (
                    <div key={expense.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                            {expense.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {expense.category}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-mono text-sm font-bold text-red-600 dark:text-red-400">
                            {expense.percentage.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(expense.yearlyAmount)}
                          </p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${expense.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">No expenses to analyze.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income Breakdown */}
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                Income Distribution
              </CardTitle>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Annual: {new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(totalYearlyIncome)}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {incomePercentages.length > 0 ? (
                <div className="space-y-3">
                  {incomePercentages.map((inc) => (
                    <div key={inc.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                            {inc.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {inc.category}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                            {inc.percentage.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(inc.yearlyAmount)}
                          </p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${inc.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">No income to analyze.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
