import type { FC } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, HelpCircle, Menu } from 'lucide-react';
import Avatar from '../ui/Avatar';

export interface HeaderProps {
  onToggleSidebar?: () => void;
  hasNotifications?: boolean;
}

interface Crumb {
  label: string;
  to?: string;
}

const buildBreadcrumbs = (pathname: string): Crumb[] => {
  const segments = pathname.split('/').filter(Boolean);

  const crumbs: Crumb[] = [
    {
      label: 'Dashboard',
      to: '/',
    },
  ];

  if (segments.length === 0) {
    return crumbs;
  }

  const [first, second] = segments;

  switch (first) {
    case 'expenses':
      crumbs.push({
        label: 'Mes dépenses',
        to: '/expenses',
      });
      if (second) {
        crumbs.push({
          label: `Dépense #${second}`,
        });
      }
      break;
    case 'missions':
      crumbs.push({
        label: 'Mes missions',
        to: '/missions',
      });
      if (second) {
        crumbs.push({
          label: `Mission #${second}`,
        });
      }
      break;
    case 'approvals':
      crumbs.push({
        label: 'Approbations',
        to: '/approvals',
      });
      if (second === 'history') {
        crumbs.push({ label: 'Historique' });
      }
      break;
    case 'admin':
      crumbs.push({
        label: 'Administration',
        to: '/admin',
      });
      if (second) {
        const adminMap: Record<string, string> = {
          policies: 'Politiques',
          workflows: 'Workflows',
          users: 'Utilisateurs',
          settings: 'Paramètres',
        };
        crumbs.push({
          label: adminMap[second] ?? second,
        });
      }
      break;
    default:
      crumbs.push({ label: first });
  }

  return crumbs;
};

const Header: FC<HeaderProps> = ({ onToggleSidebar, hasNotifications = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [userName, setUserName] = useState('John Doe');

  const crumbs = useMemo(
    () => buildBreadcrumbs(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    const raw = localStorage.getItem('xpensys_user');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { name?: string };
      if (parsed.name) setUserName(parsed.name);
    } catch {
      // Ignore malformed storage.
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('xpensys_access_token');
    localStorage.removeItem('xpensys_user');
    setAvatarOpen(false);
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:hidden"
            aria-label="Ouvrir la navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <nav className="flex items-center gap-1 text-xs text-slate-500">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <div key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 && <span className="text-slate-300">/</span>}
                  {crumb.to && !isLast ? (
                    <Link
                      to={crumb.to}
                      className="font-medium text-slate-500 hover:text-slate-800"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        isLast
                          ? 'font-semibold text-slate-900'
                          : 'font-medium text-slate-500'
                      }
                    >
                      {crumb.label}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {hasNotifications && (
              <span className="absolute right-1.5 top-1.5 inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Aide"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setAvatarOpen((prev) => !prev)}
              className="flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Avatar name={userName} id="header-user" size="sm" />
              <span className="hidden sm:inline">{userName}</span>
            </button>

            {avatarOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-100 bg-white py-1.5 text-xs shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50"
                >
                  Mon profil
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50"
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


