'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getLatestRates } from '@/utils/currency';
import { currencies } from '@/utils/currencies';
import { saveUserBudgetData, loadUserBudgetData } from '@/lib/supabaseDatabase';
import { useAuth } from '@/components/AuthProvider';

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

// Helper function to get first day of current month
const getFirstDayOfCurrentMonth = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return firstDay.toISOString().split('T')[0]; // YYYY-MM-DD format
};

const BudgetContext = createContext();

export function useBudget() {
  return useContext(BudgetContext);
}

const initialDummyData = {
  costs: [],
  income: [],
  loans: [],
  settings: {
    baseCurrency: 'EUR',
    availableCurrencies: currencies,
  },
  currentCapital: 0,
  startDate: getFirstDayOfCurrentMonth(), // First day of current month
  startingCapitalCurrency: 'EUR',
  projectionDisplayCurrency: 'EUR',
  timeframe: '1Y', // 6M, 1Y, 2Y, 3Y
  savingsGoal: {
    amount: 0,
    targetDate: '',
    currency: 'EUR',
    goalType: 'objective', // 'objective', 'monthly', 'yearly'
    includeCurrentCapital: true,
    enabled: false
  }
};

export function BudgetProvider({ children }) {
  const { session, isGuest } = useAuth();
  
  const [costs, setCosts] = usePersistentState('costs', initialDummyData.costs);
  const [income, setIncome] = usePersistentState('income', initialDummyData.income);
  const [loans, setLoans] = usePersistentState('loans', initialDummyData.loans);
  const [settings, setSettings] = usePersistentState('settings', initialDummyData.settings);
  const [startingCapitalCurrency, setStartingCapitalCurrency] = usePersistentState('startingCapitalCurrency', initialDummyData.startingCapitalCurrency);
  const [projectionDisplayCurrency, setProjectionDisplayCurrency] = usePersistentState('projectionDisplayCurrency', initialDummyData.projectionDisplayCurrency);
  const [timeframe, setTimeframe] = usePersistentState('timeframe', initialDummyData.timeframe);
  const [savingsGoal, setSavingsGoal] = usePersistentState('savingsGoal', initialDummyData.savingsGoal);
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Update available currencies if they've changed (e.g., PEN was removed)
  useEffect(() => {
    const currentCurrencyCodes = settings.availableCurrencies.map(c => c.code);
    const newCurrencyCodes = currencies.map(c => c.code);
    
    // Check if currencies have changed (e.g., PEN was removed)
    if (JSON.stringify(currentCurrencyCodes) !== JSON.stringify(newCurrencyCodes)) {
      setSettings({
        ...settings,
        availableCurrencies: currencies
      });
    }
  }, [settings.availableCurrencies, settings, setSettings]);
  const [currentCapital, setCurrentCapital] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const saved = localStorage.getItem('currentCapital');
    return saved ? JSON.parse(saved) : 0;
  });
  const [startDate, setStartDate] = useState(() => {
    if (typeof window === 'undefined') return getFirstDayOfCurrentMonth();
    const saved = localStorage.getItem('startDate');
    return saved ? JSON.parse(saved) : getFirstDayOfCurrentMonth();
  });
  const [exchangeRates, setExchangeRates] = useState(null);

  useEffect(() => {
    async function fetchRates() {
      const rates = await getLatestRates(settings.baseCurrency);
      setExchangeRates(rates);
    }
    fetchRates();
  }, [settings.baseCurrency]);

  // Load user data when they log in
  useEffect(() => {
    async function loadUserData() {
      if (session?.user?.id && !isDataLoaded) {
        const { data, error } = await loadUserBudgetData(session.user.id);
        
        if (!error && data) {
          // Load user's saved data
          if (data.costs) setCosts(data.costs);
          if (data.income) setIncome(data.income);
          if (data.loans) setLoans(data.loans);
          if (data.settings) setSettings(data.settings);
          if (data.currentCapital !== undefined) setCurrentCapital(data.currentCapital);
          if (data.startDate) setStartDate(data.startDate);
          if (data.startingCapitalCurrency) setStartingCapitalCurrency(data.startingCapitalCurrency);
          if (data.projectionDisplayCurrency) setProjectionDisplayCurrency(data.projectionDisplayCurrency);
          if (data.timeframe) setTimeframe(data.timeframe);
          if (data.savingsGoal) setSavingsGoal(data.savingsGoal);
        }
        setIsDataLoaded(true);
      } else if (isGuest || !session) {
        // For guests, just mark as loaded (use local storage)
        setIsDataLoaded(true);
      }
    }

    loadUserData();
  }, [session, isGuest, isDataLoaded]);

  // Save user data when it changes (for authenticated users only)
  useEffect(() => {
    async function saveUserData() {
      if (session?.user?.id && isDataLoaded) {
        const budgetData = {
          costs,
          income,
          loans,
          settings,
          currentCapital,
          startDate,
          startingCapitalCurrency,
          projectionDisplayCurrency,
          timeframe,
          savingsGoal
        };

        await saveUserBudgetData(session.user.id, budgetData);
      }
    }

    // Debounce saves to avoid too many database calls
    const timeoutId = setTimeout(saveUserData, 1000);
    return () => clearTimeout(timeoutId);
  }, [session, costs, income, loans, settings, currentCapital, startDate, startingCapitalCurrency, projectionDisplayCurrency, timeframe, savingsGoal, isDataLoaded]);

  const addCost = (cost) => {
    setCosts([...costs, { ...cost, id: Date.now() }]);
  };

  const addIncome = (inc) => {
    setIncome([...income, { ...inc, id: Date.now() }]);
  };

  const addLoan = (loan) => {
    setLoans([...loans, { ...loan, id: Date.now() }]);
  };

  const deleteCost = (id) => {
    setCosts(costs.filter(cost => cost.id !== id));
  };

  const deleteIncome = (id) => {
    setIncome(income.filter(inc => inc.id !== id));
  };

  const deleteLoan = (id) => {
    setLoans(loans.filter(loan => loan.id !== id));
  };

  const setCapital = (amount) => {
    setCurrentCapital(amount);
  };

  const resetAllData = () => {
    setCosts([]);
    setIncome([]);
    setLoans([]);
    setCurrentCapital(0);
    setSavingsGoal(initialDummyData.savingsGoal);
    // Also reset settings to ensure currencies are updated
    setSettings(initialDummyData.settings);
  };

  useEffect(() => {
    localStorage.setItem('costs', JSON.stringify(costs));
    localStorage.setItem('income', JSON.stringify(income));
    localStorage.setItem('loans', JSON.stringify(loans));
    localStorage.setItem('settings', JSON.stringify(settings));
    localStorage.setItem('currentCapital', JSON.stringify(currentCapital));
    localStorage.setItem('startDate', JSON.stringify(startDate));
    localStorage.setItem('timeframe', JSON.stringify(timeframe));
  }, [costs, income, loans, settings, currentCapital, startDate, timeframe]);

  const value = {
    costs,
    setCosts,
    income,
    setIncome,
    loans,
    setLoans,
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
    timeframe,
    setTimeframe,
    savingsGoal,
    setSavingsGoal,
    addCost,
    addIncome,
    addLoan,
    deleteCost,
    deleteIncome,
    deleteLoan,
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