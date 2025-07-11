'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getLatestRates } from '@/utils/currency';

// Custom hook for persisting state to local storage
function usePersistentState(key, defaultValue) {
  const [state, setState] = useState(() => {
    // This function now only runs on the client
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue);
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    // This effect also only runs on the client
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  return [state, setState];
}


const BudgetContext = createContext();

export function useBudget() {
  return useContext(BudgetContext);
}

const initialDummyData = {
  costs: [
    { id: 1, description: 'Rent', amount: 1200, currency: 'USD', category: 'monthly' },
    { id: 2, description: 'Groceries', amount: 150, currency: 'USD', category: 'weekly' },
    { id: 3, description: 'Car Insurance', amount: 800, currency: 'USD', category: 'yearly' },
    { id: 4, description: 'Flight to PEN', amount: 600, currency: 'EUR', category: 'one-time', date: '2024-08-15' },
  ],
  income: [
    { id: 1, description: 'Salary', amount: 4000, currency: 'USD', category: 'monthly' },
    { id: 2, description: 'Freelance', amount: 500, currency: 'USD', category: 'biweekly' },
  ],
  settings: {
    baseCurrency: 'USD',
    availableCurrencies: ['USD', 'EUR', 'PEN', 'GBP'],
  },
  currentCapital: 10000,
  startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
};


export function BudgetProvider({ children }) {
  const [costs, setCosts] = usePersistentState('costs', initialDummyData.costs);
  const [income, setIncome] = usePersistentState('income', initialDummyData.income);
  const [settings, setSettings] = usePersistentState('settings', initialDummyData.settings);
  const [currentCapital, setCurrentCapital] = usePersistentState('currentCapital', initialDummyData.currentCapital);
  const [startDate, setStartDate] = usePersistentState('startDate', '2024-01-01');
  const [exchangeRates, setExchangeRates] = useState(null);

  useEffect(() => {
    async function fetchRates() {
      const rates = await getLatestRates(settings.baseCurrency);
      setExchangeRates(rates);
    }
    fetchRates();
  }, [settings.baseCurrency]);

  const addCost = (cost) => {
    setCosts([...costs, { ...cost, id: Date.now() }]);
  };

  const addIncome = (inc) => {
    setIncome([...income, { ...inc, id: Date.now() }]);
  };

  const value = {
    costs,
    setCosts,
    income,
    setIncome,
    settings,
    setSettings,
    currentCapital,
    setCurrentCapital,
    startDate,
    setStartDate,
    addCost,
    addIncome,
    exchangeRates,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
} 