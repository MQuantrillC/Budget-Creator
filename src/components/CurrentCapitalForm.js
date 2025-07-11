'use client';

import { useState, useEffect } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { Banknote } from 'lucide-react';

// Format number with commas
const formatNumberWithCommas = (num) => {
  if (num === '' || num === null || num === undefined) return '';
  const number = parseFloat(num);
  if (isNaN(number)) return '';
  return new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2 
  }).format(number);
};

export default function CurrentCapitalForm() {
  const { 
    currentCapital, 
    setCapital, 
    settings, 
    startingCapitalCurrency, 
    setStartingCapitalCurrency, 
    exchangeRates 
  } = useBudget();
  const [amount, setAmount] = useState(currentCapital.toString());
  const [displayAmount, setDisplayAmount] = useState(formatNumberWithCommas(currentCapital));

  useEffect(() => {
    setAmount(currentCapital.toString());
    setDisplayAmount(formatNumberWithCommas(currentCapital));
  }, [currentCapital]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    // Remove all non-digit characters except decimal point
    const cleanValue = inputValue.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    const formattedCleanValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleanValue;
    
    setAmount(formattedCleanValue);
    setDisplayAmount(formatNumberWithCommas(formattedCleanValue));
  };

  const handleBlur = () => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount)) {
      setCapital(parsedAmount);
      setDisplayAmount(formatNumberWithCommas(parsedAmount));
    } else {
      setAmount(currentCapital.toString());
      setDisplayAmount(formatNumberWithCommas(currentCapital));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
      e.target.blur();
    }
  };

  const convertedAmount = () => {
    if (!exchangeRates || !amount || startingCapitalCurrency === settings.baseCurrency) return null;
    const rate = exchangeRates[startingCapitalCurrency];
    if (!rate) return null;
    const converted = parseFloat(amount) / rate;
    return `≈ ${new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(converted)}`;
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Amount and Currency Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Amount Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Banknote className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="current-capital"
            type="text"
            value={displayAmount}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-3 text-xl font-semibold text-center bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-500"
            placeholder="0"
          />
        </div>

        {/* Currency Selection */}
        <div className="relative">
          <select
            value={startingCapitalCurrency}
            onChange={(e) => setStartingCapitalCurrency(e.target.value)}
            className="w-full py-3 px-4 text-center bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none font-medium text-gray-700"
          >
            {settings.availableCurrencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Conversion Display */}
      {convertedAmount() && (
        <div className="text-center">
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 inline-block">
            {convertedAmount()} in {settings.baseCurrency}
          </p>
        </div>
      )}
    </div>
  );
} 