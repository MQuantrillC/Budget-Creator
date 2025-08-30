'use client';

import { useState, useEffect, useRef } from 'react';
import { useBudget } from '@/context/BudgetContext';

export default function ExchangeRatesTooltip() {
  const { exchangeRates, settings } = useBudget();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!exchangeRates) {
    return null;
  }

  // Get the most common currencies to display (excluding base currency)
  // Note: PEN (Peruvian Sol) is fetched from Open Exchange Rates API
  const commonCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'PEN'];
  
  const displayRates = commonCurrencies
    .filter(code => code !== settings.baseCurrency && exchangeRates[code])
    .map(code => ({
      code,
      rate: exchangeRates[code],
      name: settings.availableCurrencies.find(c => c.code === code)?.name || code
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:text-gray-100 transition-colors text-sm font-medium"
        title="Exchange Rates"
      >
        <i className="fas fa-arrow-right-arrow-left h-4 w-4"></i>
        <span>XR</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-100">Exchange Rates</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-2">
                Base: {settings.baseCurrency} (1 {settings.baseCurrency} =)
              </div>
              
              {displayRates.map(({ code, rate, name }) => (
                <div key={code} className="flex justify-between items-center py-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-200">{code}</span>
                    <span className="text-xs text-gray-400">{name}</span>
                  </div>
                  <span className="text-sm font-mono text-gray-300">
                    {rate.toFixed(4)}
                  </span>
                </div>
              ))}
              
              {displayRates.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-2">
                  No rates available
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="text-xs text-gray-400">
                Rates from Frankfurter API & Open Exchange Rates
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 