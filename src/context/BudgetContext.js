'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getLatestRates } from '@/utils/currency';
import { currencies } from '@/utils/currencies';

// Custom hook for persisting state to local storage
function usePersistentState(key, defaultValue) {
  const [state, setState] = useState(defaultValue);
  const [isHydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        setState(JSON.parse(storedValue));
      }
    } catch (error) {
      console.error(error);
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(error);
      }
    }
  }, [key, state, isHydrated]);

  return [state, setState];
}


const BudgetContext = createContext();

export function useBudget() {
  return useContext(BudgetContext);
}

const initialDummyData = {
  costs: [],
  income: [],
  settings: {
    baseCurrency: 'EUR',
    availableCurrencies: currencies,
  },
  currentCapital: 0,
  startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  startingCapitalCurrency: 'EUR',
  projectionDisplayCurrency: 'EUR',
};

export function BudgetProvider({ children }) {
  const [costs, setCosts] = usePersistentState('costs', initialDummyData.costs);
  const [income, setIncome] = usePersistentState('income', initialDummyData.income);
  const [settings, setSettings] = usePersistentState('settings', initialDummyData.settings);
  const [startingCapitalCurrency, setStartingCapitalCurrency] = usePersistentState('startingCapitalCurrency', initialDummyData.startingCapitalCurrency);
  const [projectionDisplayCurrency, setProjectionDisplayCurrency] = usePersistentState('projectionDisplayCurrency', initialDummyData.projectionDisplayCurrency);
  const [currentCapital, setCurrentCapital] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const saved = localStorage.getItem('currentCapital');
    return saved ? JSON.parse(saved) : 0;
  });
  const [startDate, setStartDate] = useState(() => {
    if (typeof window === 'undefined') return '2024-01-01';
    const saved = localStorage.getItem('startDate');
    return saved ? JSON.parse(saved) : '2024-01-01';
  });
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

  const deleteCost = (id) => {
    setCosts(costs.filter(cost => cost.id !== id));
  };

  const deleteIncome = (id) => {
    setIncome(income.filter(inc => inc.id !== id));
  };

  const setCapital = (amount) => {
    setCurrentCapital(amount);
  };

  const resetAllData = () => {
    setCosts([]);
    setIncome([]);
    setCurrentCapital(0);
  };

  useEffect(() => {
    localStorage.setItem('costs', JSON.stringify(costs));
    localStorage.setItem('income', JSON.stringify(income));
    localStorage.setItem('settings', JSON.stringify(settings));
    localStorage.setItem('currentCapital', JSON.stringify(currentCapital));
    localStorage.setItem('startDate', JSON.stringify(startDate));
  }, [costs, income, settings, currentCapital, startDate]);

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
    startingCapitalCurrency,
    setStartingCapitalCurrency,
    projectionDisplayCurrency,
    setProjectionDisplayCurrency,
    addCost,
    addIncome,
    deleteCost,
    deleteIncome,
    exchangeRates,
    setCapital,
    resetAllData,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
} 