import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pendingApprovalsMock = 3;
  const isAuthPage = location.pathname === '/login';

  if (isAuthPage) {
    return <>{children}</>;
  }

  // TODO: re-enable auth guard when backend auth is active
  // const token = localStorage.getItem('xpensys_access_token');
  // if (!token) {
  //   return <Navigate to="/login" replace />;
  // }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="flex min-h-screen">
        <Sidebar
          variant="desktop"
          pendingApprovalsCount={pendingApprovalsMock}
        />

        <div className="flex min-h-screen flex-1 flex-col md:ml-60">
          <Header
            onToggleSidebar={() => setSidebarOpen(true)}
            hasNotifications
          />
          <main className="flex-1">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      <Sidebar
        variant="mobile"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingApprovalsCount={pendingApprovalsMock}
      />
    </div>
  );
};

export default MainLayout;


