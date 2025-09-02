'use client';

import { useState, useMemo } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
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
      return monthsFromNow >= -1 && monthsFromNow <= 12; // Include past month and next 12 months
    }).slice(0, 12);
  }, [schedule]);

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {loan.name}
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {loan.interestRate}% APR • {loan.termMonths} months
              </p>
            </div>
          </div>
          <button
            onClick={() => onDelete(loan.id)}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title="Delete loan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Monthly Payment</p>
            <p className="font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(monthlyPayment)}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Balance</p>
            <p className="font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(currentBalance)}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Interest</p>
            <p className="font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalInterest)}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</p>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-xs">
              {formatDate(loan.startDate)}
            </p>
          </div>
        </div>

        {loan.notes && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 italic">
              &ldquo;{loan.notes}&rdquo;
            </p>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="flex items-center justify-between w-full p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Payment Schedule ({upcomingPayments.length} upcoming)
            </span>
            {showSchedule ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {showSchedule && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {upcomingPayments.map((payment) => (
                <div key={payment.month} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(payment.date)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Payment #{payment.month}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(payment.payment)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Balance: {formatCurrency(payment.remainingBalance)}
                    </p>
                  </div>
                </div>
              ))}
              
              {schedule.length > upcomingPayments.length && (
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ... and {schedule.length - upcomingPayments.length} more payments
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

  const handleDeleteLoan = (id) => {
    if (window.confirm('Are you sure you want to delete this loan? This will also remove all associated repayment calculations.')) {
      deleteLoan(id);
    }
  };

  if (loans.length === 0) {
    return (
      <div className="py-12 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Loans</h3>
            <p className="text-gray-600 dark:text-gray-400">Add a loan above to see repayment schedules and track your debt.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Loans & Repayments</h2>
          <p className="text-base text-gray-600 dark:text-gray-400">Track your loans and payment schedules</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loans.map((loan) => (
            <LoanCard 
              key={loan.id} 
              loan={loan} 
              onDelete={handleDeleteLoan}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
