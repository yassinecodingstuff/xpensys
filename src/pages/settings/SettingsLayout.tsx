import type { FC } from 'react';
import { Outlet } from 'react-router-dom';

const SettingsLayout: FC = () => {
  return (
    <div className="space-y-6">
      <Outlet />
    </div>
  );
};

export default SettingsLayout;
