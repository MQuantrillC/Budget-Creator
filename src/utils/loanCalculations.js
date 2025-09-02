/**
 * Utility functions for loan calculations
 */

/**
 * Calculate monthly payment using amortization formula
 * @param {number} principal - The loan amount
 * @param {number} annualRate - Annual interest rate as decimal (e.g., 0.05 for 5%)
 * @param {number} termMonths - Loan term in months
 * @returns {number} Monthly payment amount
 */
export function calculateMonthlyPayment(principal, annualRate, termMonths) {
  if (annualRate === 0) {
    return principal / termMonths;
  }
  
  const monthlyRate = annualRate / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return payment;
}

/**
 * Generate complete amortization schedule
 * @param {number} principal - The loan amount
 * @param {number} annualRate - Annual interest rate as decimal
 * @param {number} termMonths - Loan term in months
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @returns {Array} Array of payment objects with date, payment, principal, interest, balance
 */
export function generateAmortizationSchedule(principal, annualRate, termMonths, startDate) {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const monthlyRate = annualRate / 12;
  const schedule = [];
  let remainingBalance = principal;
  
  const start = new Date(startDate);
  
  for (let month = 1; month <= termMonths; month++) {
    const paymentDate = new Date(start);
    paymentDate.setMonth(start.getMonth() + month - 1);
    
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance = Math.max(0, remainingBalance - principalPayment);
    
    schedule.push({
      month,
      date: paymentDate.toISOString().split('T')[0],
      payment: monthlyPayment,
      principalPayment,
      interestPayment,
      remainingBalance
    });
  }
  
  return schedule;
}

/**
 * Calculate total interest paid over the life of the loan
 * @param {number} principal - The loan amount
 * @param {number} annualRate - Annual interest rate as decimal
 * @param {number} termMonths - Loan term in months
 * @returns {number} Total interest amount
 */
export function calculateTotalInterest(principal, annualRate, termMonths) {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  return (monthlyPayment * termMonths) - principal;
}

/**
 * Get current remaining balance for a loan at a specific date
 * @param {Object} loan - Loan object with principal, rate, term, startDate
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @returns {number} Current remaining balance
 */
export function getCurrentLoanBalance(loan, currentDate) {
  const schedule = generateAmortizationSchedule(
    loan.principal, 
    loan.interestRate / 100, 
    loan.termMonths, 
    loan.startDate
  );
  
  const current = new Date(currentDate);
  const start = new Date(loan.startDate);
  
  // If current date is before start date, full balance remains
  if (current < start) {
    return loan.principal;
  }
  
  // Find the last payment that should have been made by current date
  let lastPaymentIndex = -1;
  for (let i = 0; i < schedule.length; i++) {
    const paymentDate = new Date(schedule[i].date);
    if (paymentDate <= current) {
      lastPaymentIndex = i;
    } else {
      break;
    }
  }
  
  // If no payments have been made yet
  if (lastPaymentIndex === -1) {
    return loan.principal;
  }
  
  // Return remaining balance after the last payment
  return schedule[lastPaymentIndex].remainingBalance;
}

/**
 * Get monthly payment amount for a loan
 * @param {Object} loan - Loan object with principal, rate, term
 * @returns {number} Monthly payment amount
 */
export function getLoanMonthlyPayment(loan) {
  return calculateMonthlyPayment(
    loan.principal,
    loan.interestRate / 100,
    loan.termMonths
  );
}

