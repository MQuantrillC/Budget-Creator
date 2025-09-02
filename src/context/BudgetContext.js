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
  
  // Use regular state for all users, handle persistence separately
  const [costs, setCosts] = useState(initialDummyData.costs);
  const [income, setIncome] = useState(initialDummyData.income);
  const [loans, setLoans] = useState(initialDummyData.loans);
  const [settings, setSettings] = useState(initialDummyData.settings);
  const [startingCapitalCurrency, setStartingCapitalCurrency] = useState(initialDummyData.startingCapitalCurrency);
  const [projectionDisplayCurrency, setProjectionDisplayCurrency] = useState(initialDummyData.projectionDisplayCurrency);
  const [timeframe, setTimeframe] = useState(initialDummyData.timeframe);
  const [savingsGoal, setSavingsGoal] = useState(initialDummyData.savingsGoal);
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Load initial data from local storage for guests
  useEffect(() => {
    if (isGuest && !session && typeof window !== 'undefined') {
      console.log('Loading guest data from local storage');
      try {
        const storedCosts = localStorage.getItem('costs');
        const storedIncome = localStorage.getItem('income');
        const storedLoans = localStorage.getItem('loans');
        const storedSettings = localStorage.getItem('settings');
        const storedCurrentCapital = localStorage.getItem('currentCapital');
        const storedStartDate = localStorage.getItem('startDate');
        const storedTimeframe = localStorage.getItem('timeframe');
        const storedStartingCapitalCurrency = localStorage.getItem('startingCapitalCurrency');
        const storedProjectionDisplayCurrency = localStorage.getItem('projectionDisplayCurrency');
        const storedSavingsGoal = localStorage.getItem('savingsGoal');
        
        if (storedCosts) setCosts(JSON.parse(storedCosts));
        if (storedIncome) setIncome(JSON.parse(storedIncome));
        if (storedLoans) setLoans(JSON.parse(storedLoans));
        if (storedSettings) setSettings(JSON.parse(storedSettings));
        if (storedCurrentCapital) setCurrentCapital(JSON.parse(storedCurrentCapital));
        if (storedStartDate) setStartDate(JSON.parse(storedStartDate));
        if (storedTimeframe) setTimeframe(JSON.parse(storedTimeframe));
        if (storedStartingCapitalCurrency) setStartingCapitalCurrency(JSON.parse(storedStartingCapitalCurrency));
        if (storedProjectionDisplayCurrency) setProjectionDisplayCurrency(JSON.parse(storedProjectionDisplayCurrency));
        if (storedSavingsGoal) setSavingsGoal(JSON.parse(storedSavingsGoal));
      } catch (error) {
        console.error('Error loading guest data from local storage:', error);
      }
    }
  }, [isGuest, session]);
  
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
  const [currentCapital, setCurrentCapital] = useState(0);
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth());
  const [exchangeRates, setExchangeRates] = useState(null);

  useEffect(() => {
    async function fetchRates() {
      const rates = await getLatestRates(settings.baseCurrency);
      setExchangeRates(rates);
    }
    fetchRates();
  }, [settings.baseCurrency]);

  // Detect user changes and clear data
  useEffect(() => {
    const newUserId = session?.user?.id || null;
    
    console.log('🔍 USER CHANGE CHECK:');
    console.log('  Current User ID:', currentUserId);
    console.log('  New User ID:', newUserId);
    
    if (currentUserId !== newUserId) {
      console.log('👤 USER CHANGED:', currentUserId, '->', newUserId);
      
      // Clear previous user's data first
      console.log('🧹 Clearing previous user data...');
      setCosts(initialDummyData.costs);
      setIncome(initialDummyData.income);
      setLoans(initialDummyData.loans);
      setSettings(initialDummyData.settings);
      setCurrentCapital(initialDummyData.currentCapital);
      setStartDate(initialDummyData.startDate);
      setStartingCapitalCurrency(initialDummyData.startingCapitalCurrency);
      setProjectionDisplayCurrency(initialDummyData.projectionDisplayCurrency);
      setTimeframe(initialDummyData.timeframe);
      setSavingsGoal(initialDummyData.savingsGoal);
      
      setCurrentUserId(newUserId);
      setIsDataLoaded(false);
    }
  }, [session?.user?.id, currentUserId]);

  // Load user data when needed
  useEffect(() => {
    async function loadUserData() {
      console.log('💾 BUDGET DATA LOADING:');
      console.log('  Session:', session ? `${session.user.email} (${session.user.id})` : 'None');
      console.log('  Is Guest:', isGuest);
      console.log('  Data Loaded:', isDataLoaded);
      
      if (session?.user?.id && !isDataLoaded) {
        console.log('📥 Loading Supabase data for authenticated user:', session.user.id);
        const { data, error } = await loadUserBudgetData();
        
        if (error) {
          console.error('❌ Failed to load user data:', error);
        } else if (data) {
          console.log('✅ User data loaded from Supabase:', Object.keys(data));
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
        } else {
          console.log('ℹ️ No existing data found for user - starting fresh');
        }
        setIsDataLoaded(true);
      } else if (isGuest && !isDataLoaded) {
        // Guest mode
        console.log('👤 Guest mode - using local storage');
        setIsDataLoaded(true);
      }
    }

    loadUserData();
  }, [session, isGuest, isDataLoaded]);



  // Save user data when it changes (for authenticated users only)
  useEffect(() => {
    async function saveUserData() {
      if (session?.user?.id && isDataLoaded) {
        console.log('💾 SAVING DATA:');
        console.log('  User:', session.user.email, '(' + session.user.id + ')');
        console.log('  Data items:', { costs: costs.length, income: income.length, loans: loans.length });
        
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
          console.error('❌ Failed to save budget data:', error);
        } else {
          console.log('✅ Budget data saved to Supabase successfully');
        }
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

  // Save to local storage ONLY for guest users
  useEffect(() => {
    if (isGuest && !session) {
      console.log('Saving to local storage (guest mode)');
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
    } else if (session?.user?.id) {
      console.log('Authenticated user - NOT saving to local storage, using Supabase instead');
    }
  }, [costs, income, loans, settings, currentCapital, startDate, timeframe, startingCapitalCurrency, projectionDisplayCurrency, savingsGoal, isGuest, session]);

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