import type { FC } from 'react';
import { Outlet } from 'react-router-dom';

const AdminPage: FC = () => {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  );
};

export default AdminPage;

