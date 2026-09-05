'use client';

import { useState, useMemo } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import ConfirmDialog from '@/components/ConfirmDialog';
import { CreditCard, Calendar, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  generateAmortizationSchedule,
  getLoanMonthlyPayment,
  calculateTotalInterest,
  getCurrentLoanBalance
} from '@/utils/loanCalculations';

function LoanCard({ loan, onDelete }) {
  const [showSchedule, setShowSchedule] = useState(false);

  const monthlyPayment = getLoanMonthlyPayment(loan);
  const totalInterest = calculateTotalInterest(loan.principal, loan.interestRate / 100, loan.termMonths);
  const currentBalance = getCurrentLoanBalance(loan, new Date().toISOString().split('T')[0]);
  const schedule = generateAmortizationSchedule(loan.principal, loan.interestRate / 100, loan.termMonths, loan.startDate);

  const formatCurrency = (amount, currency = loan.currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show only next 12 months of schedule by default
  const upcomingPayments = useMemo(() => {
    const today = new Date();
    return schedule.filter(payment => {
      const paymentDate = new Date(payment.date);
      const monthsFromNow = (paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsFromNow >= -1 && monthsFromNow <= 12;
    }).slice(0, 12);
  }, [schedule]);

  const statBox = (label, value, valueClass = 'text-ink') => (
    <div className="text-center p-3 bg-card-deep border border-line rounded">
      <p className="ledger-label !text-[10px] mb-1">{label}</p>
      <p className={`ledger-figure font-semibold text-sm ${valueClass}`}>{value}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader className="!pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-gold-pale border border-gold/40">
              <CreditCard className="h-5 w-5 text-gold" />
            </div>
            <div>
              <CardTitle className="!text-xl">
                {loan.name}
              </CardTitle>
              <p className="ledger-figure text-xs text-ink-soft mt-0.5">
                {loan.interestRate}% APR · {loan.termMonths} months
              </p>
            </div>
          </div>
          <button
            onClick={() => onDelete(loan.id)}
            className="p-1 text-ink-faint hover:text-debit hover:bg-debit-pale rounded transition-colors"
            title="Delete loan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statBox('Monthly Payment', formatCurrency(monthlyPayment), 'text-gold')}
          {statBox('Current Balance', formatCurrency(currentBalance))}
          {statBox('Total Interest', formatCurrency(totalInterest), 'text-debit')}
          {statBox('Start Date', formatDate(loan.startDate))}
        </div>

        {loan.notes && (
          <div className="mb-4 p-3 bg-inkblue-pale border border-inkblue/30 rounded">
            <p className="text-sm text-inkblue italic">
              &ldquo;{loan.notes}&rdquo;
            </p>
          </div>
        )}

        <div className="border-t border-line pt-4">
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="flex items-center justify-between w-full p-3 text-left bg-card-deep border border-line rounded hover:bg-line/40 transition-colors"
          >
            <span className="ledger-label !text-ink">
              Payment Schedule ({upcomingPayments.length} upcoming)
            </span>
            {showSchedule ? (
              <ChevronUp className="h-4 w-4 text-ink-faint" />
            ) : (
              <ChevronDown className="h-4 w-4 text-ink-faint" />
            )}
          </button>

          {showSchedule && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {upcomingPayments.map((payment) => (
                <div key={payment.month} className="flex justify-between items-center p-2.5 bg-card border border-line rounded">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-ink-faint" />
                    <div>
                      <p className="ledger-figure text-sm font-medium text-ink">
                        {formatDate(payment.date)}
                      </p>
                      <p className="ledger-figure text-[11px] text-ink-faint">
                        Payment #{payment.month}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="ledger-figure text-sm font-semibold text-gold">
                      {formatCurrency(payment.payment)}
                    </p>
                    <p className="ledger-figure text-[11px] text-ink-soft">
                      Balance: {formatCurrency(payment.remainingBalance)}
                    </p>
                  </div>
                </div>
              ))}

              {schedule.length > upcomingPayments.length && (
                <div className="text-center pt-2">
                  <p className="ledger-figure text-xs text-ink-faint">
                    … and {schedule.length - upcomingPayments.length} more payments
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoanRepayments() {
  const { loans, deleteLoan } = useBudget();
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  if (loans.length === 0) {
    return null;
  }

  return (
    <div className="py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-semibold text-ink mb-2">Loans &amp; Repayments</h2>
          <p className="text-ink-soft">Track your loans and payment schedules</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onDelete={setPendingDeleteId}
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete loan"
        message="Are you sure you want to delete this loan? This will also remove all associated repayment calculations."
        confirmLabel="Delete"
        onConfirm={() => { deleteLoan(pendingDeleteId); setPendingDeleteId(null); }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
