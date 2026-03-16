import type { FC } from 'react';
import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search,
  Upload,
  UserPlus,
  MoreVertical,
  Mail,
  KeyRound,
  UserX,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

// Types
interface User {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  departement: string;
  role: 'Admin' | 'Manager' | 'Finance' | 'Collaborateur';
  managerId?: string;
  statut: 'actif' | 'inactif' | 'en_attente';
  derniereConnexion?: string;
  avatar?: string;
  stats?: {
    depensesSoumises: number;
    missions: number;
    tauxApprobation: number;
  };
}

// Mock data
const MOCK_USERS: User[] = [
  { id: 'u1', prenom: 'Marie', nom: 'Dupont', email: 'marie.dupont@company.com', departement: 'Commercial', role: 'Collaborateur', managerId: 'u6', statut: 'actif', derniereConnexion: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), stats: { depensesSoumises: 24, missions: 8, tauxApprobation: 92 } },
  { id: 'u2', prenom: 'Thomas', nom: 'Bernard', email: 'thomas.bernard@company.com', departement: 'Tech', role: 'Collaborateur', managerId: 'u7', statut: 'actif', derniereConnexion: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), stats: { depensesSoumises: 12, missions: 3, tauxApprobation: 100 } },
  { id: 'u3', prenom: 'Sophie', nom: 'Martin', email: 'sophie.martin@company.com', departement: 'Commercial', role: 'Collaborateur', managerId: 'u6', statut: 'actif', derniereConnexion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), stats: { depensesSoumises: 45, missions: 15, tauxApprobation: 87 } },
  { id: 'u4', prenom: 'Pierre', nom: 'Durand', email: 'pierre.durand@company.com', departement: 'Tech', role: 'Collaborateur', managerId: 'u7', statut: 'inactif', derniereConnexion: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), stats: { depensesSoumises: 8, missions: 2, tauxApprobation: 75 } },
  { id: 'u5', prenom: 'Lucas', nom: 'Petit', email: 'lucas.petit@company.com', departement: 'Marketing', role: 'Collaborateur', managerId: 'u6', statut: 'en_attente', stats: { depensesSoumises: 0, missions: 0, tauxApprobation: 0 } },
  { id: 'u6', prenom: 'Jean', nom: 'Martin', email: 'jean.martin@company.com', departement: 'Commercial', role: 'Manager', statut: 'actif', derniereConnexion: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), stats: { depensesSoumises: 56, missions: 22, tauxApprobation: 95 } },
  { id: 'u7', prenom: 'Claire', nom: 'Dubois', email: 'claire.dubois@company.com', departement: 'Tech', role: 'Manager', statut: 'actif', derniereConnexion: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), stats: { depensesSoumises: 34, missions: 12, tauxApprobation: 98 } },
  { id: 'u8', prenom: 'Marc', nom: 'Finance', email: 'marc.finance@company.com', departement: 'Finance', role: 'Finance', statut: 'actif', derniereConnexion: new Date(Date.now() - 30 * 60 * 1000).toISOString(), stats: { depensesSoumises: 5, missions: 1, tauxApprobation: 100 } },
  { id: 'u9', prenom: 'Admin', nom: 'System', email: 'admin@company.com', departement: 'IT', role: 'Admin', statut: 'actif', derniereConnexion: new Date().toISOString(), stats: { depensesSoumises: 2, missions: 0, tauxApprobation: 100 } },
  { id: 'u10', prenom: 'Julie', nom: 'Moreau', email: 'julie.moreau@company.com', departement: 'RH', role: 'Collaborateur', managerId: 'u6', statut: 'en_attente', stats: { depensesSoumises: 0, missions: 0, tauxApprobation: 0 } },
  { id: 'u11', prenom: 'Antoine', nom: 'Leroy', email: 'antoine.leroy@company.com', departement: 'Commercial', role: 'Collaborateur', managerId: 'u6', statut: 'en_attente', stats: { depensesSoumises: 0, missions: 0, tauxApprobation: 0 } },
];

const DEPARTEMENTS = ['Commercial', 'Tech', 'Marketing', 'Finance', 'RH', 'IT'];
const ROLES: User['role'][] = ['Admin', 'Manager', 'Finance', 'Collaborateur'];
const STATUTS = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'en_attente', label: 'En attente' },
];

const ROLE_COLORS: Record<User['role'], string> = {
  Admin: 'bg-red-100 text-red-700',
  Manager: 'bg-blue-100 text-blue-700',
  Finance: 'bg-emerald-100 text-emerald-700',
  Collaborateur: 'bg-slate-100 text-slate-700',
};

const STATUT_COLORS: Record<User['statut'], string> = {
  actif: 'bg-green-100 text-green-700',
  inactif: 'bg-gray-100 text-gray-500',
  en_attente: 'bg-amber-100 text-amber-700',
};

const STATUT_LABELS: Record<User['statut'], string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  en_attente: 'En attente',
};

// Composant Avatar
const UserAvatar: FC<{ user: User; size?: 'sm' | 'md' | 'lg' }> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
  };
  return (
    <div className={`flex items-center justify-center rounded-full bg-primary-100 font-medium text-primary-700 ${sizeClasses[size]}`}>
      {user.prenom[0]}{user.nom[0]}
    </div>
  );
};

const UsersAdmin: FC = () => {
  const navigate = useNavigate();
  const [users] = useState<User[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [filterDepartement, setFilterDepartement] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Invitation form state
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteDepartement, setInviteDepartement] = useState('');
  const [inviteRole, setInviteRole] = useState<User['role']>('Collaborateur');
  const [inviteManager, setInviteManager] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  // Stats
  const stats = useMemo(() => {
    const actifs = users.filter((u) => u.statut === 'actif').length;
    const enAttente = users.filter((u) => u.statut === 'en_attente').length;
    return { actifs, enAttente };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        `${u.prenom} ${u.nom}`.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchDept = !filterDepartement || u.departement === filterDepartement;
      const matchRole = !filterRole || u.role === filterRole;
      const matchStatut = !filterStatut || u.statut === filterStatut;
      return matchSearch && matchDept && matchRole && matchStatut;
    });
  }, [users, search, filterDepartement, filterRole, filterStatut]);

  const getManager = (managerId?: string) => {
    if (!managerId) return null;
    return users.find((u) => u.id === managerId);
  };

  const formatLastConnection = (date?: string) => {
    if (!date) return '—';
    return format(new Date(date), "dd MMM yyyy 'à' HH:mm", { locale: fr });
  };

  const resetInviteForm = () => {
    setInviteEmails('');
    setInviteDepartement('');
    setInviteRole('Collaborateur');
    setInviteManager('');
    setInviteMessage('');
  };

  const managers = users.filter((u) => u.role === 'Manager' || u.role === 'Admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Utilisateurs</h1>
          <p className="mt-1 text-sm text-slate-500">
            {stats.actifs} utilisateurs actifs · {stats.enAttente} en attente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Upload className="h-4 w-4" />}>
            Import CSV
          </Button>
          <Button variant="primary" size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setInviteModalOpen(true)}>
            Inviter
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Input
            type="search"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>
        <select
          value={filterDepartement}
          onChange={(e) => setFilterDepartement(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Tous les départements</option>
          {DEPARTEMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Tous les rôles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {(filterDepartement || filterRole || filterStatut) && (
          <button
            type="button"
            onClick={() => { setFilterDepartement(''); setFilterRole(''); setFilterStatut(''); }}
            className="text-sm text-primary-600 hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Utilisateur</th>
                <th className="px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="px-4 py-3 font-medium text-slate-600">Département</th>
                <th className="px-4 py-3 font-medium text-slate-600">Rôle</th>
                <th className="px-4 py-3 font-medium text-slate-600">Manager</th>
                <th className="px-4 py-3 font-medium text-slate-600">Statut</th>
                <th className="px-4 py-3 font-medium text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const manager = getManager(user.managerId);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link to={`/admin/users/${user.id}`} className="flex items-center gap-3 hover:opacity-80">
                          <UserAvatar user={user} size="sm" />
                          <span className="font-medium text-slate-900">{user.prenom} {user.nom}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 text-slate-600">{user.departement}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {manager ? (
                          <Link
                            to={`/admin/users/${manager.id}`}
                            className="text-primary-600 hover:underline"
                          >
                            {manager.prenom} {manager.nom}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[user.statut]}`}>
                          {STATUT_LABELS[user.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/users/${user.id}`}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                            title="Voir le profil"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          {actionMenuOpen === user.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)} />
                              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => { navigate(`/admin/users/${user.id}`); setActionMenuOpen(null); }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <Eye className="h-4 w-4" /> Voir le profil
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActionMenuOpen(null)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <Mail className="h-4 w-4" /> Envoyer un email
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActionMenuOpen(null)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <KeyRound className="h-4 w-4" /> Réinitialiser MDP
                                </button>
                                <hr className="my-1 border-gray-100" />
                                <button
                                  type="button"
                                  onClick={() => setActionMenuOpen(null)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <UserX className="h-4 w-4" /> Désactiver
                                </button>
                              </div>
                            </>
                          )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal invitation */}
      <Modal
        open={inviteModalOpen}
        title="Inviter des utilisateurs"
        onClose={() => { setInviteModalOpen(false); resetInviteForm(); }}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setInviteModalOpen(false); resetInviteForm(); }}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Mail className="h-4 w-4" />}
              onClick={() => { setInviteModalOpen(false); resetInviteForm(); }}
            >
              Envoyer les invitations
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Adresses email <span className="text-red-500">*</span>
            </label>
            <textarea
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="email1@company.com, email2@company.com..."
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-slate-500">Séparez les adresses par des virgules</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Département</label>
              <select
                value={inviteDepartement}
                onChange={(e) => setInviteDepartement(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Sélectionner...</option>
                {DEPARTEMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Rôle</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as User['role'])}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Manager</label>
            <select
              value={inviteManager}
              onChange={(e) => setInviteManager(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Sélectionner un manager...</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Message personnalisé</label>
            <textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Bienvenue dans l'équipe ! Vous pouvez maintenant soumettre vos notes de frais..."
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersAdmin;
