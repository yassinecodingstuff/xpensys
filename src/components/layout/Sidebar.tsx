import type { FC } from 'react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Receipt,
  Briefcase,
  CheckCircle2,
  History,
  Shield,
  GitBranch,
  Users,
  Settings,
  ChevronDown,
  Building2,
  Network,
  ShieldCheck,
} from 'lucide-react';

export interface SidebarProps {
  variant?: 'desktop' | 'mobile';
  open?: boolean;
  onClose?: () => void;
  pendingApprovalsCount?: number;
}

const sectionTitleClasses =
  'px-3 text-[10px] font-semibold tracking-[0.12em] text-slate-400 mt-4 mb-1';

const linkBase =
  'relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors';

const getNavLinkClass = (isActive: boolean) =>
  [
    linkBase,
    isActive
      ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500'
      : 'text-slate-600 hover:bg-slate-50',
  ]
    .filter(Boolean)
    .join(' ');

const settingsSubItems = [
  { to: '/settings/organization', label: 'Organisation', Icon: Building2 },
  { to: '/settings/departments', label: 'Départements', Icon: Network },
  { to: '/settings/users', label: 'Utilisateurs', Icon: Users },
  { to: '/settings/roles', label: 'Rôles & Permissions', Icon: ShieldCheck },
  { to: '/settings/policies', label: 'Politiques', Icon: Shield },
  { to: '/settings/workflows', label: 'Workflows', Icon: GitBranch },
];

const DesktopSidebar: FC<Omit<SidebarProps, 'variant'>> = ({
  pendingApprovalsCount = 0,
}) => {
  const location = useLocation();
  const isSettingsActive = location.pathname.startsWith('/settings');
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 shrink-0 border-r border-slate-100 bg-white/90 px-3 py-4 md:flex md:flex-col md:gap-4">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500 text-white text-sm font-semibold">
          X
        </div>
        <span className="text-sm font-semibold tracking-tight text-slate-900">
          Xpensys
        </span>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pt-2 pb-4 text-xs">
        <div>
          <div className={sectionTitleClasses}>PRINCIPAL</div>
          <div className="space-y-0.5">
            <NavLink
              end
              to="/"
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              <Home className="h-4 w-4 text-slate-400" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/expenses"
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              <Receipt className="h-4 w-4 text-slate-400" />
              <span>Mes dépenses</span>
            </NavLink>
            <NavLink
              to="/missions"
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              <Briefcase className="h-4 w-4 text-slate-400" />
              <span>Mes missions</span>
            </NavLink>
          </div>
        </div>

        <div>
          <div className={sectionTitleClasses}>APPROBATIONS</div>
          <div className="space-y-0.5">
            <NavLink
              to="/approvals"
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              <span className="flex-1">À approuver</span>
              {pendingApprovalsCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {pendingApprovalsCount}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/approvals/history"
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              <History className="h-4 w-4 text-slate-400" />
              <span>Historique</span>
            </NavLink>
          </div>
        </div>

        <div>
          <div className={sectionTitleClasses}>ADMINISTRATION</div>
          <div className="space-y-0.5">
            <NavLink
              to="/admin/policies"
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              <Shield className="h-4 w-4 text-slate-400" />
              <span>Politiques</span>
            </NavLink>
            <NavLink
              to="/admin/workflows"
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              <GitBranch className="h-4 w-4 text-slate-400" />
              <span>Workflows</span>
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              <Users className="h-4 w-4 text-slate-400" />
              <span>Utilisateurs</span>
            </NavLink>

            {/* Paramètres dropdown */}
            <button
              type="button"
              onClick={() => setSettingsOpen((p) => !p)}
              className={[
                linkBase,
                'w-full',
                isSettingsActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span className="flex-1 text-left">Paramètres</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>
            {settingsOpen && (
              <div className="ml-3 space-y-0.5 border-l border-slate-200 pl-2">
                {settingsSubItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                      ].join(' ')
                    }
                  >
                    <item.Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
};

const MobileSidebar: FC<Omit<SidebarProps, 'variant'>> = ({
  open = false,
  onClose,
  pendingApprovalsCount = 0,
}) => {
  const location = useLocation();
  const isSettingsActive = location.pathname.startsWith('/settings');
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex md:hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-60 flex-col border-r border-slate-100 bg-white/95 px-3 py-4 shadow-xl">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500 text-white text-sm font-semibold">
              X
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Xpensys
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fermer la navigation"
          >
            <span className="block h-4 w-4">×</span>
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-2 overflow-y-auto pt-2 pb-4 text-xs">
          <div>
            <div className={sectionTitleClasses}>PRINCIPAL</div>
            <div className="space-y-0.5">
              <NavLink
                end
                to="/"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <Home className="h-4 w-4 text-slate-400" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/expenses"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <Receipt className="h-4 w-4 text-slate-400" />
                <span>Mes dépenses</span>
              </NavLink>
              <NavLink
                to="/missions"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <Briefcase className="h-4 w-4 text-slate-400" />
                <span>Mes missions</span>
              </NavLink>
            </div>
          </div>

          <div>
            <div className={sectionTitleClasses}>APPROBATIONS</div>
            <div className="space-y-0.5">
              <NavLink
                to="/approvals"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                <span className="flex-1">À approuver</span>
                {pendingApprovalsCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {pendingApprovalsCount}
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/approvals/history"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <History className="h-4 w-4 text-slate-400" />
                <span>Historique</span>
              </NavLink>
            </div>
          </div>

          <div>
            <div className={sectionTitleClasses}>ADMINISTRATION</div>
            <div className="space-y-0.5">
              <NavLink
                to="/admin/policies"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <Shield className="h-4 w-4 text-slate-400" />
                <span>Politiques</span>
              </NavLink>
              <NavLink
                to="/admin/workflows"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <GitBranch className="h-4 w-4 text-slate-400" />
                <span>Workflows</span>
              </NavLink>
              <NavLink
                to="/admin/users"
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <Users className="h-4 w-4 text-slate-400" />
                <span>Utilisateurs</span>
              </NavLink>

              {/* Paramètres dropdown */}
              <button
                type="button"
                onClick={() => setSettingsOpen((p) => !p)}
                className={[
                  linkBase,
                  'w-full',
                  isSettingsActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span className="flex-1 text-left">Paramètres</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
              </button>
              {settingsOpen && (
                <div className="ml-3 space-y-0.5 border-l border-slate-200 pl-2">
                  {settingsSubItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                        ].join(' ')
                      }
                    >
                      <item.Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </div>
  );
};

const Sidebar: FC<SidebarProps> = ({ variant = 'desktop', ...props }) => {
  if (variant === 'mobile') {
    return <MobileSidebar {...props} />;
  }
  return <DesktopSidebar {...props} />;
};

export default Sidebar;


