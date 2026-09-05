'use client';

import { useState, useEffect, useRef } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { ArrowRightLeft, X } from 'lucide-react';

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

  // PEN (Peruvian Sol) is fetched from Open Exchange Rates API
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
        className="btn btn-secondary !py-1.5 !px-3 text-xs"
        title="Exchange Rates"
      >
        <ArrowRightLeft className="h-3.5 w-3.5" />
        <span>Rates</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 ledger-card z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="ledger-label !text-ink">Exchange Rates</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-ink-faint hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="ledger-figure text-xs text-ink-faint mb-2">
                Base: {settings.baseCurrency} (1 {settings.baseCurrency} =)
              </div>

              {displayRates.map(({ code, rate, name }) => (
                <div key={code} className="flex justify-between items-center py-1 border-b border-line last:border-b-0">
                  <div className="flex items-center space-x-2">
                    <span className="ledger-figure text-sm font-medium text-ink">{code}</span>
                    <span className="text-xs text-ink-faint">{name}</span>
                  </div>
                  <span className="ledger-figure text-sm text-ink-soft">
                    {rate.toFixed(4)}
                  </span>
                </div>
              ))}

              {displayRates.length === 0 && (
                <div className="text-sm text-ink-faint text-center py-2">
                  No rates available
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-line">
              <div className="text-[11px] text-ink-faint">
                Rates from Frankfurter API &amp; Open Exchange Rates
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
