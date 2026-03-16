import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
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
  X,
} from 'lucide-react';
import { politiques } from '../../../data/mockData';
import type { PolicyRule, ExpenseType } from '../../../data/mockData';
import { Button } from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import RuleConfigModal, { formatPolicyRuleSummary } from '../../../components/admin/RuleConfigModal';

const DEPARTEMENTS_OPTIONS = ['Commercial', 'Tech', 'Marketing', 'Finance', 'RH', 'Ops', 'Direction', 'Produit', 'Data'];

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

const PolicyForm: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const policy = politiques.find((p) => p.id === id);

  // Form state
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState(10);
  const [actif, setActif] = useState(true);
  const [tousDepartements, setTousDepartements] = useState(true);
  const [departements, setDepartements] = useState<string[]>([]);
  const [typeEnabled, setTypeEnabled] = useState<Record<string, boolean>>(() => {
    const e: Record<string, boolean> = {};
    DEPENSE_TYPES.forEach((t) => {
      e[t.id] = true;
    });
    return e;
  });
  const [rules, setRules] = useState<Record<string, PolicyRule>>({});

  // Modal state
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleModalType, setRuleModalType] = useState<(typeof DEPENSE_TYPES)[number] | null>(null);

  // Initialize form from existing policy
  useEffect(() => {
    if (policy) {
      setNom(policy.nom);
      setDescription(policy.description ?? '');
      setPriorite(policy.priorite ?? 10);
      setActif(policy.actif !== false);
      
      // Départements
      if (policy.departements.includes('*') || policy.departements.length === 0) {
        setTousDepartements(true);
        setDepartements([]);
      } else {
        setTousDepartements(false);
        setDepartements([...policy.departements]);
      }

      // Rules
      const enabled: Record<string, boolean> = {};
      const rulesMap: Record<string, PolicyRule> = {};
      
      DEPENSE_TYPES.forEach((t) => {
        const existingRule = policy.rules?.find((r) => r.expenseType === t.id);
        enabled[t.id] = existingRule?.isActive !== false;
        if (existingRule) {
          rulesMap[t.id] = existingRule;
        }
      });
      
      setTypeEnabled(enabled);
      setRules(rulesMap);
    } else {
      // New policy defaults
      const enabled: Record<string, boolean> = {};
      DEPENSE_TYPES.forEach((t) => {
        enabled[t.id] = true;
      });
      setTypeEnabled(enabled);
    }
  }, [policy]);

  const toggleDepartement = (d: string) => {
    setDepartements((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const estimatedEmployes = tousDepartements ? 45 : departements.length * 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    // In real app, would save policy here
    if (isEdit) {
      navigate(`/admin/policies/${id}`);
    } else {
      navigate('/admin/policies');
    }
  };

  const openRuleModal = (type: (typeof DEPENSE_TYPES)[number]) => {
    setRuleModalType(type);
    setRuleModalOpen(true);
  };

  const handleSaveRule = (rule: PolicyRule) => {
    if (ruleModalType) {
      setRules((prev) => ({ ...prev, [ruleModalType.id]: rule }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <nav className="flex items-center gap-1 text-sm text-slate-500">
            <Link to="/admin/policies" className="hover:text-primary-600 hover:underline">
              Politiques
            </Link>
            <span aria-hidden>/</span>
            <span className="text-slate-700">{isEdit ? `Modifier ${policy?.nom ?? ''}` : 'Nouvelle politique'}</span>
          </nav>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            {isEdit ? 'Modifier la politique' : 'Nouvelle politique'}
          </h1>
        </div>

        {/* Section 1 : Informations générales */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Informations générales</h2>
          <div className="space-y-4">
            <Input
              label="Nom"
              required
              placeholder="Ex: Politique Commerciaux"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="border-gray-200 focus:border-primary-500 focus:ring-primary-500"
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Description
              </label>
              <textarea
                placeholder="Décrivez l'objectif de cette politique..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              />
            </div>
            <Input
              label="Priorité"
              type="number"
              required
              min={1}
              max={100}
              value={priorite}
              onChange={(e) => setPriorite(Number(e.target.value) || 10)}
              helperText="Plus le chiffre est bas, plus cette politique est prioritaire"
              className="border-gray-200 focus:border-primary-500 focus:ring-primary-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Politique active</span>
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
          </div>
        </div>

        {/* Section 2 : Périmètre d'application (Départements uniquement) */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">À qui s&apos;applique cette politique ?</h2>

          <div className="space-y-4">
            {/* Départements */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Départements</span>
                <label className="flex cursor-pointer items-center gap-2">
                  <span className="text-sm text-slate-600">Tous les départements</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={tousDepartements}
                    onClick={() => setTousDepartements((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all duration-300 ease-in-out ${
                      tousDepartements ? 'bg-primary-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 shrink-0 transform rounded-full bg-white shadow transition-transform duration-300 ease-out ${
                        tousDepartements ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </button>
                </label>
              </div>
              {!tousDepartements && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {DEPARTEMENTS_OPTIONS.filter((d) => !departements.includes(d)).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDepartement(d)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  {departements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {departements.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
                        >
                          {d}
                          <button
                            type="button"
                            onClick={() => toggleDepartement(d)}
                            className="rounded-full p-0.5 hover:bg-primary-100"
                            aria-label={`Retirer ${d}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Aperçu */}
            <div className="rounded-lg bg-primary-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Users className="h-5 w-5 text-primary-600" />
                <span>
                  Aperçu : Cette politique s&apos;appliquera à environ <strong>{estimatedEmployes}</strong> employés
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Les plafonds varient ensuite par poste (Employé, Manager, Directeur) dans chaque type de dépense.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3 : Types de dépenses */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Types de dépenses</h2>
          <p className="mb-4 text-sm text-slate-500">
            Configurez les règles et plafonds par poste pour chaque type de dépense.
          </p>

          <div className="space-y-2">
            {DEPENSE_TYPES.map((type) => {
              const { Icon } = type;
              const enabled = typeEnabled[type.id];
              const rule = rules[type.id];
              const summary = rule ? formatPolicyRuleSummary(rule) : 'Non configuré';

              return (
                <div
                  key={type.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${type.color}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                          {type.nom}
                        </span>
                      </div>
                      {enabled && <p className="text-xs text-slate-500">{summary}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {enabled && (
                      <button
                        type="button"
                        onClick={() => openRuleModal(type)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        Configurer
                      </button>
                    )}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => setTypeEnabled((prev) => ({ ...prev, [type.id]: !prev[type.id] }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all duration-300 ease-in-out ${
                        enabled ? 'bg-primary-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 shrink-0 transform rounded-full bg-white shadow transition-transform duration-300 ease-out ${
                          enabled ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer fixe */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/80 py-4 backdrop-blur md:left-60">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-4 px-4 sm:px-6 lg:px-8">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="rounded-lg px-6 py-2.5">
            Annuler
          </Button>
          <Button type="submit" variant="primary" className="rounded-lg px-6 py-2.5">
            {isEdit ? 'Sauvegarder' : 'Créer la politique'}
          </Button>
        </div>
      </div>

      {/* Rule configuration modal */}
      {ruleModalType && (
        <RuleConfigModal
          isOpen={ruleModalOpen}
          onClose={() => {
            setRuleModalOpen(false);
            setRuleModalType(null);
          }}
          expenseType={ruleModalType.id}
          rule={rules[ruleModalType.id] ?? null}
          onSave={handleSaveRule}
        />
      )}
    </form>
  );
};

export default PolicyForm;
