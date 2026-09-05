'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { Plus } from 'lucide-react';
import DateInput from './DateInput';
import { formatMoney } from '@/utils/budgetMath';

function FormRow({ children, columns = 1 }) {
  const gridCols = columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';
  return <div className={`grid ${gridCols} gap-4`}>{children}</div>;
}

function FormField({ label, children, required = false }) {
  return (
    <div className="space-y-1.5 text-left">
      {label && (
        <label className="ledger-label block">
          {label}
          {required && <span className="text-debit ml-1">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return <input {...props} className={`ledger-input ${className}`} />;
}

function Select({ className = "", children, ...props }) {
  return (
    <select {...props} className={`ledger-input ${className}`}>
      {children}
    </select>
  );
}

export default function EntryForm() {
  const { settings, addCost, addIncome, addLoan, exchangeRates } = useBudget();
  const [entryType, setEntryType] = useState('cost');
  const [description, setDescription] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [optionalDescription, setOptionalDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(settings.baseCurrency);
  const [frequency, setFrequency] = useState('monthly');
  const [date, setDate] = useState('');
  const [applyTax, setApplyTax] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState('');

  // Loan-specific fields
  const [loanName, setLoanName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [interestRateType, setInterestRateType] = useState('annual');
  const [loanTerm, setLoanTerm] = useState('');
  const [termUnit, setTermUnit] = useState('months');
  const [startDate, setStartDate] = useState('');

  const convertedAmount = () => {
    if (!exchangeRates || !amount || currency === settings.baseCurrency) return null;
    const rate = exchangeRates[currency];
    if (!rate) return null;
    const converted = parseFloat(amount) / rate;
    return `≈ ${formatMoney(converted, settings.baseCurrency)}`;
  };

  const expenseCategories = [
    'Accommodation', 'Groceries', 'Restaurant & Bars', 'Transport',
    'Insurance', 'Mobile', 'Internet', 'Subscription', 'Entertainment',
    'Healthcare', 'Education', 'Shopping', 'Other'
  ];

  const incomeCategories = [
    'Main Job', 'Second Job', 'Freelance', 'Passive Income', 'Rental Income',
    'Allowance', 'Government Support', 'Other'
  ];

  const frequencies = ['one-time', 'weekly', 'biweekly', 'monthly', 'semiannually', 'yearly'];

  const formatFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'one-time': return 'One time';
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Biweekly';
      case 'monthly': return 'Monthly';
      case 'semiannually': return 'Semiannually';
      case 'yearly': return 'Yearly';
      default: return frequency.charAt(0).toUpperCase() + frequency.slice(1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (entryType === 'loan') {
      const termInMonths = termUnit === 'years' ? parseInt(loanTerm) * 12 : parseInt(loanTerm);

      // Loan calculations expect an annual rate
      const annualInterestRate = interestRateType === 'monthly'
        ? parseFloat(interestRate) * 12
        : parseFloat(interestRate);

      const newLoan = {
        name: loanName,
        principal: parseFloat(principal),
        interestRate: annualInterestRate,
        termMonths: termInMonths,
        startDate,
        currency,
        type: 'loan'
      };

      addLoan(newLoan);

      setLoanName('');
      setPrincipal('');
      setInterestRate('');
      setInterestRateType('annual');
      setLoanTerm('');
      setTermUnit('months');
      setStartDate('');
    } else {
      const finalDescription = description === 'Add Custom Category' ? customDescription : description;

      // Net amount for income with tax applied
      let finalAmount = parseFloat(amount);
      if (entryType === 'income' && applyTax && taxPercentage) {
        const taxRate = parseFloat(taxPercentage) / 100;
        finalAmount = finalAmount * (1 - taxRate);
      }

      const newEntry = {
        description: finalDescription,
        amount: finalAmount,
        currency,
        category: frequency,
        date: frequency === 'one-time' ? date : undefined,
        notes: optionalDescription.trim() || undefined,
        ...(entryType === 'income' && applyTax && taxPercentage && {
          grossAmount: parseFloat(amount),
          taxPercentage: parseFloat(taxPercentage)
        })
      };

      if (entryType === 'cost') addCost(newEntry);
      else addIncome(newEntry);

      setDescription('');
      setCustomDescription('');
      setAmount('');
      setFrequency('monthly');
      setDate('');
      setApplyTax(false);
      setTaxPercentage('');
    }

    if (entryType !== 'loan') {
      setOptionalDescription('');
    }
    setCurrency(settings.baseCurrency);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Entry Type and Frequency */}
        <FormRow columns={entryType === 'loan' ? 1 : 2}>
          <FormField label="Type" required>
            <Select value={entryType} onChange={(e) => {
              setEntryType(e.target.value);
              setDescription('');
              setCustomDescription('');
            }}>
              <option key="cost" value="cost">Expense</option>
              <option key="income" value="income">Income</option>
              <option key="loan" value="loan">Loan</option>
            </Select>
          </FormField>
          {entryType !== 'loan' && (
            <FormField label="Frequency" required>
              <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                {frequencies.map(f => (
                  <option key={f} value={f}>
                    {formatFrequencyLabel(f)}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
        </FormRow>

        {/* Loan Name or Category Selection */}
        {entryType === 'loan' ? (
          <FormField label="Loan Name" required>
            <Input
              type="text"
              value={loanName}
              onChange={(e) => setLoanName(e.target.value)}
              placeholder="e.g., Mortgage, Car Loan, Personal Loan..."
            />
          </FormField>
        ) : (
          <div className="space-y-4">
            <FormField label="Choose Category" required>
              <Select value={description} onChange={(e) => setDescription(e.target.value)}>
                <option key="disabled" value="" disabled>Select a category...</option>
                {(entryType === 'cost' ? expenseCategories : incomeCategories).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option key="custom" value="Add Custom Category">Add Custom Category...</option>
              </Select>
            </FormField>

            {description === 'Add Custom Category' && (
              <FormField label="Custom Category Name" required>
                <Input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder={entryType === 'cost' ? "e.g., Coffee, Gym membership..." : "e.g., Weekend Job, Photography Gig..."}
                />
              </FormField>
            )}
          </div>
        )}

        {/* Optional description */}
        {entryType !== 'loan' && (
          <FormField label="Add Description (Optional)">
            <Input
              type="text"
              value={optionalDescription}
              onChange={(e) => setOptionalDescription(e.target.value)}
              placeholder="e.g., Monthly Netflix Subscription"
            />
          </FormField>
        )}

        {/* Loan details or amount */}
        {entryType === 'loan' ? (
          <div className="space-y-4">
            <FormRow columns={2}>
              <FormField label="Loan Amount" required>
                <Input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="ledger-figure font-semibold"
                />
              </FormField>
              <FormField label="Currency" required>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {settings.availableCurrencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </FormRow>

            <FormRow columns={2}>
              <FormField label={`Interest Rate (${interestRateType === 'annual' ? 'Annual' : 'Monthly'} %)`} required>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder={interestRateType === 'annual' ? "e.g., 5.5" : "e.g., 0.46"}
                      step="0.01"
                      min="0"
                      max="100"
                      className="ledger-figure font-semibold"
                    />
                  </div>
                  <div className="w-28">
                    <Select value={interestRateType} onChange={(e) => setInterestRateType(e.target.value)}>
                      <option value="annual">Annual</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                  </div>
                </div>
              </FormField>
              <FormField label="Loan Term" required>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(e.target.value)}
                      placeholder="30"
                      min="1"
                      className="ledger-figure font-semibold"
                    />
                  </div>
                  <div className="w-28">
                    <Select value={termUnit} onChange={(e) => setTermUnit(e.target.value)}>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </Select>
                  </div>
                </div>
              </FormField>
            </FormRow>

            <FormField label="Start Date" required>
              <DateInput
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                required
              />
            </FormField>
          </div>
        ) : (
          <div className="space-y-3">
            <FormRow columns={2}>
              <FormField label="Amount" required>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="ledger-figure font-semibold"
                />
              </FormField>
              <FormField label="Currency" required>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {settings.availableCurrencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </FormRow>

            {convertedAmount() && (
              <div className="text-center">
                <p className="ledger-figure text-sm text-ink-soft bg-card-deep border border-line rounded px-3 py-1.5 inline-block">
                  {convertedAmount()} in {settings.baseCurrency}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tax option for income */}
        {entryType === 'income' && (
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="applyTax"
                checked={applyTax}
                onChange={(e) => setApplyTax(e.target.checked)}
                className="w-4 h-4 accent-[#2e6b4e]"
              />
              <label htmlFor="applyTax" className="ledger-label cursor-pointer">
                Apply Tax %
              </label>
            </div>

            {applyTax && (
              <FormField label="Tax Percentage">
                <Input
                  type="number"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(e.target.value)}
                  placeholder="e.g., 20"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </FormField>
            )}

            {applyTax && taxPercentage && amount && (
              <div className="text-center">
                <p className="ledger-figure text-sm text-ink-soft bg-card-deep border border-line rounded px-3 py-1.5 inline-block">
                  Net Income: {formatMoney(parseFloat(amount) * (1 - parseFloat(taxPercentage) / 100), currency)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Date for one-time entries */}
        {frequency === 'one-time' && entryType !== 'loan' && (
          <FormField label="Date" required>
            <DateInput
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="DD/MM/YYYY"
              required
            />
          </FormField>
        )}

        {/* Submit */}
        <div className="pt-2">
          <button type="submit" className="btn btn-primary w-full !py-3">
            <Plus size={18} />
            <span>Post {entryType === 'cost' ? 'Expense' : entryType === 'income' ? 'Income' : 'Loan'} to Ledger</span>
          </button>
        </div>
      </form>
    </div>
  );
}
