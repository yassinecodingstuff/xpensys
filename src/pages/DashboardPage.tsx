import type { FC } from 'react';

const DashboardPage: FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-primary-700">Tableau de bord</h1>
      <p className="mt-2 text-sm text-slate-600">
        Vue d&apos;ensemble de vos dépenses, missions et notes de frais.
      </p>
    </div>
  );
};

export default DashboardPage;

