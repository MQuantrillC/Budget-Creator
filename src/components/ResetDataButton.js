'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { Eraser } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ResetDataButton() {
  const { resetAllData } = useBudget();
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = () => {
    resetAllData();
    setConfirming(false);
    toast.success('All data has been reset.');
  };

  return (
    <>
      <button onClick={() => setConfirming(true)} className="btn btn-secondary !py-1.5 !px-3 !text-[11px]">
        <Eraser className="h-3 w-3" />
        Reset Data
      </button>

      <ConfirmDialog
        open={confirming}
        title="Reset all data"
        message="Are you sure you want to reset all data? Every expense, income entry, loan and goal will be removed. This action cannot be undone."
        confirmLabel="Reset Everything"
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
