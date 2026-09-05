'use client';

import { useState, useEffect } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { ChevronDown, ChevronUp, Target, TrendingUp, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { makeConverters, monthlyRecurringTotal, formatMoney } from '@/utils/budgetMath';

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

  // Saved goal data loads asynchronously (localStorage / Supabase) after
  // mount — sync it into the form when it arrives.
  useEffect(() => {
    setGoalAmount(savingsGoal.amount || '');
    setTargetDate(savingsGoal.targetDate || '');
    setGoalCurrency(savingsGoal.currency || settings.baseCurrency);
    setGoalType(savingsGoal.goalType || 'objective');
    setIncludeCurrentCapital(savingsGoal.includeCurrentCapital !== undefined ? savingsGoal.includeCurrentCapital : true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savingsGoal]);

  const { toBase } = makeConverters(exchangeRates, settings.baseCurrency);

  // Monthly totals include all recurring frequencies, normalized to monthly
  const totalMonthlyCosts = monthlyRecurringTotal(costs, toBase);
  const totalMonthlyIncome = monthlyRecurringTotal(income, toBase);
  const monthlyNetIncome = totalMonthlyIncome - totalMonthlyCosts;

  const currentCapitalInBase = toBase(currentCapital, startingCapitalCurrency);
  const goalAmountInBase = toBase(savingsGoal.amount, savingsGoal.currency || settings.baseCurrency);

  const getCurrentSavingsForGoal = () => {
    switch (savingsGoal.goalType) {
      case 'monthly':
        return Math.max(0, monthlyNetIncome);
      case 'yearly':
        return Math.max(0, monthlyNetIncome * 12);
      case 'objective':
      default:
        return Math.max(0, savingsGoal.includeCurrentCapital ? currentCapitalInBase : 0);
    }
  };

  const currentSavingsValue = getCurrentSavingsForGoal();
  const goalProgress = goalAmountInBase > 0 ? (currentSavingsValue / goalAmountInBase) * 100 : 0;

  const calculateTimeToGoal = () => {
    if (!savingsGoal.amount || monthlyNetIncome <= 0) return null;

    switch (savingsGoal.goalType) {
      case 'monthly':
        return goalAmountInBase <= monthlyNetIncome ? 0 : null;
      case 'yearly':
        return goalAmountInBase <= (monthlyNetIncome * 12) ? 0 : null;
      case 'objective':
      default: {
        const startingPoint = savingsGoal.includeCurrentCapital ? currentCapitalInBase : 0;
        const remainingAmount = goalAmountInBase - startingPoint;
        if (remainingAmount <= 0) return 0;
        return Math.ceil(remainingAmount / monthlyNetIncome);
      }
    }
  };

  const monthsToGoal = calculateTimeToGoal();

  const getSuggestions = () => {
    if (!savingsGoal.amount) return null;

    const goalCurrencyCode = savingsGoal.currency || settings.baseCurrency;

    switch (savingsGoal.goalType) {
      case 'monthly':
        if (monthlyNetIncome >= goalAmountInBase) {
          return {
            type: 'success',
            message: `Great! You're already saving ${formatMoney(savingsGoal.amount, goalCurrencyCode)} monthly.`
          };
        } else {
          const shortfall = goalAmountInBase - monthlyNetIncome;
          return {
            type: 'warning',
            message: `You need ${formatMoney(shortfall, settings.baseCurrency)} more monthly net income to reach your monthly savings goal.`
          };
        }

      case 'yearly': {
        const annualNetIncome = monthlyNetIncome * 12;
        if (annualNetIncome >= goalAmountInBase) {
          return {
            type: 'success',
            message: `Excellent! You're on track to save ${formatMoney(savingsGoal.amount, goalCurrencyCode)} this year.`
          };
        } else {
          const shortfall = goalAmountInBase - annualNetIncome;
          return {
            type: 'warning',
            message: `You need ${formatMoney(shortfall, settings.baseCurrency)} more annual net income to reach your yearly savings goal.`
          };
        }
      }

      case 'objective':
      default: {
        if (!savingsGoal.targetDate) return null;

        const targetDateObj = new Date(savingsGoal.targetDate);
        const currentDate = new Date();
        const monthsAvailable = Math.max(1, Math.ceil((targetDateObj - currentDate) / (1000 * 60 * 60 * 24 * 30.44)));

        const startingPoint = savingsGoal.includeCurrentCapital ? currentCapitalInBase : 0;
        const remainingAmount = goalAmountInBase - startingPoint;
        if (remainingAmount <= 0) return { type: 'success', message: "Congratulations! You've already reached your objective!" };

        const neededMonthlySavings = remainingAmount / monthsAvailable;

        if (monthlyNetIncome >= neededMonthlySavings) {
          return {
            type: 'success',
            message: `You're on track! Save ${formatMoney(neededMonthlySavings, settings.baseCurrency)} monthly to reach your objective.`
          };
        } else {
          const shortfall = neededMonthlySavings - monthlyNetIncome;
          return {
            type: 'warning',
            message: `To reach your objective by ${savingsGoal.targetDate}, you need ${formatMoney(shortfall, settings.baseCurrency)} more monthly net income.`
          };
        }
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
      <div className="flex justify-center items-center h-32 bg-card-deep rounded">
        <div className="ledger-label">Loading financial health data…</div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <Card>
          <div
            className="cursor-pointer select-none hover:bg-card-deep/50 transition-colors rounded-t-md"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <CardHeader className="!pb-4">
              <CardTitle className="!text-xl flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-credit-deep mr-2" />
                  Financial Health &amp; Goals
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-ink-faint" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-ink-faint" />
                )}
              </CardTitle>
            </CardHeader>
          </div>

          {isExpanded && (
            <CardContent>
              <div className="space-y-6">
                {/* Income vs expenses */}
                {totalMonthlyIncome > 0 && (
                  <div className="bg-card-deep border border-line rounded p-4">
                    <div className="flex items-center mb-3">
                      <TrendingUp className="h-4 w-4 text-inkblue mr-2" />
                      <h3 className="ledger-label !text-ink">Income vs Expenses</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="ledger-label">Monthly Income</p>
                        <p className="ledger-figure font-semibold text-credit-deep">
                          {formatMoney(totalMonthlyIncome, settings.baseCurrency)}
                        </p>
                      </div>
                      <div>
                        <p className="ledger-label">Monthly Expenses</p>
                        <p className="ledger-figure font-semibold text-debit">
                          {formatMoney(totalMonthlyCosts, settings.baseCurrency)}
                        </p>
                      </div>
                      <div>
                        <p className="ledger-label">Net Income</p>
                        <p className={`ledger-figure font-semibold ${monthlyNetIncome >= 0 ? 'text-credit-deep' : 'text-debit'}`}>
                          {formatMoney(monthlyNetIncome, settings.baseCurrency)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Savings goal */}
                <div className="bg-card-deep border border-line rounded p-4">
                  <div className="flex items-center mb-4">
                    <Target className="h-4 w-4 text-inkblue mr-2" />
                    <h3 className="ledger-label !text-ink">Financial Goal</h3>
                  </div>

                  <div className="mb-4">
                    <label className="ledger-label block mb-1.5">
                      Goal Type
                    </label>
                    <select
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value)}
                      className="ledger-input"
                    >
                      <option value="objective">Set Objective (e.g., Travel, Purchase)</option>
                      <option value="monthly">Monthly Savings Target</option>
                      <option value="yearly">Yearly Savings Target</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="ledger-label block mb-1.5">
                        {goalType === 'objective' ? 'Target Amount' :
                         goalType === 'monthly' ? 'Monthly Savings Target' : 'Yearly Savings Target'}
                      </label>
                      <input
                        type="number"
                        value={goalAmount}
                        onChange={(e) => setGoalAmount(e.target.value)}
                        placeholder={goalType === 'objective' ? 'e.g., 5000' :
                                   goalType === 'monthly' ? 'e.g., 500' : 'e.g., 6000'}
                        className="ledger-input ledger-figure"
                      />
                    </div>
                    <div>
                      <label className="ledger-label block mb-1.5">
                        Currency
                      </label>
                      <select
                        value={goalCurrency}
                        onChange={(e) => setGoalCurrency(e.target.value)}
                        className="ledger-input"
                      >
                        {settings.availableCurrencies.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {goalType === 'objective' && (
                    <div className="mb-4">
                      <label className="ledger-label block mb-1.5">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="ledger-input ledger-figure"
                      />
                    </div>
                  )}

                  {goalType === 'objective' && (
                    <div className="mb-4 p-3 bg-inkblue-pale border border-inkblue/30 rounded">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="includeCurrentCapital"
                          checked={includeCurrentCapital}
                          onChange={(e) => setIncludeCurrentCapital(e.target.checked)}
                          className="w-4 h-4 accent-[#33526e] mt-0.5"
                        />
                        <div className="flex-1">
                          <label htmlFor="includeCurrentCapital" className="text-sm font-medium text-ink cursor-pointer">
                            Include current capital in progress calculation
                          </label>
                          <p className="text-xs text-ink-soft mt-1">
                            Your current set capital is {formatMoney(currentCapital, startingCapitalCurrency)} ({startingCapitalCurrency})
                            {startingCapitalCurrency !== settings.baseCurrency && (
                              <span> ≈ {formatMoney(currentCapitalInBase, settings.baseCurrency)} ({settings.baseCurrency})</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button onClick={handleSaveGoal} className="btn btn-primary mb-4">
                    Save Goal
                  </button>

                  {/* Progress */}
                  {savingsGoal.enabled && savingsGoal.amount > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="ledger-label">
                          {goalType === 'monthly' ? 'Monthly Achievement' :
                           goalType === 'yearly' ? 'Annual Achievement' : 'Progress'}
                        </span>
                        <span className="ledger-figure text-sm font-semibold text-ink">
                          {goalProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-card border border-line rounded-sm h-3 overflow-hidden">
                        <div
                          className="bg-credit h-full transition-all duration-300"
                          style={{ width: `${Math.min(goalProgress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between ledger-figure text-xs text-ink-soft">
                        <span>
                          {formatMoney(currentSavingsValue, settings.baseCurrency)}
                        </span>
                        <span>
                          {formatMoney(savingsGoal.amount, savingsGoal.currency || settings.baseCurrency)}
                        </span>
                      </div>

                      {goalType === 'objective' && monthsToGoal !== null && monthsToGoal > 0 && (
                        <div className="flex items-center text-sm text-ink-soft">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          <span>
                            At current savings rate: {monthsToGoal} month{monthsToGoal !== 1 ? 's' : ''} to reach goal
                          </span>
                        </div>
                      )}

                      {(goalType === 'monthly' || goalType === 'yearly') && monthsToGoal === 0 && (
                        <div className="flex items-center text-sm text-credit-deep">
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          <span>Goal achieved! You&apos;re meeting your {goalType} savings target.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggestions */}
                  {suggestions && (
                    <div className={`mt-4 p-3 rounded border-l-4 ${
                      suggestions.type === 'success'
                        ? 'bg-credit-pale border-credit'
                        : 'bg-gold-pale border-gold'
                    }`}>
                      <div className="flex items-start">
                        {suggestions.type === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-credit-deep mr-2 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-gold mr-2 mt-0.5 flex-shrink-0" />
                        )}
                        <p className="text-sm text-ink">
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
