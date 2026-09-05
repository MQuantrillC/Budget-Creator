'use client';

import { useState, useEffect } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { Banknote } from 'lucide-react';
import { formatMoney } from '@/utils/budgetMath';

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
    return `≈ ${formatMoney(converted, settings.baseCurrency)}`;
  };

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Amount */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Banknote className="h-5 w-5 text-ink-faint" />
          </div>
          <input
            id="current-capital"
            type="text"
            value={displayAmount}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="ledger-input ledger-figure !pl-10 !py-3 !text-xl font-semibold text-center"
            placeholder="0"
          />
        </div>

        {/* Currency */}
        <select
          value={startingCapitalCurrency}
          onChange={(e) => setStartingCapitalCurrency(e.target.value)}
          className="ledger-input !py-3 text-center font-medium"
        >
          {settings.availableCurrencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} - {c.name}
            </option>
          ))}
        </select>
      </div>

      {convertedAmount() && (
        <div className="text-center">
          <p className="ledger-figure text-sm text-ink-soft bg-card-deep border border-line rounded px-3 py-1.5 inline-block">
            {convertedAmount()} in {settings.baseCurrency}
          </p>
        </div>
      )}
    </div>
  );
}
