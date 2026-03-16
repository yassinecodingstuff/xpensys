import type { FC } from 'react';
import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MoreVertical,
  Copy,
  Trash2,
  ChevronRight,
  ChevronDown,
  Building2,
  Plane,
  Train,
  Utensils,
  Users,
  Car,
  Gauge,
  ParkingCircle,
  CarTaxiFront,
  Package,
  Search,
} from 'lucide-react';
import { politiques, policyRoleLabels, mockUsers } from '../../../data/mockData';
import type { PolicyRule, ExpenseType, MockUser } from '../../../data/mockData';
import { Button } from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import RuleConfigModal, { formatPolicyRuleSummary } from '../../../components/admin/RuleConfigModal';

/** Types de dépense (mêmes icônes et couleurs que création dépenses dans mission) */
const DEPENSE_TYPES: { id: ExpenseType; nom: string; Icon: FC<{ className?: string }>; color: string }[] = [
  { id: 'hotel', nom: 'Hôtel', Icon: Building2, color: 'bg-violet-100 text-violet-700' },
  { id: 'flight', nom: 'Vol', Icon: Plane, color: 'bg-blue-100 text-blue-700' },
  { id: 'train', nom: 'Train', Icon: Train, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'car_rental', nom: 'Location voiture', Icon: Car, color: 'bg-amber-100 text-amber-700' },
  { id: 'meals', nom: 'Repas', Icon: Utensils, color: 'bg-pink-100 text-pink-700' },
  { id: 'client_meal', nom: 'Repas client', Icon: Users, color: 'bg-red-100 text-red-700' },
  { id: 'taxi', nom: 'Taxi / VTC', Icon: CarTaxiFront, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'mileage', nom: 'Kilométrique', Icon: Gauge, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'parking', nom: 'Parking', Icon: ParkingCircle, color: 'bg-slate-100 text-slate-700' },
  { id: 'miscellaneous', nom: 'Autres', Icon: Package, color: 'bg-stone-100 text-stone-700' },
];

const PolicyDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const policy = politiques.find((p) => p.id === id);

  const [actif, setActif] = useState(policy?.actif !== false);
  const [typesSearch, setTypesSearch] = useState('');
  const [filterActifs, setFilterActifs] = useState(true);
  const [filterInactifs, setFilterInactifs] = useState(true);
  const [ruleActiveOverrides, setRuleActiveOverrides] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleModalType, setRuleModalType] = useState<(typeof DEPENSE_TYPES)[number] | null>(null);
  const [ruleOverrides, setRuleOverrides] = useState<Record<string, PolicyRule>>({});
  const [showEmployees, setShowEmployees] = useState(false);

  if (!policy) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Politique introuvable.</p>
        <Link to="/admin/policies" className="mt-2 inline-block text-sm text-primary-600 hover:underline">
          ← Retour aux politiques
        </Link>
      </div>
    );
  }

  const getRuleForType = (typeId: ExpenseType): PolicyRule | null => {
    if (ruleOverrides[typeId]) return ruleOverrides[typeId];
    return policy.rules?.find((r) => r.expenseType === typeId) ?? null;
  };

  const getRuleActive = (typeId: string): boolean => {
    if (typeId in ruleActiveOverrides) return ruleActiveOverrides[typeId];
    const rule = getRuleForType(typeId as ExpenseType);
    return rule?.isActive !== false;
  };

  const setRuleActive = (typeId: string, active: boolean) => {
    setRuleActiveOverrides((prev) => ({ ...prev, [typeId]: active }));
  };

  const searchLower = typesSearch.trim().toLowerCase();
  const rulesToShow = DEPENSE_TYPES.map((type) => ({
    type,
    rule: getRuleForType(type.id),
  })).filter((r) => {
    const active = getRuleActive(r.type.id);
    const matchSearch = !searchLower || r.type.nom.toLowerCase().includes(searchLower);
    const matchActifs = filterActifs && active;
    const matchInactifs = filterInactifs && !active;
    return matchSearch && (matchActifs || matchInactifs);
  });

  const openRuleModal = (type: (typeof DEPENSE_TYPES)[number]) => {
    setRuleModalType(type);
    setRuleModalOpen(true);
  };

  const formatRoleLimitsSummary = (rule: PolicyRule | null): string => {
    if (!rule?.limitsByRole?.length) return '';
    return rule.limitsByRole
      .map((rl) => `${policyRoleLabels[rl.role]}: ${rl.limit.amount ?? '—'}€`)
      .join(' | ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-1 text-sm text-slate-500">
          <Link to="/admin/policies" className="hover:text-primary-600 hover:underline">
            Politiques
          </Link>
          <span aria-hidden>/</span>
          <span className="text-slate-700">{policy.nom}</span>
        </nav>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">{policy.nom}</h1>
          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle Actif */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Active</span>
              <button
                type="button"
                role="switch"
                aria-checked={actif}
                onClick={() => setActif((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  actif ? 'bg-primary-500 shadow-inner' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 shrink-0 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${
                    actif ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}
                />
              </button>
            </div>
            <Link to={`/admin/policies/${policy.id}/edit`}>
              <Button type="button" variant="secondary" size="sm">
                Modifier
              </Button>
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Menu"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Copy className="h-4 w-4" /> Dupliquer
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setDeleteModalOpen(true); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout : gauche = Types de dépenses, droite = Informations générales */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Gauche : Types de dépenses */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Types de dépenses</h2>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1 sm:max-w-xs">
                <Input
                  type="search"
                  placeholder="Rechercher un type..."
                  value={typesSearch}
                  onChange={(e) => setTypesSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 text-slate-400" />}
                  className="w-full"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filterActifs}
                    onChange={(e) => setFilterActifs(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-600">Afficher actifs</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filterInactifs}
                    onChange={(e) => setFilterInactifs(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-600">Afficher inactifs</span>
                </label>
              </div>
            </div>
            <div className="space-y-3">
              {rulesToShow.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
                  Aucun type ne correspond aux filtres.
                </p>
              ) : (
                rulesToShow.map(({ type, rule }) => {
                  const TypeIcon = type.Icon;
                  const active = getRuleActive(type.id);
                  return (
                    <div
                      key={type.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${type.color}`}>
                            <TypeIcon className="h-4 w-4" />
                          </span>
                          <span className="font-semibold text-slate-800">{type.nom}</span>
                        </div>
                        <div className="mt-2 border-t border-gray-200/80 pt-2 text-sm text-slate-600">
                          {formatPolicyRuleSummary(rule)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{formatRoleLimitsSummary(rule)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500">{active ? 'Actif' : 'Inactif'}</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={active}
                            aria-label={active ? 'Désactiver la règle' : 'Activer la règle'}
                            onClick={() => setRuleActive(type.id, !active)}
                            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                              active ? 'bg-primary-500 shadow-inner' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 shrink-0 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${
                                active ? 'translate-x-5' : 'translate-x-0.5'
                              } mt-0.5`}
                            />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => openRuleModal(type)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                          aria-label="Configurer"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Droite : Informations générales + À qui s'applique */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Informations générales</h2>
            <div>
              <p className="text-sm text-slate-700">
                {policy.description?.trim() ? (
                  policy.description
                ) : (
                  <span className="italic text-gray-500">Aucune description</span>
                )}
              </p>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4 text-[11px] text-slate-500">
              <span>Créée le {policy.dateCreation ? format(new Date(policy.dateCreation), "dd MMM yyyy", { locale: fr }) : '—'}</span>
              <span>Modifiée le {policy.dateModification ? format(new Date(policy.dateModification), "dd MMM yyyy", { locale: fr }) : '—'}</span>
            </div>
          </div>
          
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">À qui s&apos;applique cette politique ?</h2>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Départements</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {policy.departements.includes('*') || policy.departements.length === 0 ? (
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
                    Tous les départements
                  </span>
                ) : (
                  policy.departements.map((d) => (
                    <span key={d} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                      {d}
                    </span>
                  ))
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEmployees((v) => !v)}
              className="mt-4 w-full rounded-lg border border-primary-100 bg-primary-50 p-4 text-left transition-colors hover:bg-primary-100/70"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Users className="h-5 w-5 text-primary-600" />
                  <span>
                    Cette politique s&apos;applique à <strong>{policy.employesConcernes ?? 0}</strong> employés
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-primary-600 transition-transform ${showEmployees ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Liste des employés concernés */}
            {showEmployees && (
              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                {(() => {
                  const policyDepartments = policy.departements;
                  const isAllDepartments = policyDepartments.includes('*') || policyDepartments.length === 0;
                  const concernedEmployees: MockUser[] = isAllDepartments
                    ? mockUsers
                    : mockUsers.filter((u) => policyDepartments.includes(u.departement));
                  
                  if (concernedEmployees.length === 0) {
                    return (
                      <p className="py-4 text-center text-sm text-slate-500">
                        Aucun employé trouvé pour cette politique.
                      </p>
                    );
                  }

                  return concernedEmployees.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                          {user.prenom[0]}{user.nom[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{user.prenom} {user.nom}</p>
                          <p className="text-xs text-slate-500">{user.role}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {user.departement}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal suppression */}
      <Modal
        open={deleteModalOpen}
        title="Supprimer la politique"
        onClose={() => setDeleteModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false);
                navigate('/admin/policies');
              }}
            >
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Êtes-vous sûr de vouloir supprimer la politique &quot;{policy.nom}&quot; ? Cette action est irréversible.
        </p>
      </Modal>

      {/* Modal config règle */}
      {ruleModalType && (
        <RuleConfigModal
          isOpen={ruleModalOpen}
          onClose={() => { setRuleModalOpen(false); setRuleModalType(null); }}
          expenseType={ruleModalType.id}
          rule={getRuleForType(ruleModalType.id)}
          onSave={(rule) => {
            setRuleOverrides((prev) => ({ ...prev, [ruleModalType.id]: rule }));
            setRuleModalOpen(false);
            setRuleModalType(null);
          }}
        />
      )}
    </div>
  );
};

export default PolicyDetail;
