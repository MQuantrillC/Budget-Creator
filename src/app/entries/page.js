'use client';

import { useBudget } from '@/context/BudgetContext';
import EntryForm from '@/components/EntryForm';

function CostsList() {
  const { costs } = useBudget();
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Costs</h2>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Description</th>
            <th className="text-left p-2">Amount</th>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {costs.map((cost) => (
            <tr key={cost.id} className="border-b">
              <td className="p-2">{cost.description}</td>
              <td className="p-2">{new Intl.NumberFormat('en-US', { style: 'currency', currency: cost.currency }).format(cost.amount)}</td>
              <td className="p-2 capitalize">{cost.category}</td>
              <td className="p-2">{cost.date || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function IncomeList() {
  const { income } = useBudget();
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Income</h2>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Description</th>
            <th className="text-left p-2">Amount</th>
            <th className="text-left p-2">Category</th>
          </tr>
        </thead>
        <tbody>
          {income.map((inc) => (
            <tr key={inc.id} className="border-b">
              <td className="p-2">{inc.description}</td>
              <td className="p-2">{new Intl.NumberFormat('en-US', { style: 'currency', currency: inc.currency }).format(inc.amount)}</td>
              <td className="p-2 capitalize">{inc.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function EntriesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Entries</h1>
      <p className="mb-4">Add/edit costs & income</p>

      <EntryForm />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CostsList />
        <IncomeList />
      </div>
    </div>
  );
} 