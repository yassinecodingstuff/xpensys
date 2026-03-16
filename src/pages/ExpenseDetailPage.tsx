import type { FC } from 'react';
import { useParams } from 'react-router-dom';

const ExpenseDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-primary-700">
        Détail de la dépense
      </h1>
      <p className="mt-2 text-sm text-slate-600">ID : {id}</p>
    </div>
  );
};

export default ExpenseDetailPage;

