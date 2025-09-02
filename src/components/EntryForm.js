'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { Plus, Info } from 'lucide-react';
import DateInput from './DateInput';
import Tooltip from './Tooltip';

function FormSection({ title, children }) {
  return (
    <div className="space-y-3">
      {title && <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{title}</h4>}
      {children}
    </div>
  );
}

function FormRow({ children, columns = 1 }) {
  const gridCols = columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';
  return <div className={`grid ${gridCols} gap-4`}>{children}</div>;
}

function FormField({ label, children, required = false }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input 
      {...props} 
      className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 ${className}`} 
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select 
      {...props} 
      className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 text-gray-900 dark:text-gray-100 ${className}`}
    >
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
    return `≈ ${new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(converted)}`;
  }

  const expenseCategories = [
    'Accommodation', 'Groceries', 'Restaurant & Bars', 'Transport', 
    'Insurance', 'Mobile', 'Internet', 'Subscription', 'Entertainment',
    'Healthcare', 'Education', 'Shopping', 'Other'
  ];

  const incomeCategories = [
    'Main Job', 'Second Job', 'Freelance', 'Passive Income', 'Rental Income', 
    'Allowance', 'Government Support', 'Other'
  ];
  
  // Updated frequency options with proper order
  const costFrequencies = ['one-time', 'weekly', 'biweekly', 'monthly', 'semiannually', 'yearly'];
  const incomeFrequencies = ['one-time', 'weekly', 'biweekly', 'monthly', 'semiannually', 'yearly'];

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
      // Handle loan submission
      const termInMonths = termUnit === 'years' ? parseInt(loanTerm) * 12 : parseInt(loanTerm);
      
      // Convert monthly rate to annual if needed (loan calculations expect annual rate)
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
      
      // Reset loan form
      setLoanName('');
      setPrincipal('');
      setInterestRate('');
      setInterestRateType('annual');
      setLoanTerm('');
      setTermUnit('months');
      setStartDate('');
    } else {
      // Handle regular income/expense submission
      const finalDescription = description === 'Add Custom Category' ? customDescription : description;
      
      // Calculate net amount for income with tax applied
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
        notes: optionalDescription.trim() || undefined, // Only include if not empty
        ...(entryType === 'income' && applyTax && taxPercentage && {
          grossAmount: parseFloat(amount),
          taxPercentage: parseFloat(taxPercentage)
        })
      };

      if (entryType === 'cost') addCost(newEntry);
      else addIncome(newEntry);

      // Reset regular form
      setDescription('');
      setCustomDescription('');
      setAmount('');
      setFrequency('monthly');
      setDate('');
      setApplyTax(false);
      setTaxPercentage('');
    }
    
    // Reset common fields
    if (entryType !== 'loan') {
      setOptionalDescription('');
    }
    setCurrency(settings.baseCurrency);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entry Type and Frequency */}
        <FormSection>
          <FormRow columns={entryType === 'loan' ? 1 : 2}>
            <FormField label="Type" required>
              <Select value={entryType} onChange={(e) => {
                setEntryType(e.target.value);
                setDescription(''); // Reset category when type changes
                setCustomDescription(''); // Reset custom category
              }}>
                <option key="cost" value="cost">Expense</option>
                <option key="income" value="income">Income</option>
                <option key="loan" value="loan">Loan</option>
              </Select>
            </FormField>
            {entryType !== 'loan' && (
              <FormField label="Frequency" required>
                <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  {(entryType === 'cost' ? costFrequencies : incomeFrequencies).map(f => (
                    <option key={f} value={f}>
                      {formatFrequencyLabel(f)}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
          </FormRow>
        </FormSection>
        
        {/* Loan Name or Category Selection */}
        {entryType === 'loan' ? (
          <FormSection>
            <FormField label="Loan Name" required>
              <Input 
                type="text" 
                value={loanName} 
                onChange={(e) => setLoanName(e.target.value)} 
                placeholder="e.g., Mortgage, Car Loan, Personal Loan..." 
              />
            </FormField>
          </FormSection>
        ) : (
          <FormSection>
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
          </FormSection>
        )}

        {/* Optional Description - Only for non-loan entries */}
        {entryType !== 'loan' && (
          <FormSection>
            <FormField label="Add Description (Optional)">
              <Input 
                type="text" 
                value={optionalDescription} 
                onChange={(e) => setOptionalDescription(e.target.value)} 
                placeholder="e.g., Monthly Netflix Subscription" 
              />
            </FormField>
          </FormSection>
        )}

        {/* Loan Details */}
        {entryType === 'loan' ? (
          <FormSection>
            {/* Loan Amount and Currency Row */}
            <FormRow columns={2}>
              <FormField label="Loan Amount" required>
                <Input 
                  type="number" 
                  value={principal} 
                  onChange={(e) => setPrincipal(e.target.value)} 
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="font-semibold"
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
            
            {/* Interest Rate and Loan Term Row */}
            <FormRow columns={2}>
              <FormField required>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Interest Rate ({interestRateType === 'annual' ? 'Annual' : 'Monthly'} %)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
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
                        className="font-semibold"
                      />
                    </div>
                    <div className="w-28">
                      <Select value={interestRateType} onChange={(e) => setInterestRateType(e.target.value)} className="text-sm">
                        <option value="annual">Annual</option>
                        <option value="monthly">Monthly</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </FormField>
              <FormField required>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Loan Term
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input 
                        type="number" 
                        value={loanTerm} 
                        onChange={(e) => setLoanTerm(e.target.value)} 
                        placeholder="30"
                        min="1"
                        className="font-semibold"
                      />
                    </div>
                    <div className="w-28">
                      <Select value={termUnit} onChange={(e) => setTermUnit(e.target.value)} className="text-sm">
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </FormField>
            </FormRow>
            
            {/* Start Date Row */}
            <FormField label="Start Date" required>
              <DateInput 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                required
              />
            </FormField>
          </FormSection>
        ) : (
          <FormSection>
            <FormRow columns={2}>
              <FormField label="Amount" required>
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="font-semibold"
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
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 inline-block">
                  {convertedAmount()} in {settings.baseCurrency}
                </p>
              </div>
            )}
          </FormSection>
        )}

        {/* Tax Option for Income */}
        {entryType === 'income' && entryType !== 'loan' && (
          <FormSection>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="applyTax"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="applyTax" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 inline-block">
                    Net Income: {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(parseFloat(amount) * (1 - parseFloat(taxPercentage) / 100))}
                  </p>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Date for One-time entries */}
        {frequency === 'one-time' && entryType !== 'loan' && (
          <FormSection>
            <FormField label="Date" required>
              <DateInput 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                required
              />
            </FormField>
          </FormSection>
        )}
        
        {/* Submit Button */}
        <div className="pt-2">
          <button 
            type="submit" 
            className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-semibold text-base transition-all duration-200 ease-in-out hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transform"
          >
            <Plus size={20} />
            <span>Add {entryType === 'cost' ? 'Expense' : entryType === 'income' ? 'Income' : 'Loan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
} 