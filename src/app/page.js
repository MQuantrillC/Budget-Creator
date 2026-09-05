'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuth } from '@/components/AuthProvider';
import ProjectionsTable from '@/components/ProjectionsTable';
import Charts from '@/components/Charts';
import Tooltip from '@/components/Tooltip';
import EntryForm from '@/components/EntryForm';
import ClientOnly from '@/components/ClientOnly';
import CurrentCapitalForm from '@/components/CurrentCapitalForm';
import FinancialProjectionControls from '@/components/FinancialProjectionControls';
import PercentageBreakdown from '@/components/PercentageBreakdown';
import FinancialHealthGoals from '@/components/FinancialHealthGoals';
import LoanRepayments from '@/components/LoanRepayments';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Wallet, TrendingUp, TrendingDown, Scale, Target, X, CreditCard, BookOpen } from 'lucide-react';
import ResetDataButton from '@/components/ResetDataButton';
import ExchangeRatesTooltip from '@/components/ExchangeRatesTooltip';
import { getLoanMonthlyPayment, isLoanActiveDuring } from '@/utils/loanCalculations';
import { makeConverters, monthlyRecurringTotal, formatMoney } from '@/utils/budgetMath';

function MetricCard({ icon: Icon, title, value, tooltipText, color = 'ink' }) {
  const accentClasses = {
    ink: 'border-t-ink text-ink',
    credit: 'border-t-credit text-credit-deep',
    debit: 'border-t-debit text-debit-deep',
    gold: 'border-t-gold text-gold',
    inkblue: 'border-t-inkblue text-inkblue',
  };

  return (
    <Tooltip text={tooltipText}>
      <div className={`ledger-card border-t-4 ${accentClasses[color].split(' ')[0]} p-4 w-full h-full transition-shadow hover:shadow-md cursor-default`}>
        <div className="flex items-center justify-between mb-2">
          <p className="ledger-label">{title}</p>
          <Icon className={`h-4 w-4 ${accentClasses[color].split(' ')[1]}`} />
        </div>
        <p className={`ledger-figure text-lg sm:text-xl font-semibold break-words ${accentClasses[color].split(' ')[1]}`}>{value}</p>
      </div>
    </Tooltip>
  );
}

export default function HomePage() {
  const {
    costs,
    income,
    loans,
    currentCapital,
    settings,
    exchangeRates,
    setSettings,
    startingCapitalCurrency,
    deleteCost,
    deleteIncome
  } = useBudget();

  const { session, isGuest, isLoading: authLoading, signOut, showAuthModal } = useAuth();

  const { toBase, toDisplay } = makeConverters(exchangeRates, settings.baseCurrency);

  // Starting capital in display currency
  const currentCapitalInDisplayCurrency = toDisplay(
    currentCapital,
    startingCapitalCurrency,
    settings.baseCurrency
  );

  // Monthly totals include ALL recurring frequencies, normalized to monthly
  const totalMonthlyCosts = monthlyRecurringTotal(costs, toBase);
  const totalMonthlyIncome = monthlyRecurringTotal(income, toBase);

  // Loan payments for loans active this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const totalMonthlyLoanPayments = loans.reduce((acc, loan) => {
    if (!isLoanActiveDuring(loan, monthStart, monthEnd)) return acc;
    return acc + toBase(getLoanMonthlyPayment(loan), loan.currency);
  }, 0);

  const totalMonthlyCostsWithLoans = totalMonthlyCosts + totalMonthlyLoanPayments;
  const netMonthlyFlow = totalMonthlyIncome - totalMonthlyCostsWithLoans;
  const spendRatio = totalMonthlyIncome > 0 ? totalMonthlyCostsWithLoans / totalMonthlyIncome : 0;

  // { type: 'cost' | 'income', id } — entry awaiting delete confirmation
  const [pendingDelete, setPendingDelete] = useState(null);

  const confirmPendingDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'cost') deleteCost(pendingDelete.id);
    else deleteIncome(pendingDelete.id);
    setPendingDelete(null);
  };

  if (authLoading || (!authLoading && (session || isGuest) && !exchangeRates)) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-10 w-10 text-credit mx-auto mb-4 animate-pulse" />
          <div className="ledger-label">
            {authLoading ? 'Opening the books…' : 'Fetching exchange rates…'}
          </div>
        </div>
      </div>
    );
  }

  if (!authLoading && !session && !isGuest) {
    return <div className="min-h-screen bg-paper"></div>;
  }

  const entryLedgerRow = (entry, sign, type) => (
    <div key={entry.id} className="flex justify-between items-start px-4 py-3 border-b border-line last:border-b-0 group">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink text-sm truncate">{entry.description}</p>
        <p className="ledger-figure text-[11px] text-ink-faint uppercase tracking-wide">{entry.category}</p>
        {entry.notes && (
          <p className="text-xs text-ink-soft mt-1 italic">&ldquo;{entry.notes}&rdquo;</p>
        )}
      </div>
      <div className="flex items-center space-x-2 ml-3">
        <p className={`ledger-figure text-sm font-semibold ${sign === '-' ? 'text-debit' : 'text-credit-deep'}`}>
          {sign}{formatMoney(entry.amount, entry.currency, { minimumFractionDigits: 2 })}
        </p>
        {/* Always visible on touch devices; hover-revealed on desktop */}
        <button
          onClick={() => setPendingDelete({ type, id: entry.id })}
          className="p-1.5 text-ink-faint hover:text-debit hover:bg-debit-pale rounded transition-colors sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
          title="Delete entry"
          aria-label={`Delete ${entry.description}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b-2 border-ink">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-5 w-5 text-credit-deep hidden sm:block" />
            <span className="ledger-label hidden md:inline">Budget Creator · Personal Ledger</span>
            {(isGuest || (!session && !authLoading)) && (
              <>
                <button onClick={showAuthModal} className="btn btn-ink !py-1.5 !px-3 text-xs">
                  Log In
                </button>
                <button onClick={showAuthModal} className="btn btn-primary !py-1.5 !px-3 text-xs">
                  Sign Up
                </button>
                {isGuest && <span className="ledger-label text-ink-faint">Guest</span>}
              </>
            )}
            {session && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-ink-soft">
                  Welcome, {session.user.user_metadata?.first_name || session.user.email.split('@')[0]}
                </span>
                <button onClick={signOut} className="btn btn-secondary !py-1 !px-2.5 text-xs">
                  Sign Out
                </button>
              </div>
            )}
          </div>

          <ExchangeRatesTooltip />
        </div>
      </div>

      {/* Masthead */}
      <div className="pt-12 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="ledger-label mb-3">Est. for everyday budgets</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink mb-3">
            Budget Creator
          </h1>
          <div className="ornament-rule max-w-xs mx-auto mb-4">
            <span className="text-line-strong text-xs">◆</span>
          </div>
          <p className="text-lg text-ink-soft">
            Simple personal budgeting, kept like a proper ledger.
          </p>
        </div>
      </div>

      {/* Entry slip */}
      <div className="pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="ledger-card overflow-hidden fade-in">
            <div className="border-b-2 border-ink px-6 py-4 bg-card-deep flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-ink">New Entry Slip</h2>
              <span className="ledger-label text-ink-faint hidden sm:inline">Form № 1</span>
            </div>
            <div className="p-6 lg:p-8 space-y-8">
              {/* Starting capital */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Target className="h-4 w-4 text-credit-deep" />
                  <h3 className="ledger-label !text-ink">Opening Balance</h3>
                </div>
                <ClientOnly>
                  <CurrentCapitalForm />
                </ClientOnly>
              </div>

              <div className="ornament-rule">
                <span className="ledger-label">Record Income &amp; Expenses</span>
              </div>

              <EntryForm />
            </div>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-semibold text-ink mb-2">Account Overview</h2>
            <div className="flex justify-center items-center space-x-2 mt-3">
              <p className="ledger-label">Display Currency</p>
              <select
                value={settings.baseCurrency}
                onChange={(e) => setSettings({ ...settings, baseCurrency: e.target.value })}
                className="ledger-input !w-auto !py-1 text-sm ledger-figure"
              >
                {settings.availableCurrencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Spending vs income meter */}
          {totalMonthlyIncome > 0 && (
            <div className="max-w-md mx-auto mb-8">
              <div className="ledger-card p-4">
                <p className="ledger-label mb-2">Monthly Spending vs Income</p>
                <p className="text-sm text-ink-soft mb-2">
                  You&apos;re spending <span className="ledger-figure font-semibold text-ink">{Math.round(spendRatio * 100)}%</span> of your income
                </p>
                <div className="w-full bg-card-deep border border-line rounded-sm h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      spendRatio <= 0.5 ? 'bg-credit' : spendRatio <= 0.8 ? 'bg-gold' : 'bg-debit'
                    }`}
                    style={{ width: `${Math.min(spendRatio * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between ledger-figure text-[10px] text-ink-faint mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <MetricCard
              icon={Wallet}
              title="Current Capital"
              value={formatMoney(currentCapitalInDisplayCurrency, settings.baseCurrency)}
              tooltipText={`Your starting capital: ${formatMoney(currentCapital, startingCapitalCurrency)} (${startingCapitalCurrency}), converted to ${settings.baseCurrency}.`}
              color="inkblue"
            />
            <MetricCard
              icon={TrendingDown}
              title="Monthly Costs"
              value={formatMoney(totalMonthlyCosts, settings.baseCurrency)}
              tooltipText="All recurring costs (weekly, monthly, yearly…) normalized to a monthly amount, converted to your display currency."
              color="debit"
            />
            <MetricCard
              icon={CreditCard}
              title="Loan Payments"
              value={formatMoney(totalMonthlyLoanPayments, settings.baseCurrency)}
              tooltipText="Total monthly loan payments across loans active this month."
              color="gold"
            />
            <MetricCard
              icon={TrendingUp}
              title="Monthly Income"
              value={formatMoney(totalMonthlyIncome, settings.baseCurrency)}
              tooltipText="All recurring income normalized to a monthly amount, converted to your display currency."
              color="credit"
            />
            <div className="col-span-2 lg:col-span-1">
              <MetricCard
                icon={Scale}
                title="Net Monthly Flow"
                value={formatMoney(netMonthlyFlow, settings.baseCurrency)}
                tooltipText="Monthly income minus monthly costs and loan payments (surplus or deficit)."
                color={netMonthlyFlow >= 0 ? 'credit' : 'debit'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-semibold text-ink mb-2">Transaction Register</h2>
            <p className="text-ink-soft mb-3">Every debit and credit on record</p>
            <ResetDataButton />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="!pb-3">
                <CardTitle className="!text-xl flex items-center">
                  <TrendingDown className="h-5 w-5 text-debit mr-2" />
                  Expenses
                  <span className="ledger-label text-ink-faint ml-auto">Debits</span>
                </CardTitle>
              </CardHeader>
              <div className="pb-2">
                {costs.length > 0 ? costs.map((cost) => entryLedgerRow(cost, '-', 'cost')) : (
                  <div className="text-center py-10">
                    <TrendingDown className="h-6 w-6 text-ink-faint mx-auto mb-3" />
                    <p className="text-ink-soft text-sm">No expenses recorded yet.</p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader className="!pb-3">
                <CardTitle className="!text-xl flex items-center">
                  <TrendingUp className="h-5 w-5 text-credit-deep mr-2" />
                  Income
                  <span className="ledger-label text-ink-faint ml-auto">Credits</span>
                </CardTitle>
              </CardHeader>
              <div className="pb-2">
                {income.length > 0 ? income.map((inc) => entryLedgerRow(inc, '+', 'income')) : (
                  <div className="text-center py-10">
                    <TrendingUp className="h-6 w-6 text-ink-faint mx-auto mb-3" />
                    <p className="text-ink-soft text-sm">No income recorded yet.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Loans & Repayments */}
      {loans.length > 0 && (
        <ClientOnly>
          <LoanRepayments />
        </ClientOnly>
      )}

      {/* Percentage Breakdown */}
      <ClientOnly>
        <PercentageBreakdown />
      </ClientOnly>

      {/* Financial Health & Goals */}
      <ClientOnly>
        <FinancialHealthGoals />
      </ClientOnly>

      {/* Charts */}
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-semibold text-ink mb-2">Financial Projections</h2>
            <p className="text-ink-soft">Your balance, projected forward</p>
          </div>

          <Card>
            <CardContent className="p-6 sm:p-8">
              <ClientOnly>
                <FinancialProjectionControls />
                <Charts />
              </ClientOnly>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Projections table */}
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-semibold text-ink mb-2">Detailed Projections</h2>
            <p className="text-ink-soft">Period-by-period breakdown</p>
          </div>

          <Card>
            <CardContent className="p-6 sm:p-8">
              <ClientOnly>
                <ProjectionsTable />
              </ClientOnly>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete entry"
        message={`Are you sure you want to delete this ${pendingDelete?.type === 'cost' ? 'expense' : 'income'} entry? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmPendingDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
