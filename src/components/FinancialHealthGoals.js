'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { ChevronDown, ChevronUp, Target, TrendingUp, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

export default function FinancialHealthGoals() {
  const { 
    costs, 
    income, 
    settings, 
    exchangeRates, 
    savingsGoal, 
    setSavingsGoal,
    currentCapital,
    startingCapitalCurrency 
  } = useBudget();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [goalAmount, setGoalAmount] = useState(savingsGoal.amount || '');
  const [targetDate, setTargetDate] = useState(savingsGoal.targetDate || '');
  const [goalCurrency, setGoalCurrency] = useState(savingsGoal.currency || settings.baseCurrency);
  const [goalType, setGoalType] = useState(savingsGoal.goalType || 'objective');
  const [includeCurrentCapital, setIncludeCurrentCapital] = useState(savingsGoal.includeCurrentCapital !== undefined ? savingsGoal.includeCurrentCapital : true);

  const convertToBaseCurrency = (amount, currency) => {
    if (!exchangeRates || currency === settings.baseCurrency) {
      return amount;
    }
    const rate = exchangeRates[currency];
    return rate ? amount / rate : amount;
  };

  // Calculate monthly totals
  const totalMonthlyCosts = costs
    .filter(cost => cost.category === 'monthly')
    .reduce((acc, cost) => acc + convertToBaseCurrency(cost.amount, cost.currency), 0);

  const totalMonthlyIncome = income
    .filter(inc => inc.category === 'monthly')
    .reduce((acc, inc) => acc + convertToBaseCurrency(inc.amount, inc.currency), 0);

  const monthlyNetIncome = totalMonthlyIncome - totalMonthlyCosts;

  // Convert current capital to base currency
  const currentCapitalInBase = convertToBaseCurrency(currentCapital, startingCapitalCurrency);

  // Convert goal amount to base currency for calculations
  const goalAmountInBase = convertToBaseCurrency(savingsGoal.amount, savingsGoal.currency || settings.baseCurrency);

  // Calculate savings goal progress based on goal type
  const getCurrentSavingsForGoal = () => {
    switch (savingsGoal.goalType) {
      case 'monthly':
        // For monthly savings, check if user saves enough each month
        return Math.max(0, monthlyNetIncome);
      case 'yearly':
        // For yearly savings, check if user saves enough annually
        return Math.max(0, monthlyNetIncome * 12);
      case 'objective':
      default:
        // For objectives, optionally include current capital
        return Math.max(0, savingsGoal.includeCurrentCapital ? currentCapitalInBase : 0);
    }
  };

  const currentSavingsValue = getCurrentSavingsForGoal();
  const goalProgress = goalAmountInBase > 0 ? (currentSavingsValue / goalAmountInBase) * 100 : 0;

  // Calculate time to reach goal
  const calculateTimeToGoal = () => {
    if (!savingsGoal.amount || monthlyNetIncome <= 0) return null;
    
    switch (savingsGoal.goalType) {
      case 'monthly':
        // For monthly savings, show if already achieved
        return goalAmountInBase <= monthlyNetIncome ? 0 : null;
      case 'yearly':
        // For yearly savings, show if already achieved
        return goalAmountInBase <= (monthlyNetIncome * 12) ? 0 : null;
      case 'objective':
      default:
        // For objectives, calculate months needed based on current capital inclusion
        const startingPoint = savingsGoal.includeCurrentCapital ? currentCapitalInBase : 0;
        const remainingAmount = goalAmountInBase - startingPoint;
        if (remainingAmount <= 0) return 0; // Goal already reached
        const monthsNeeded = Math.ceil(remainingAmount / monthlyNetIncome);
        return monthsNeeded;
    }
  };

  const monthsToGoal = calculateTimeToGoal();

  // Calculate suggestions
  const getSuggestions = () => {
    if (!savingsGoal.amount) return null;

    const goalCurrency = savingsGoal.currency || settings.baseCurrency;

    switch (savingsGoal.goalType) {
      case 'monthly':
        if (monthlyNetIncome >= goalAmountInBase) {
          return { 
            type: 'success', 
            message: `Great! You&apos;re already saving ${new Intl.NumberFormat('en-US', { style: 'currency', currency: goalCurrency }).format(savingsGoal.amount)} monthly.` 
          };
        } else {
          const shortfall = goalAmountInBase - monthlyNetIncome;
          return {
            type: 'warning',
            message: `You need ${new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(shortfall)} more monthly net income to reach your monthly savings goal.`
          };
        }

      case 'yearly':
        const annualNetIncome = monthlyNetIncome * 12;
        if (annualNetIncome >= goalAmountInBase) {
          return { 
            type: 'success', 
            message: `Excellent! You&apos;re on track to save ${new Intl.NumberFormat('en-US', { style: 'currency', currency: goalCurrency }).format(savingsGoal.amount)} this year.` 
          };
        } else {
          const shortfall = goalAmountInBase - annualNetIncome;
          return {
            type: 'warning',
            message: `You need ${new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(shortfall)} more annual net income to reach your yearly savings goal.`
          };
        }

      case 'objective':
      default:
        if (!savingsGoal.targetDate) return null;

        const targetDateObj = new Date(savingsGoal.targetDate);
        const currentDate = new Date();
        const monthsAvailable = Math.max(1, Math.ceil((targetDateObj - currentDate) / (1000 * 60 * 60 * 24 * 30.44)));
        
        const startingPoint = savingsGoal.includeCurrentCapital ? currentCapitalInBase : 0;
        const remainingAmount = goalAmountInBase - startingPoint;
        if (remainingAmount <= 0) return { type: 'success', message: 'Congratulations! You&apos;ve already reached your objective!' };

        const neededMonthlySavings = remainingAmount / monthsAvailable;
        
        if (monthlyNetIncome >= neededMonthlySavings) {
          return { 
            type: 'success', 
            message: `You&apos;re on track! Save ${new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(neededMonthlySavings)} monthly to reach your objective.` 
          };
        } else {
          const shortfall = neededMonthlySavings - monthlyNetIncome;
          return {
            type: 'warning',
            message: `To reach your objective by ${savingsGoal.targetDate}, you need ${new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(shortfall)} more monthly net income.`
          };
        }
    }
  };

  const suggestions = getSuggestions();

  const handleSaveGoal = () => {
    const isValidGoal = goalAmount && (goalType !== 'objective' || targetDate);
    setSavingsGoal({
      amount: parseFloat(goalAmount) || 0,
      targetDate: targetDate,
      currency: goalCurrency,
      goalType: goalType,
      includeCurrentCapital: includeCurrentCapital,
      enabled: isValidGoal
    });
  };

  if (!exchangeRates) {
    return (
      <div className="flex justify-center items-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-gray-600 dark:text-gray-400">Loading financial health data...</div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div 
            className="cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-2xl"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  Financial Health & Goals
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </CardTitle>
            </CardHeader>
          </div>
          
          {isExpanded && (
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Income vs Expense Percentage (only if income exists) */}
                {totalMonthlyIncome > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <div className="flex items-center mb-3">
                      <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Income vs Expenses</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Monthly Income</p>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(totalMonthlyIncome)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Monthly Expenses</p>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(totalMonthlyCosts)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Net Income</p>
                        <p className={`font-semibold ${monthlyNetIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(monthlyNetIncome)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Savings Goal Widget */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center mb-4">
                    <Target className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Financial Goal</h3>
                  </div>
                  
                  {/* Goal Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Goal Type
                    </label>
                    <select
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-gray-100"
                    >
                      <option value="objective">Set Objective (e.g., Travel, Purchase)</option>
                      <option value="monthly">Monthly Savings Target</option>
                      <option value="yearly">Yearly Savings Target</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {goalType === 'objective' ? 'Target Amount' : 
                         goalType === 'monthly' ? 'Monthly Savings Target' : 'Yearly Savings Target'}
                      </label>
                      <input
                        type="number"
                        value={goalAmount}
                        onChange={(e) => setGoalAmount(e.target.value)}
                        placeholder={goalType === 'objective' ? 'e.g., 5000' : 
                                   goalType === 'monthly' ? 'e.g., 500' : 'e.g., 6000'}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={goalCurrency}
                        onChange={(e) => setGoalCurrency(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-gray-100"
                      >
                        {settings.availableCurrencies.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Target Date - Only for Objectives */}
                  {goalType === 'objective' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}
                  
                  {/* Include Current Capital - Only for Objectives */}
                  {goalType === 'objective' && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="includeCurrentCapital"
                          checked={includeCurrentCapital}
                          onChange={(e) => setIncludeCurrentCapital(e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mt-0.5"
                        />
                        <div className="flex-1">
                          <label htmlFor="includeCurrentCapital" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Include current capital in progress calculation
                          </label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Your current set capital is {new Intl.NumberFormat('en-US', { style: 'currency', currency: startingCapitalCurrency }).format(currentCapital)} ({startingCapitalCurrency})
                            {startingCapitalCurrency !== settings.baseCurrency && (
                              <span> ≈ {new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(currentCapitalInBase)} ({settings.baseCurrency})</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleSaveGoal}
                    className="mb-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Save Goal
                  </button>

                  {/* Progress Display */}
                  {savingsGoal.enabled && savingsGoal.amount > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {goalType === 'monthly' ? 'Monthly Achievement' : 
                           goalType === 'yearly' ? 'Annual Achievement' : 'Progress'}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {goalProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3">
                        <div 
                          className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(goalProgress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>
                          {goalType === 'monthly' ? 'Current Net Income:' : 
                           goalType === 'yearly' ? 'Annual Net Income:' : 'Current Savings:'}
                        </span>
                        <span>
                          {goalType === 'monthly' ? 'Target:' : 
                           goalType === 'yearly' ? 'Target:' : 'Goal:'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(currentSavingsValue)}
                        </span>
                        <span>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: savingsGoal.currency || settings.baseCurrency }).format(savingsGoal.amount)}
                        </span>
                      </div>
                      
                      {/* Time estimation - Only for objectives */}
                      {goalType === 'objective' && monthsToGoal !== null && monthsToGoal > 0 && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            At current savings rate: {monthsToGoal} month{monthsToGoal !== 1 ? 's' : ''} to reach goal
                          </span>
                        </div>
                      )}
                      
                      {/* Achievement status for monthly/yearly goals */}
                      {(goalType === 'monthly' || goalType === 'yearly') && monthsToGoal === 0 && (
                        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>Goal achieved! You&apos;re meeting your {goalType} savings target.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dynamic Suggestions */}
                  {suggestions && (
                    <div className={`mt-4 p-3 rounded-lg border-l-4 ${
                      suggestions.type === 'success' 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                    }`}>
                      <div className="flex items-start">
                        {suggestions.type === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                        )}
                        <p className={`text-sm ${
                          suggestions.type === 'success' 
                            ? 'text-green-800 dark:text-green-200' 
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {suggestions.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
