import type { FC } from 'react';

const ExpensesListPage: FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-primary-700">Dépenses</h1>
      <p className="mt-2 text-sm text-slate-600">Liste des dépenses.</p>
    </div>
  );
};

export default ExpensesListPage;

