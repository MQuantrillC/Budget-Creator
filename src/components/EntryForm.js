'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';

export default function EntryForm() {
  const { settings, addCost, addIncome, exchangeRates } = useBudget();
  const [entryType, setEntryType] = useState('cost');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(settings.baseCurrency);
  const [category, setCategory] = useState('one-time');
  const [date, setDate] = useState('');

  const convertedAmount = () => {
    if (!exchangeRates || !amount || currency === settings.baseCurrency) {
      return null;
    }
    const rate = exchangeRates[currency];
    if (!rate) return null;
    const converted = parseFloat(amount) / rate;
    return `~ ${new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.baseCurrency }).format(converted)}`;
  }

  const costCategories = ['one-time', 'monthly', 'weekly', 'yearly'];
  const incomeCategories = ['one-time', 'monthly', 'biweekly', 'yearly'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      description,
      amount: parseFloat(amount),
      currency,
      category,
      date: category === 'one-time' ? date : undefined,
    };

    if (entryType === 'cost') {
      addCost(newEntry);
    } else {
      addIncome(newEntry);
    }

    // Reset form
    setDescription('');
    setAmount('');
    setCurrency(settings.baseCurrency);
    setCategory('one-time');
    setDate('');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow mt-8">
      <h2 className="text-xl font-bold mb-4">Add New Entry</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Entry Type</label>
            <select value={entryType} onChange={(e) => setEntryType(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              <option value="cost">Cost</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
            {convertedAmount() && <p className="text-sm text-gray-500 mt-1">{convertedAmount()}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              {settings.availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              {(entryType === 'cost' ? costCategories : incomeCategories).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {category === 'one-time' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
            </div>
          )}
        </div>
        <div className="mt-4">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Entry</button>
        </div>
      </form>
    </div>
  );
} 