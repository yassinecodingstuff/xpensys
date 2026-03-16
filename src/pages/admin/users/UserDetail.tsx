import type { FC } from 'react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MoreVertical,
  Copy,
  KeyRound,
  UserX,
  Pencil,
  Briefcase,
  Receipt,
  CheckCircle,
  Clock,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  User,
  Calendar,
  Shield,
  LogOut,
  Trash2,
  AlertTriangle,
  FileText,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

// Types
interface UserData {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  departement: string;
  poste: 'Employee' | 'Manager' | 'Directeur';
  managerId?: string;
  managerNom?: string;
  statut: 'actif' | 'inactif';
  dateEntree: string;
  derniereConnexion: string;
  politique: { id: string; nom: string };
  plafonds: { hotel: number; vol: number; repasClient: number };
  stats: {
    missions: number;
    depenses: number;
    tauxConformite: number;
    delaiMoyen: number;
  };
}

interface Mission {
  id: string;
  nom: string;
  destination: string;
  dateDebut: string;
  dateFin: string;
  budget: number;
  depense: number;
  statut: 'brouillon' | 'en_attente' | 'approuvee' | 'en_cours' | 'cloture_demandee' | 'cloturee' | 'rejetee' | 'annulee';
}

interface Depense {
  id: string;
  date: string;
  type: string;
  typeIcon: string;
  description: string;
  mission: string;
  montant: number;
  statut: 'en_attente' | 'approuvee' | 'rejetee';
  justificatif: 'present' | 'manquant' | 'non_requis';
}

interface Approbation {
  id: string;
  date: string;
  type: 'mission' | 'depense' | 'avance';
  objet: string;
  montant: number;
  demandeur?: string;
  approbateur?: string;
  statut: 'en_attente' | 'approuvee' | 'rejetee';
  delai: string;
}

interface HistoryItem {
  id: string;
  date: string;
  heure: string;
  type: 'mission' | 'depense' | 'approbation' | 'connexion';
  icon: string;
  description: string;
  details?: string;
}

// Mock data
const MOCK_USER: UserData = {
  id: 'u1',
  prenom: 'Marie',
  nom: 'Dupont',
  email: 'marie.dupont@company.com',
  telephone: '+33 6 12 34 56 78',
  departement: 'Commercial',
  poste: 'Employee',
  managerId: 'u6',
  managerNom: 'Jean Martin',
  statut: 'actif',
  dateEntree: '2023-03-15',
  derniereConnexion: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  politique: { id: 'p1', nom: 'Commercial & Marketing' },
  plafonds: { hotel: 130, vol: 350, repasClient: 80 },
  stats: { missions: 12, depenses: 8450, tauxConformite: 96, delaiMoyen: 3.2 },
};

const MOCK_MISSIONS: Mission[] = [
  { id: 'm1', nom: 'Prospection Bordeaux', destination: 'Bordeaux', dateDebut: '2026-01-28', dateFin: '2026-01-30', budget: 600, depense: 284, statut: 'en_cours' },
  { id: 'm2', nom: 'Audit Lyon', destination: 'Lyon', dateDebut: '2026-02-05', dateFin: '2026-02-07', budget: 650, depense: 0, statut: 'approuvee' },
  { id: 'm3', nom: 'Workshop Madrid', destination: 'Madrid', dateDebut: '2026-01-20', dateFin: '2026-01-23', budget: 900, depense: 725, statut: 'cloture_demandee' },
  { id: 'm4', nom: 'Salon Retail Nantes', destination: 'Nantes', dateDebut: '2026-01-13', dateFin: '2026-01-15', budget: 700, depense: 580, statut: 'cloturee' },
  { id: 'm5', nom: 'Séminaire Nice 2025', destination: 'Nice', dateDebut: '2025-12-05', dateFin: '2025-12-07', budget: 1200, depense: 1150, statut: 'cloturee' },
];

const MOCK_DEPENSES: Depense[] = [
  { id: 'd1', date: '2026-01-29', type: 'Repas', typeIcon: '🍽️', description: 'Déjeuner prospect', mission: 'Prospection Bordeaux', montant: 75, statut: 'en_attente', justificatif: 'present' },
  { id: 'd2', date: '2026-01-28', type: 'Hôtel', typeIcon: '🏨', description: 'Hotel Mercure', mission: 'Prospection Bordeaux', montant: 120, statut: 'approuvee', justificatif: 'present' },
  { id: 'd3', date: '2026-01-28', type: 'Train', typeIcon: '🚄', description: 'TGV Paris-Bordeaux', mission: 'Prospection Bordeaux', montant: 89, statut: 'approuvee', justificatif: 'present' },
  { id: 'd4', date: '2026-01-23', type: 'Taxi', typeIcon: '🚕', description: 'Taxi aéroport', mission: 'Workshop Madrid', montant: 55, statut: 'approuvee', justificatif: 'present' },
  { id: 'd5', date: '2026-01-22', type: 'Vol', typeIcon: '✈️', description: 'Vol Paris-Madrid', mission: 'Workshop Madrid', montant: 245, statut: 'approuvee', justificatif: 'present' },
  { id: 'd6', date: '2026-01-15', type: 'Repas', typeIcon: '🍽️', description: 'Dîner équipe', mission: 'Salon Retail Nantes', montant: 95, statut: 'rejetee', justificatif: 'manquant' },
];

const MOCK_APPROBATIONS_DEMANDEUR: Approbation[] = [
  { id: 'a1', date: '2026-01-26', type: 'mission', objet: 'Formation AWS Paris', montant: 230, approbateur: 'Jean Martin', statut: 'en_attente', delai: '3j' },
  { id: 'a2', date: '2026-01-20', type: 'mission', objet: 'Prospection Bordeaux', montant: 600, approbateur: 'Jean Martin', statut: 'approuvee', delai: '1j' },
  { id: 'a3', date: '2026-01-10', type: 'avance', objet: 'Workshop Madrid', montant: 200, approbateur: 'Jean Martin', statut: 'approuvee', delai: '2h' },
];

const MOCK_HISTORY: HistoryItem[] = [
  { id: 'h1', date: '2026-01-29', heure: '14:32', type: 'depense', icon: '🧾', description: 'Dépense ajoutée : "Déjeuner prospect" (75€)', details: 'sur mission Prospection Bordeaux' },
  { id: 'h2', date: '2026-01-29', heure: '09:15', type: 'connexion', icon: '🔑', description: 'Connexion depuis Paris', details: 'Chrome, Windows' },
  { id: 'h3', date: '2026-01-28', heure: '18:45', type: 'depense', icon: '🧾', description: 'Dépense ajoutée : "Hotel Mercure" (120€)', details: '' },
  { id: 'h4', date: '2026-01-28', heure: '16:20', type: 'depense', icon: '🧾', description: 'Dépense ajoutée : "TGV Paris-Bordeaux" (89€)', details: '' },
  { id: 'h5', date: '2026-01-28', heure: '08:00', type: 'mission', icon: '📋', description: 'Mission "Prospection Bordeaux" démarrée', details: '' },
  { id: 'h6', date: '2026-01-27', heure: '11:30', type: 'mission', icon: '✅', description: 'Mission "Workshop Madrid" - Clôture demandée', details: '' },
];

const TABS = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'missions', label: 'Missions' },
  { id: 'expenses', label: 'Dépenses' },
  { id: 'approvals', label: 'Approbations' },
  { id: 'history', label: 'Historique' },
  { id: 'settings', label: 'Paramètres' },
];

const STATUT_MISSION: Record<Mission['statut'], { label: string; color: string }> = {
  brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
  en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  approuvee: { label: 'Approuvée', color: 'bg-green-100 text-green-700' },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  cloture_demandee: { label: 'Clôture demandée', color: 'bg-purple-100 text-purple-700' },
  cloturee: { label: 'Clôturée', color: 'bg-slate-100 text-slate-600' },
  rejetee: { label: 'Rejetée', color: 'bg-red-100 text-red-700' },
  annulee: { label: 'Annulée', color: 'bg-gray-100 text-gray-500' },
};

const STATUT_DEPENSE: Record<Depense['statut'], { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  approuvee: { label: 'Approuvée', color: 'bg-green-100 text-green-700' },
  rejetee: { label: 'Rejetée', color: 'bg-red-100 text-red-700' },
};

const POSTE_COLORS: Record<UserData['poste'], string> = {
  Employee: 'bg-slate-100 text-slate-700',
  Manager: 'bg-blue-100 text-blue-700',
  Directeur: 'bg-purple-100 text-purple-700',
};

// Components
const UserAvatar: FC<{ user: UserData; size?: 'md' | 'lg' }> = ({ user, size = 'lg' }) => {
  const sizeClass = size === 'lg' ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm';
  return (
    <div className={`flex items-center justify-center rounded-full border-2 border-white bg-primary-100 font-semibold text-primary-700 shadow ${sizeClass}`}>
      {user.prenom[0]}{user.nom[0]}
    </div>
  );
};

const StatCard: FC<{ icon: FC<{ className?: string }>; value: string | number; label: string; color: string }> = ({ icon: Icon, value, label, color }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  </div>
);

const UserDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [approvalSubTab, setApprovalSubTab] = useState<'demandeur' | 'approbateur'>('demandeur');

  // Mock - in real app, fetch user by id
  const user = MOCK_USER;
  const missions = MOCK_MISSIONS;
  const depenses = MOCK_DEPENSES;
  const approbationsDemandeur = MOCK_APPROBATIONS_DEMANDEUR;
  const history = MOCK_HISTORY;

  const missionsEnCours = missions.filter((m) => ['approuvee', 'en_cours', 'cloture_demandee'].includes(m.statut));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (date: string) => format(new Date(date), 'dd MMM yyyy', { locale: fr });
  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${format(s, 'd')}-${format(e, 'd MMM yyyy', { locale: fr })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-1 text-sm text-slate-500">
          <Link to="/admin" className="hover:text-primary-600 hover:underline">Administration</Link>
          <span>/</span>
          <Link to="/admin/users" className="hover:text-primary-600 hover:underline">Utilisateurs</Link>
          <span>/</span>
          <span className="text-slate-700">{user.prenom} {user.nom}</span>
        </nav>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900">{user.prenom} {user.nom}</h1>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${POSTE_COLORS[user.poste]}`}>
                  {user.poste}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${user.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {user.statut === 'actif' ? 'Actif' : 'Inactif'}
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <Pencil className="h-4 w-4" /> Modifier
                    </button>
                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <KeyRound className="h-4 w-4" /> Réinitialiser MDP
                    </button>
                    <hr className="my-1" />
                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <UserX className="h-4 w-4" /> Désactiver
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Informations personnelles */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Informations personnelles</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{user.email}</span>
                  <button type="button" onClick={() => copyToClipboard(user.email)} className="text-slate-400 hover:text-slate-600">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{user.telephone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{user.departement}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">Manager : </span>
                  <Link to={`/admin/users/${user.managerId}`} className="text-sm text-primary-600 hover:underline">
                    {user.managerNom}
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">Entrée : {formatDate(user.dateEntree)}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Politique applicable</p>
                  <Link to={`/admin/policies/${user.politique.id}`} className="text-sm text-primary-600 hover:underline">
                    {user.politique.nom} <ExternalLink className="inline h-3 w-3" />
                  </Link>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Plafonds principaux</p>
                  <ul className="mt-1 space-y-1 text-sm text-slate-700">
                    <li>Hôtel : {user.plafonds.hotel}€/nuit</li>
                    <li>Vol : {user.plafonds.vol}€</li>
                    <li>Repas client : {user.plafonds.repasClient}€/pers</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Dernière connexion</p>
                  <p className="text-sm text-slate-700">{formatDistanceToNow(new Date(user.derniereConnexion), { addSuffix: true, locale: fr })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Briefcase} value={user.stats.missions} label="missions cette année" color="bg-blue-100 text-blue-600" />
            <StatCard icon={Receipt} value={`${user.stats.depenses.toLocaleString('fr-FR')} €`} label="dépenses cette année" color="bg-emerald-100 text-emerald-600" />
            <StatCard icon={CheckCircle} value={`${user.stats.tauxConformite}%`} label="dépenses conformes" color={user.stats.tauxConformite >= 90 ? 'bg-green-100 text-green-600' : user.stats.tauxConformite >= 70 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'} />
            <StatCard icon={Clock} value={`${user.stats.delaiMoyen}j`} label="délai moyen remboursement" color="bg-blue-100 text-blue-600" />
          </div>

          {/* Activité récente */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Activité récente</h2>
              <button type="button" onClick={() => setActiveTab('history')} className="text-sm text-primary-600 hover:underline">
                Voir tout l'historique <ChevronRight className="inline h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{item.description}</p>
                    {item.details && <p className="text-xs text-slate-500">{item.details}</p>}
                  </div>
                  <span className="text-xs text-slate-400">{item.heure}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Missions en cours */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Missions en cours</h2>
              <button type="button" onClick={() => setActiveTab('missions')} className="text-sm text-primary-600 hover:underline">
                Voir toutes les missions <ChevronRight className="inline h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-2 font-medium text-slate-600">Mission</th>
                    <th className="pb-2 font-medium text-slate-600">Dates</th>
                    <th className="pb-2 font-medium text-slate-600">Budget</th>
                    <th className="pb-2 font-medium text-slate-600">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {missionsEnCours.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50">
                      <td className="py-3">
                        <p className="font-medium text-slate-900">{m.nom}</p>
                        <p className="text-xs text-slate-500">{m.destination}</p>
                      </td>
                      <td className="py-3 text-slate-600">{formatDateRange(m.dateDebut, m.dateFin)}</td>
                      <td className="py-3">
                        <div className="w-32">
                          <div className="flex justify-between text-xs">
                            <span>{m.depense}€</span>
                            <span className="text-slate-400">/ {m.budget}€</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-primary-500"
                              style={{ width: `${Math.min((m.depense / m.budget) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_MISSION[m.statut].color}`}>
                          {STATUT_MISSION[m.statut].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'missions' && (
        <div className="space-y-6">
          {/* Stats missions */}
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm">
              <span className="font-semibold text-slate-900">{missions.length}</span>
              <span className="ml-1 text-slate-600">Total</span>
            </div>
            <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm">
              <span className="font-semibold text-blue-700">{missions.filter((m) => m.statut === 'en_cours').length}</span>
              <span className="ml-1 text-blue-600">En cours</span>
            </div>
            <div className="rounded-lg bg-green-50 px-4 py-2 text-sm">
              <span className="font-semibold text-green-700">{missions.filter((m) => m.statut === 'cloturee').length}</span>
              <span className="ml-1 text-green-600">Terminées</span>
            </div>
          </div>

          {/* Table missions */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Mission</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Destination</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Dates</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Budget</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Dépensé</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Statut</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {missions.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{m.nom}</td>
                    <td className="px-4 py-3 text-slate-600">{m.destination}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateRange(m.dateDebut, m.dateFin)}</td>
                    <td className="px-4 py-3 text-slate-600">{m.budget}€</td>
                    <td className="px-4 py-3 text-slate-600">{m.depense}€</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_MISSION[m.statut].color}`}>
                        {STATUT_MISSION[m.statut].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/missions/${m.id}`} className="text-primary-600 hover:underline">Voir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Alertes */}
          {depenses.some((d) => d.justificatif === 'manquant') && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              {depenses.filter((d) => d.justificatif === 'manquant').length} dépense(s) en attente de justificatif
            </div>
          )}

          {/* Stats dépenses */}
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm">
              <span className="font-semibold text-slate-900">{depenses.length}</span>
              <span className="ml-1 text-slate-600">Total</span>
            </div>
            <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm">
              <span className="font-semibold text-amber-700">{depenses.filter((d) => d.statut === 'en_attente').length}</span>
              <span className="ml-1 text-amber-600">En attente</span>
            </div>
            <div className="rounded-lg bg-green-50 px-4 py-2 text-sm">
              <span className="font-semibold text-green-700">{depenses.filter((d) => d.statut === 'approuvee').length}</span>
              <span className="ml-1 text-green-600">Approuvées</span>
            </div>
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm">
              <span className="font-semibold text-red-700">{depenses.filter((d) => d.statut === 'rejetee').length}</span>
              <span className="ml-1 text-red-600">Rejetées</span>
            </div>
          </div>

          {/* Table dépenses */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Mission</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Montant</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Justif.</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {depenses.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-slate-600">{format(new Date(d.date), 'd MMM', { locale: fr })}</td>
                    <td className="px-4 py-3">
                      <span className="mr-1">{d.typeIcon}</span>
                      {d.type}
                    </td>
                    <td className="px-4 py-3 text-slate-900">{d.description}</td>
                    <td className="px-4 py-3 text-slate-600">{d.mission}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{d.montant}€</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_DEPENSE[d.statut].color}`}>
                        {STATUT_DEPENSE[d.statut].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.justificatif === 'present' && <Check className="h-4 w-4 text-green-600" />}
                      {d.justificatif === 'manquant' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      {d.justificatif === 'non_requis' && <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/expenses/${d.id}`} className="text-primary-600 hover:underline">Voir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Sous-tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setApprovalSubTab('demandeur')}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                approvalSubTab === 'demandeur' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500'
              }`}
            >
              En tant que demandeur
            </button>
            {(user.poste === 'Manager' || user.poste === 'Directeur') && (
              <button
                type="button"
                onClick={() => setApprovalSubTab('approbateur')}
                className={`border-b-2 px-1 py-2 text-sm font-medium ${
                  approvalSubTab === 'approbateur' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500'
                }`}
              >
                En tant qu'approbateur
              </button>
            )}
          </div>

          {approvalSubTab === 'demandeur' && (
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Objet</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Montant</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Approbateur</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Délai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {approbationsDemandeur.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-slate-600">{format(new Date(a.date), 'd MMM', { locale: fr })}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{a.type}</td>
                      <td className="px-4 py-3 text-slate-900">{a.objet}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{a.montant}€</td>
                      <td className="px-4 py-3 text-slate-600">{a.approbateur}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          a.statut === 'en_attente' ? 'bg-amber-100 text-amber-700' :
                          a.statut === 'approuvee' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {a.statut === 'en_attente' ? 'En attente' : a.statut === 'approuvee' ? 'Approuvée' : 'Rejetée'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{a.delai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {approvalSubTab === 'approbateur' && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-slate-500">
              Aucune demande à traiter
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" leftIcon={<FileText className="h-4 w-4" />}>
              Exporter CSV
            </Button>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            {Object.entries(
              history.reduce((acc, item) => {
                if (!acc[item.date]) acc[item.date] = [];
                acc[item.date].push(item);
                return acc;
              }, {} as Record<string, HistoryItem[]>)
            ).map(([date, items]) => (
              <div key={date} className="mb-6 last:mb-0">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  📅 {format(new Date(date), 'd MMMM yyyy', { locale: fr })}
                </h3>
                <div className="ml-4 border-l-2 border-gray-200 pl-4 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="relative flex items-start gap-3">
                      <div className="absolute -left-[22px] h-2 w-2 rounded-full bg-gray-300" />
                      <span className="text-xs text-slate-400 w-12">{item.heure}</span>
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="text-sm text-slate-700">{item.description}</p>
                        {item.details && <p className="text-xs text-slate-500">{item.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Informations du compte */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Informations du compte</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Prénom</label>
                <input type="text" defaultValue={user.prenom} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
                <input type="text" defaultValue={user.nom} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input type="email" defaultValue={user.email} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Téléphone</label>
                <input type="tel" defaultValue={user.telephone} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Département</label>
                <select defaultValue={user.departement} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option>Commercial</option>
                  <option>Tech</option>
                  <option>Marketing</option>
                  <option>Finance</option>
                  <option>RH</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Poste</label>
                <select defaultValue={user.poste} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option>Employee</option>
                  <option>Manager</option>
                  <option>Directeur</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="primary" size="sm">Sauvegarder</Button>
            </div>
          </div>

          {/* Permissions */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Permissions</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Peut créer des missions', checked: true },
                { label: 'Peut soumettre des dépenses', checked: true },
                { label: 'Peut approuver', checked: false },
                { label: 'Accès administration', checked: false },
                { label: 'Accès rapports globaux', checked: false },
              ].map((p) => (
                <label key={p.label} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={p.checked} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                  <span className="text-sm text-slate-700">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sécurité */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Sécurité</h2>
            <div className="space-y-3 text-sm">
              <p className="text-slate-600">Dernière connexion : {format(new Date(user.derniereConnexion), "d MMM yyyy 'à' HH:mm", { locale: fr })}</p>
              <p className="text-slate-600">Appareils connectés : 2 (Chrome Windows, App iOS)</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" leftIcon={<KeyRound className="h-4 w-4" />}>
                Réinitialiser le mot de passe
              </Button>
              <Button variant="secondary" size="sm" leftIcon={<LogOut className="h-4 w-4" />}>
                Déconnecter toutes les sessions
              </Button>
            </div>
          </div>

          {/* Zone danger */}
          <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-red-600">Zone danger</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" className="!border-red-300 !text-red-600 hover:!bg-red-50" leftIcon={<UserX className="h-4 w-4" />}>
                Désactiver le compte
              </Button>
              <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />}>
                Supprimer définitivement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;
