'use client';

import { useBudget } from '@/context/BudgetContext';
import ProjectionsTable from '@/components/ProjectionsTable';
import Charts from '@/components/Charts';
import Tooltip from '@/components/Tooltip';
import EntryForm from '@/components/EntryForm';
import ClientOnly from '@/components/ClientOnly';
import CurrentCapitalForm from '@/components/CurrentCapitalForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Wallet, TrendingUp, TrendingDown, Flame, Calculator, Target, X } from 'lucide-react';
import ResetDataButton from '@/components/ResetDataButton';

function MetricCard({ icon: Icon, title, value, tooltipText, color = 'default' }) {
  const colorClasses = {
    default: 'bg-gray-50 border-gray-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    red: 'bg-red-50 border-red-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  const iconColorClasses = {
    default: 'text-gray-500',
    green: 'text-green-600',
    blue: 'text-blue-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
  };

  return (
    <Tooltip text={tooltipText}>
      <div className={`${colorClasses[color]} border p-4 rounded-xl transition-all duration-200 hover:shadow-lg group cursor-pointer`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <div className={`p-2 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow duration-200`}>
              <Icon className={`h-5 w-5 ${iconColorClasses[color]}`} />
            </div>
          </div>
        </div>
      </div>
    </Tooltip>
  );
}

export default function HomePage() {
  const { 
    costs, 
    income, 
    currentCapital, 
    settings, 
    exchangeRates, 
    setSettings, 
    startingCapitalCurrency,
    deleteCost,
    deleteIncome 
  } = useBudget();

  const convertToBaseCurrency = (amount, currency) => {
    if (!exchangeRates || currency === settings.baseCurrency) {
      return amount;
    }
    const rate = exchangeRates[currency];
    return rate ? amount / rate : amount;
  }

  const convertToDisplayCurrency = (amount, fromCurrency, toCurrency) => {
    if (!exchangeRates || fromCurrency === toCurrency) return amount;
    
    // First convert to base currency
    const baseAmount = convertToBaseCurrency(amount, fromCurrency);
    
    // Then convert to display currency
    if (toCurrency === settings.baseCurrency) return baseAmount;
    const displayRate = exchangeRates[toCurrency];
    return displayRate ? baseAmount * displayRate : baseAmount;
  };

  // Convert starting capital to display currency
  const currentCapitalInDisplayCurrency = convertToDisplayCurrency(
    currentCapital, 
    startingCapitalCurrency, 
    settings.baseCurrency
  );

  const totalMonthlyCosts = costs
    .filter(cost => cost.category === 'monthly')
    .reduce((acc, cost) => acc + convertToBaseCurrency(cost.amount, cost.currency), 0);

  const totalMonthlyIncome = income
    .filter(inc => inc.category === 'monthly')
    .reduce((acc, inc) => acc + convertToBaseCurrency(inc.amount, inc.currency), 0);
  
  const burnRate = totalMonthlyIncome - totalMonthlyCosts;

  const handleDeleteCost = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteCost(id);
    }
  };

  const handleDeleteIncome = (id) => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      deleteIncome(id);
    }
  };

  if (!exchangeRates) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-gray-600 text-lg">Loading financial data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Entry Forms */}
      <div className="relative py-8 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 shadow-sm">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Budget Creator
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Take control of your finances with intelligent budgeting and projections
          </p>
        </div>

        {/* Main Entry Section - The Dominant Component */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden fade-in">
            <div className="p-6 lg:p-8">
              <div className="space-y-6">
                {/* Current Capital Section */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Set Your Starting Capital</h2>
                  <ClientOnly>
                    <CurrentCapitalForm />
                  </ClientOnly>
                </div>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <div className="bg-white px-3 text-gray-500 text-xs font-medium">
                      Add Income & Expenses
                    </div>
                  </div>
                </div>

                {/* Entry Form Section */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Track Your Finances</h2>
                  <EntryForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Financial Overview</h2>
            <div className="flex justify-center items-center space-x-2 mt-2">
              <p className="text-sm text-gray-600">Display Currency:</p>
              <select
                value={settings.baseCurrency}
                onChange={(e) => setSettings({ ...settings, baseCurrency: e.target.value })}
                className="px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {settings.availableCurrencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              icon={Wallet} 
              title="Current Capital" 
              value={new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(currentCapitalInDisplayCurrency)}
              tooltipText={`Your starting capital: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: startingCapitalCurrency }).format(currentCapital)} (${startingCapitalCurrency}), converted to ${settings.baseCurrency}.`}
              color="blue"
            />
            <MetricCard 
              icon={TrendingDown}
              title="Monthly Costs"
              value={new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(totalMonthlyCosts)}
              tooltipText="Total of all recurring monthly costs, converted to your base currency."
              color="red"
            />
            <MetricCard 
              icon={TrendingUp}
              title="Monthly Income"
              value={new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(totalMonthlyIncome)}
              tooltipText="Total of all recurring monthly income, converted to your base currency."
              color="blue"
            />
            <MetricCard 
              icon={Flame}
              title="Net Monthly Flow"
              value={new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(burnRate)}
              tooltipText="The difference between your monthly income and monthly costs (surplus or deficit)."
              color={burnRate >= 0 ? 'blue' : 'red'}
            />
          </div>
        </div>
      </div>

      {/* Data Overview Section */}
      <div className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-3 space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
              <ResetDataButton />
            </div>
            <p className="text-base text-gray-600">Overview of your income and expenses</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costs.length > 0 ? costs.map((cost) => (
                    <div key={cost.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow group">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{cost.description}</p>
                        <p className="text-xs text-gray-500 capitalize">{cost.category}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="font-mono text-base font-bold text-red-600">
                            -{new Intl.NumberFormat('en-US', { style: 'currency', currency: cost.currency, minimumFractionDigits: 2 }).format(cost.amount)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteCost(cost.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete expense"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <div className="p-3 rounded-full bg-gray-100 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <TrendingDown className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-gray-600">No expenses recorded yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                  Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {income.length > 0 ? income.map((inc) => (
                    <div key={inc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow group">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{inc.description}</p>
                        <p className="text-xs text-gray-500 capitalize">{inc.category}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="font-mono text-base font-bold text-blue-600">
                            +{new Intl.NumberFormat('en-US', { style: 'currency', currency: inc.currency, minimumFractionDigits: 2 }).format(inc.amount)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteIncome(inc.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete income"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <div className="p-3 rounded-full bg-gray-100 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-gray-600">No income recorded yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Financial Projections</h2>
            <p className="text-lg text-gray-600">Visualize your financial future</p>
          </div>
          
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-8">
              <ClientOnly>
                <Charts />
              </ClientOnly>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Projections Table Section */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Detailed Projections</h2>
            <p className="text-lg text-gray-600">Month-by-month financial breakdown</p>
          </div>
          
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-8">
              <ClientOnly>
                <ProjectionsTable />
              </ClientOnly>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 