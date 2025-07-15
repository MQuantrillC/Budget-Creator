'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { Plus } from 'lucide-react';

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
  const { settings, addCost, addIncome, exchangeRates } = useBudget();
  const [entryType, setEntryType] = useState('cost');
  const [description, setDescription] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [optionalDescription, setOptionalDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(settings.baseCurrency);
  const [frequency, setFrequency] = useState('monthly');
  const [date, setDate] = useState('');

  const convertedAmount = () => {
    if (!exchangeRates || !amount || currency === settings.baseCurrency) return null;
    const rate = exchangeRates[currency];
    if (!rate) return null;
    const converted = parseFloat(amount) / rate;
    return `≈ ${new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(converted)}`;
  }

  const defaultCategories = [
    'Accommodation', 'Groceries', 'Restaurant & Bars', 'Transport', 
    'Insurance', 'Mobile', 'Internet', 'Subscription', 'Entertainment',
    'Healthcare', 'Education', 'Shopping', 'Other'
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
    const finalDescription = description === 'Add Custom Category' ? customDescription : description;
    const newEntry = {
      description: finalDescription,
      amount: parseFloat(amount),
      currency,
      category: frequency,
      date: frequency === 'one-time' ? date : undefined,
      notes: optionalDescription.trim() || undefined, // Only include if not empty
    };

    if (entryType === 'cost') addCost(newEntry);
    else addIncome(newEntry);

    // Reset form
    setDescription('');
    setCustomDescription('');
    setOptionalDescription('');
    setAmount('');
    setCurrency(settings.baseCurrency);
    setFrequency('monthly');
    setDate('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entry Type and Frequency */}
        <FormSection>
          <FormRow columns={2}>
            <FormField label="Type" required>
              <Select value={entryType} onChange={(e) => setEntryType(e.target.value)}>
                <option key="cost" value="cost">Expense</option>
                <option key="income" value="income">Income</option>
              </Select>
            </FormField>
            <FormField label="Frequency" required>
              <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                {(entryType === 'cost' ? costFrequencies : incomeFrequencies).map(f => (
                  <option key={f} value={f}>
                    {formatFrequencyLabel(f)}
                  </option>
                ))}
              </Select>
            </FormField>
          </FormRow>
        </FormSection>
        
        {/* Category Selection */}
        <FormSection>
          <FormField label="Choose Category" required>
            <Select value={description} onChange={(e) => setDescription(e.target.value)}>
              <option key="disabled" value="" disabled>Select a category...</option>
              {defaultCategories.map(c => (
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
                placeholder="e.g., Coffee, Gym membership..." 
              />
            </FormField>
          )}
        </FormSection>

        {/* Optional Description */}
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

        {/* Amount and Currency */}
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

        {/* Date for One-time entries */}
        {frequency === 'one-time' && (
          <FormSection>
            <FormField label="Date" required>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
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
            <span>Add {entryType === 'cost' ? 'Expense' : 'Income'}</span>
          </button>
        </div>
      </form>
    </div>
  );
} 