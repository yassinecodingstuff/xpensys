import type { FC } from 'react';

const ApprovalsPage: FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-primary-700">File d&apos;approbation</h1>
      <p className="mt-2 text-sm text-slate-600">
        Liste des dépenses et notes de frais à approuver.
      </p>
    </div>
  );
};

export default ApprovalsPage;

