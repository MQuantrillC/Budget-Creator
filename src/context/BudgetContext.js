'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getLatestRates } from '@/utils/currency';
import { currencies } from '@/utils/currencies';
import { saveUserBudgetData, loadUserBudgetData } from '@/lib/supabaseDatabase';
import { useAuth } from '@/components/AuthProvider';

// Helper function to get first day of current month
function getFirstDayOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

// Unique id for entries (Date.now() alone can collide on rapid adds)
function newEntryId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const BudgetContext = createContext();

export function useBudget() {
  return useContext(BudgetContext);
}

const initialData = {
  costs: [],
  income: [],
  loans: [],
  settings: {
    baseCurrency: 'EUR',
    availableCurrencies: currencies,
  },
  currentCapital: 0,
  startDate: getFirstDayOfCurrentMonth(),
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

  const [costs, setCosts] = useState(initialData.costs);
  const [income, setIncome] = useState(initialData.income);
  const [loans, setLoans] = useState(initialData.loans);
  const [settings, setSettings] = useState(initialData.settings);
  const [currentCapital, setCurrentCapital] = useState(initialData.currentCapital);
  const [startDate, setStartDate] = useState(initialData.startDate);
  const [startingCapitalCurrency, setStartingCapitalCurrency] = useState(initialData.startingCapitalCurrency);
  const [projectionDisplayCurrency, setProjectionDisplayCurrency] = useState(initialData.projectionDisplayCurrency);
  const [timeframe, setTimeframe] = useState(initialData.timeframe);
  const [savingsGoal, setSavingsGoal] = useState(initialData.savingsGoal);
  const [exchangeRates, setExchangeRates] = useState(null);

  // Persistence guards: nothing is saved (locally or remotely) until the
  // initial load for the current user/guest has finished.
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Load guest data from local storage
  useEffect(() => {
    if (isGuest && !session && !isDataLoaded && typeof window !== 'undefined') {
      try {
        const read = (key) => {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : undefined;
        };

        const storedCosts = read('costs');
        const storedIncome = read('income');
        const storedLoans = read('loans');
        const storedSettings = read('settings');
        const storedCurrentCapital = read('currentCapital');
        const storedStartDate = read('startDate');
        const storedTimeframe = read('timeframe');
        const storedStartingCapitalCurrency = read('startingCapitalCurrency');
        const storedProjectionDisplayCurrency = read('projectionDisplayCurrency');
        const storedSavingsGoal = read('savingsGoal');

        if (storedCosts) setCosts(storedCosts);
        if (storedIncome) setIncome(storedIncome);
        if (storedLoans) setLoans(storedLoans);
        if (storedSettings) setSettings(storedSettings);
        if (storedCurrentCapital !== undefined) setCurrentCapital(storedCurrentCapital);
        if (storedStartDate) setStartDate(storedStartDate);
        if (storedTimeframe) setTimeframe(storedTimeframe);
        if (storedStartingCapitalCurrency) setStartingCapitalCurrency(storedStartingCapitalCurrency);
        if (storedProjectionDisplayCurrency) setProjectionDisplayCurrency(storedProjectionDisplayCurrency);
        if (storedSavingsGoal) setSavingsGoal(storedSavingsGoal);
      } catch (error) {
        console.error('Error loading guest data from local storage:', error);
      }
      setIsDataLoaded(true);
    }
  }, [isGuest, session, isDataLoaded]);

  // Migrate stored settings if the app's currency list has changed
  useEffect(() => {
    const currentCurrencyCodes = settings.availableCurrencies.map(c => c.code);
    const newCurrencyCodes = currencies.map(c => c.code);

    if (JSON.stringify(currentCurrencyCodes) !== JSON.stringify(newCurrencyCodes)) {
      setSettings(prev => ({ ...prev, availableCurrencies: currencies }));
    }
  }, [settings.availableCurrencies]);

  useEffect(() => {
    async function fetchRates() {
      const rates = await getLatestRates(settings.baseCurrency);
      setExchangeRates(rates);
    }
    fetchRates();
  }, [settings.baseCurrency]);

  // Detect user changes and clear the previous user's data
  useEffect(() => {
    const newUserId = session?.user?.id || null;

    if (currentUserId !== newUserId) {
      setCosts(initialData.costs);
      setIncome(initialData.income);
      setLoans(initialData.loans);
      setSettings(initialData.settings);
      setCurrentCapital(initialData.currentCapital);
      setStartDate(initialData.startDate);
      setStartingCapitalCurrency(initialData.startingCapitalCurrency);
      setProjectionDisplayCurrency(initialData.projectionDisplayCurrency);
      setTimeframe(initialData.timeframe);
      setSavingsGoal(initialData.savingsGoal);

      setCurrentUserId(newUserId);
      setIsDataLoaded(false);
    }
  }, [session?.user?.id, currentUserId]);

  // Load saved data for authenticated users
  useEffect(() => {
    async function loadUserData() {
      if (session?.user?.id && !isDataLoaded) {
        const { data, error } = await loadUserBudgetData();

        if (error) {
          console.error('Failed to load user data:', error);
        } else if (data) {
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
      }
    }

    loadUserData();
  }, [session, isDataLoaded]);

  // Save to Supabase when data changes (authenticated users, debounced)
  useEffect(() => {
    if (!session?.user?.id || !isDataLoaded) return;

    const timeoutId = setTimeout(async () => {
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

      const { error } = await saveUserBudgetData(budgetData);
      if (error) {
        console.error('Failed to save budget data:', error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [session, costs, income, loans, settings, currentCapital, startDate, startingCapitalCurrency, projectionDisplayCurrency, timeframe, savingsGoal, isDataLoaded]);

  // Save to local storage (guest users, only after initial load)
  useEffect(() => {
    if (isGuest && !session && isDataLoaded) {
      localStorage.setItem('costs', JSON.stringify(costs));
      localStorage.setItem('income', JSON.stringify(income));
      localStorage.setItem('loans', JSON.stringify(loans));
      localStorage.setItem('settings', JSON.stringify(settings));
      localStorage.setItem('currentCapital', JSON.stringify(currentCapital));
      localStorage.setItem('startDate', JSON.stringify(startDate));
      localStorage.setItem('timeframe', JSON.stringify(timeframe));
      localStorage.setItem('startingCapitalCurrency', JSON.stringify(startingCapitalCurrency));
      localStorage.setItem('projectionDisplayCurrency', JSON.stringify(projectionDisplayCurrency));
      localStorage.setItem('savingsGoal', JSON.stringify(savingsGoal));
    }
  }, [costs, income, loans, settings, currentCapital, startDate, timeframe, startingCapitalCurrency, projectionDisplayCurrency, savingsGoal, isGuest, session, isDataLoaded]);

  const addCost = (cost) => {
    setCosts(prev => [...prev, { ...cost, id: newEntryId() }]);
  };

  const addIncome = (inc) => {
    setIncome(prev => [...prev, { ...inc, id: newEntryId() }]);
  };

  const addLoan = (loan) => {
    setLoans(prev => [...prev, { ...loan, id: newEntryId() }]);
  };

  const deleteCost = (id) => {
    setCosts(prev => prev.filter(cost => cost.id !== id));
  };

  const deleteIncome = (id) => {
    setIncome(prev => prev.filter(inc => inc.id !== id));
  };

  const deleteLoan = (id) => {
    setLoans(prev => prev.filter(loan => loan.id !== id));
  };

  const setCapital = (amount) => {
    setCurrentCapital(amount);
  };

  const resetAllData = () => {
    setCosts([]);
    setIncome([]);
    setLoans([]);
    setCurrentCapital(0);
    setSavingsGoal(initialData.savingsGoal);
    setSettings(initialData.settings);
  };

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
