'use client';

import { useBudget } from '@/context/BudgetContext';
import Tooltip from '@/components/Tooltip';

export default function SettingsPage() {
  const { settings, setSettings } = useBudget();

  const handleBaseCurrencyChange = (e) => {
    setSettings({ ...settings, baseCurrency: e.target.value });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Currency Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Tooltip text="Set the default currency for all projections and summaries.">
              <label className="block text-sm font-medium text-gray-700">Base Currency</label>
            </Tooltip>
            <select
              value={settings.baseCurrency}
              onChange={handleBaseCurrencyChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              {settings.availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {/* Future placeholder for managing available currencies */}
        <div className="mt-4">
          <Tooltip text="The list of currencies available in the entry form.">
            <h3 className="text-lg font-semibold text-gray-700">Available Currencies</h3>
          </Tooltip>
            <p className="text-gray-600">
                {settings.availableCurrencies.join(', ')}
            </p>
            <p className="text-sm text-gray-500 mt-2">
                (Currency management will be implemented later)
            </p>
        </div>
      </div>
    </div>
  );
} 