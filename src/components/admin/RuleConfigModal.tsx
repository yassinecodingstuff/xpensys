import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
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
  Plus,
  Trash2,
  Settings2,
} from 'lucide-react';
import type { ExpenseType, PolicyRule, RoleLimit, CitySupplement, PolicyRole, LimitUnit } from '../../data/mockData';
import { policyRoleLabels, limitUnitLabels } from '../../data/mockData';
import { Button } from '../ui/Button';
import Input from '../ui/Input';

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

type ReimbursementMode = 'real' | 'per_diem' | 'mileage';

const EXPENSE_TYPE_CONFIG: Record<
  ExpenseType,
  { nom: string; Icon: FC<{ className?: string }>; color: string }
> = {
  hotel: { nom: 'Hôtel', Icon: Building2, color: 'bg-violet-100 text-violet-700' },
  flight: { nom: 'Vol', Icon: Plane, color: 'bg-blue-100 text-blue-700' },
  train: { nom: 'Train', Icon: Train, color: 'bg-emerald-100 text-emerald-700' },
  car_rental: { nom: 'Location voiture', Icon: Car, color: 'bg-amber-100 text-amber-700' },
  meals: { nom: 'Repas', Icon: Utensils, color: 'bg-pink-100 text-pink-700' },
  client_meal: { nom: 'Repas client', Icon: Users, color: 'bg-red-100 text-red-700' },
  taxi: { nom: 'Taxi / VTC', Icon: CarTaxiFront, color: 'bg-yellow-100 text-yellow-700' },
  mileage: { nom: 'Kilométrique', Icon: Gauge, color: 'bg-indigo-100 text-indigo-700' },
  parking: { nom: 'Parking', Icon: ParkingCircle, color: 'bg-slate-100 text-slate-700' },
  miscellaneous: { nom: 'Autres', Icon: Package, color: 'bg-stone-100 text-stone-700' },
};

const AVAILABLE_MODES: Record<ExpenseType, ReimbursementMode[]> = {
  hotel: ['real', 'per_diem'],
  flight: ['real', 'per_diem'],
  train: ['real', 'per_diem'],
  meals: ['real', 'per_diem'],
  client_meal: ['real', 'per_diem'],
  taxi: ['real', 'per_diem'],
  mileage: ['mileage'],
  parking: ['real', 'per_diem'],
  car_rental: ['real', 'per_diem'],
  miscellaneous: ['real', 'per_diem'],
};

const MODE_CONFIG: Record<ReimbursementMode, { label: string; desc: string }> = {
  real: { label: 'Réel', desc: 'Sur justificatif' },
  per_diem: { label: 'Forfait', desc: 'Montant fixe' },
  mileage: { label: 'Kilométrique', desc: 'Barème au km' },
};

const DEFAULT_LIMIT_UNIT: Record<ExpenseType, LimitUnit> = {
  hotel: 'night',
  flight: 'trip',
  train: 'trip',
  meals: 'day',
  client_meal: 'person',
  taxi: 'expense',
  mileage: 'km',
  parking: 'day',
  car_rental: 'day',
  miscellaneous: 'expense',
};

const ROLES: PolicyRole[] = ['employee', 'manager', 'director'];
const HOTEL_STARS = [2, 3, 4, 5];
const FLIGHT_CLASSES = ['Economy', 'Premium Economy', 'Business', 'First'];
const TRAIN_CLASSES = ['2ème classe', '1ère classe'];
const CAR_RENTAL_CATEGORIES = ['Economy', 'Compact', 'Midsize', 'Fullsize', 'Premium', 'SUV'];
const CAR_RENTAL_OPTIONS = ['Assurance', 'GPS', 'Siège enfant', 'Conducteur additionnel', 'Plein essence'];
const CLIENT_MEAL_INFOS = ['Nom convives', 'Société', 'Motif professionnel'];
const MILEAGE_POWERS = ['3 CV', '4 CV', '5 CV', '6 CV', '7 CV+'];
const MILEAGE_VEHICLES = ['Voiture', 'Moto/Scooter', 'Vélo'];
const VILLES_SUGGESTIONS = ['Paris', 'Lyon', 'Marseille', 'Londres', 'New York', 'Berlin', 'Tokyo', 'San Francisco'];

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

function createDefaultRoleLimit(role: PolicyRole, expenseType: ExpenseType, mode: ReimbursementMode): RoleLimit {
  const defaultAmounts: Record<PolicyRole, number> = { employee: 100, manager: 150, director: 250 };
  const limit: RoleLimit = {
    role,
    limit: { amount: defaultAmounts[role], per: DEFAULT_LIMIT_UNIT[expenseType] },
    overrideAllowed: role !== 'employee',
    overrideRequiresJustification: role === 'manager',
  };

  if (expenseType === 'meals' && mode === 'per_diem') {
    const multipliers: Record<PolicyRole, number> = { employee: 1, manager: 1.2, director: 1.5 };
    const m = multipliers[role];
    limit.perDiem = { breakfast: Math.round(12 * m), lunch: Math.round(18 * m), dinner: Math.round(20 * m) };
  }

  if (expenseType === 'mileage') {
    limit.mileageRates = { mode: 'unique', unique: 0.45 };
    limit.constraints = { maxKmPerTrip: role === 'director' ? null : role === 'manager' ? 500 : 300 };
  }

  if (expenseType === 'hotel') {
    limit.constraints = { maxStarRating: role === 'director' ? null : role === 'manager' ? 4 : 3 };
  }

  if (expenseType === 'flight') {
    limit.constraints = { allowedClasses: role === 'director' ? ['Economy', 'Premium Economy', 'Business'] : role === 'manager' ? ['Economy', 'Premium Economy'] : ['Economy'] };
  }

  if (expenseType === 'train') {
    limit.constraints = { allowedClasses: role === 'director' ? ['1ère classe'] : role === 'manager' ? ['2ème classe', '1ère classe'] : ['2ème classe'] };
  }

  if (expenseType === 'car_rental') {
    limit.constraints = { allowedCategories: role === 'director' ? ['Economy', 'Compact', 'Midsize', 'Fullsize', 'Premium'] : role === 'manager' ? ['Economy', 'Compact', 'Midsize'] : ['Economy', 'Compact'] };
  }

  if (expenseType === 'client_meal') {
    limit.constraints = { maxGuestsWithoutApproval: role === 'director' ? 10 : role === 'manager' ? 6 : 4 };
  }

  return limit;
}

function createDefaultRule(expenseType: ExpenseType): PolicyRule {
  const defaultMode = AVAILABLE_MODES[expenseType][0];
  return {
    id: `rule-${Date.now()}`,
    expenseType,
    reimbursementMode: defaultMode,
    limitsByRole: ROLES.map((role) => createDefaultRoleLimit(role, expenseType, defaultMode)),
    citySupplements: [],
    receiptRequired: defaultMode === 'real',
    isActive: true,
    ...(expenseType === 'client_meal' && { requiredInfo: ['Nom convives'] }),
    ...(expenseType === 'car_rental' && { reimbursableOptions: ['Assurance', 'Plein essence'] }),
    ...(expenseType === 'mileage' && { allowedVehicles: ['Voiture'] }),
    ...(expenseType === 'miscellaneous' && { descriptionRequired: true }),
  };
}

export function formatPolicyRuleSummary(rule: PolicyRule | null): string {
  if (!rule) return 'Non configuré';
  const parts: string[] = [];
  parts.push(MODE_CONFIG[rule.reimbursementMode].label);

  const employeeLimit = rule.limitsByRole.find((r) => r.role === 'employee');
  if (employeeLimit?.limit.amount != null) {
    parts.push(`${employeeLimit.limit.amount}€${limitUnitLabels[employeeLimit.limit.per]}`);
  }

  return parts.join(' · ');
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED UI COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

const Toggle: FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; note?: string; small?: boolean }> = ({ checked, onChange, label, note, small }) => (
  <div>
    <label className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex shrink-0 rounded-full transition-all duration-300 ease-in-out ${
          checked ? 'bg-primary-500' : 'bg-gray-200'
        } ${small ? 'h-5 w-9' : 'h-6 w-11'}`}
      >
        <span
          className={`inline-block shrink-0 transform rounded-full bg-white shadow transition-transform duration-300 ease-out ${
            small ? 'h-4 w-4 mt-0.5' : 'h-5 w-5 mt-0.5'
          } ${checked ? (small ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0.5'}`}
        />
      </button>
      <span className={`text-slate-700 ${small ? 'text-xs' : 'text-sm'}`}>{label}</span>
    </label>
    {note && <p className="ml-[52px] mt-1 text-xs text-slate-500">{note}</p>}
  </div>
);

const Section: FC<{ title?: string; note?: string; children: React.ReactNode; noBorder?: boolean }> = ({ title, note, children, noBorder }) => (
  <section className={noBorder ? '' : 'border-b border-gray-100 pb-6 mb-6'}>
    {title && (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
      </div>
    )}
    {children}
  </section>
);

const ChipInput: FC<{ values: string[]; onChange: (v: string[]) => void; suggestions: string[] }> = ({ values, onChange, suggestions }) => {
  const available = suggestions.filter((s) => !values.includes(s));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="rounded p-0.5 hover:bg-gray-200">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      {available.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {available.slice(0, 5).map((s) => (
            <button key={s} type="button" onClick={() => onChange([...values, s])} className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-slate-500 hover:bg-gray-100">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTRAINTS POPOVER
───────────────────────────────────────────────────────────────────────────── */

interface ConstraintsPopoverProps {
  expenseType: ExpenseType;
  roleLimit: RoleLimit;
  onChange: (rl: RoleLimit) => void;
  onClose: () => void;
}

const ConstraintsPopover: FC<ConstraintsPopoverProps> = ({ expenseType, roleLimit, onChange, onClose }) => {
  const constraints = roleLimit.constraints || {};

  const updateConstraint = <K extends keyof NonNullable<RoleLimit['constraints']>>(key: K, value: NonNullable<RoleLimit['constraints']>[K]) => {
    onChange({ ...roleLimit, constraints: { ...constraints, [key]: value } });
  };

  const toggleClass = (cls: string, field: 'allowedClasses' | 'allowedCategories') => {
    const current = constraints[field] || [];
    const newVal = current.includes(cls) ? current.filter((c) => c !== cls) : [...current, cls];
    updateConstraint(field, newVal);
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-900">Contraintes {policyRoleLabels[roleLimit.role]}</h4>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      {expenseType === 'hotel' && (
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-600">Étoiles max</label>
          <div className="flex gap-2">
            {HOTEL_STARS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateConstraint('maxStarRating', s)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  constraints.maxStarRating === s ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-slate-600 hover:border-gray-300'
                }`}
              >
                {s}★
              </button>
            ))}
            <button
              type="button"
              onClick={() => updateConstraint('maxStarRating', null)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                constraints.maxStarRating == null ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-slate-600 hover:border-gray-300'
              }`}
            >
              Aucune
            </button>
          </div>
        </div>
      )}

      {expenseType === 'flight' && (
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-600">Classes autorisées</label>
          <div className="space-y-1.5">
            {FLIGHT_CLASSES.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={constraints.allowedClasses?.includes(c)}
                  onChange={() => toggleClass(c, 'allowedClasses')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <span className="text-xs text-slate-700">{c}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {expenseType === 'train' && (
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-600">Classes autorisées</label>
          <div className="space-y-1.5">
            {TRAIN_CLASSES.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={constraints.allowedClasses?.includes(c)}
                  onChange={() => toggleClass(c, 'allowedClasses')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <span className="text-xs text-slate-700">{c}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {expenseType === 'car_rental' && (
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-600">Catégories autorisées</label>
          <div className="grid grid-cols-2 gap-1.5">
            {CAR_RENTAL_CATEGORIES.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={constraints.allowedCategories?.includes(c)}
                  onChange={() => toggleClass(c, 'allowedCategories')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <span className="text-xs text-slate-700">{c}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {expenseType === 'mileage' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Distance max par trajet</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={constraints.maxKmPerTrip ?? ''}
                onChange={(e) => updateConstraint('maxKmPerTrip', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Illimité"
                className="w-24 text-center"
              />
              <span className="text-xs text-slate-500">km</span>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Distance max par jour</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={constraints.maxKmPerDay ?? ''}
                onChange={(e) => updateConstraint('maxKmPerDay', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Illimité"
                className="w-24 text-center"
              />
              <span className="text-xs text-slate-500">km</span>
            </div>
          </div>
        </div>
      )}

      {expenseType === 'client_meal' && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Max convives sans validation</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={constraints.maxGuestsWithoutApproval ?? ''}
              onChange={(e) => updateConstraint('maxGuestsWithoutApproval', e.target.value === '' ? undefined : Number(e.target.value))}
              placeholder="—"
              className="w-20 text-center"
            />
            <span className="text-xs text-slate-500">personnes</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MILEAGE RATES POPOVER
───────────────────────────────────────────────────────────────────────────── */

interface MileageRatesPopoverProps {
  roleLimit: RoleLimit;
  onChange: (rl: RoleLimit) => void;
  onClose: () => void;
}

const MileageRatesPopover: FC<MileageRatesPopoverProps> = ({ roleLimit, onChange, onClose }) => {
  const rates = roleLimit.mileageRates || { mode: 'unique', unique: 0.45 };

  const updateRates = (patch: Partial<NonNullable<RoleLimit['mileageRates']>>) => {
    onChange({ ...roleLimit, mileageRates: { ...rates, ...patch } });
  };

  const updatePowerRate = (power: string, rate: number) => {
    const byPower = rates.byPower || MILEAGE_POWERS.map((p) => ({ power: p, rate: 0.45 }));
    const newByPower = byPower.map((b) => (b.power === power ? { ...b, rate } : b));
    updateRates({ byPower: newByPower });
  };

  const importUrssaf = () => {
    updateRates({
      mode: 'byPower',
      byPower: [
        { power: '3 CV', rate: 0.502 },
        { power: '4 CV', rate: 0.575 },
        { power: '5 CV', rate: 0.603 },
        { power: '6 CV', rate: 0.631 },
        { power: '7 CV+', rate: 0.661 },
      ],
    });
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-900">Barème {policyRoleLabels[roleLimit.role]}</h4>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        {(['unique', 'byPower'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => updateRates({ mode: m })}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              rates.mode === m ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-slate-600 hover:border-gray-300'
            }`}
          >
            {m === 'unique' ? 'Barème unique' : 'Par puissance'}
          </button>
        ))}
      </div>

      {rates.mode === 'unique' ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">Tarif :</span>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={rates.unique ?? ''}
            onChange={(e) => updateRates({ unique: Number(e.target.value) || 0 })}
            className="w-20 text-center"
          />
          <span className="text-xs text-slate-500">€/km</span>
        </div>
      ) : (
        <div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-1.5 text-left font-medium text-slate-600">Puissance</th>
                  <th className="px-3 py-1.5 text-left font-medium text-slate-600">€/km</th>
                </tr>
              </thead>
              <tbody>
                {(rates.byPower || MILEAGE_POWERS.map((p) => ({ power: p, rate: 0.45 }))).map((b) => (
                  <tr key={b.power} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-1.5 text-slate-700">{b.power}</td>
                    <td className="px-3 py-1.5">
                      <Input
                        type="number"
                        min={0}
                        step={0.001}
                        value={b.rate}
                        onChange={(e) => updatePowerRate(b.power, Number(e.target.value) || 0)}
                        className="w-16 text-center"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={importUrssaf} className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700">
            Importer barème URSSAF 2026
          </button>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   LIMITS BY ROLE TABLE
───────────────────────────────────────────────────────────────────────────── */

interface LimitsByRoleTableProps {
  expenseType: ExpenseType;
  mode: ReimbursementMode;
  limitsByRole: RoleLimit[];
  onChange: (limits: RoleLimit[]) => void;
}

const LimitsByRoleTable: FC<LimitsByRoleTableProps> = ({ expenseType, mode, limitsByRole, onChange }) => {
  const [openPopover, setOpenPopover] = useState<{ role: PolicyRole; type: 'constraints' | 'mileage' } | null>(null);

  const updateRole = (role: PolicyRole, patch: Partial<RoleLimit>) => {
    onChange(limitsByRole.map((rl) => (rl.role === role ? { ...rl, ...patch } : rl)));
  };

  const hasConstraints = ['hotel', 'flight', 'train', 'car_rental', 'mileage', 'client_meal'].includes(expenseType);
  const isMealsPerDiem = expenseType === 'meals' && mode === 'per_diem';
  const isMileage = expenseType === 'mileage';

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">Poste</th>
            {isMealsPerDiem ? (
              <>
                <th className="px-2 py-2.5 text-center text-xs font-medium text-slate-600">Petit-déj</th>
                <th className="px-2 py-2.5 text-center text-xs font-medium text-slate-600">Déjeuner</th>
                <th className="px-2 py-2.5 text-center text-xs font-medium text-slate-600">Dîner</th>
                <th className="px-2 py-2.5 text-center text-xs font-medium text-slate-600">Total</th>
              </>
            ) : isMileage ? (
              <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-600">Barème</th>
            ) : (
              <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-600">
                {mode === 'per_diem' ? 'Forfait' : 'Plafond'}
              </th>
            )}
            {hasConstraints && <th className="px-2 py-2.5 text-center text-xs font-medium text-slate-600">Contraintes</th>}
            <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-600">Override</th>
          </tr>
        </thead>
        <tbody>
          {limitsByRole.map((rl) => {
            const perDiemTotal = rl.perDiem ? rl.perDiem.breakfast + rl.perDiem.lunch + rl.perDiem.dinner : 0;
            return (
              <tr key={rl.role} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-slate-700">{policyRoleLabels[rl.role]}</td>

                {isMealsPerDiem ? (
                  <>
                    <td className="px-2 py-2.5 text-center">
                      <Input
                        type="number"
                        min={0}
                        value={rl.perDiem?.breakfast ?? ''}
                        onChange={(e) =>
                          updateRole(rl.role, {
                            perDiem: { ...rl.perDiem!, breakfast: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-16 border-0 bg-transparent text-center focus:ring-0"
                      />
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <Input
                        type="number"
                        min={0}
                        value={rl.perDiem?.lunch ?? ''}
                        onChange={(e) =>
                          updateRole(rl.role, {
                            perDiem: { ...rl.perDiem!, lunch: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-16 border-0 bg-transparent text-center focus:ring-0"
                      />
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <Input
                        type="number"
                        min={0}
                        value={rl.perDiem?.dinner ?? ''}
                        onChange={(e) =>
                          updateRole(rl.role, {
                            perDiem: { ...rl.perDiem!, dinner: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-16 border-0 bg-transparent text-center focus:ring-0"
                      />
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs font-medium text-slate-600">{perDiemTotal} €</td>
                  </>
                ) : isMileage ? (
                  <td className="relative px-4 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => setOpenPopover(openPopover?.role === rl.role && openPopover.type === 'mileage' ? null : { role: rl.role, type: 'mileage' })}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      {rl.mileageRates?.mode === 'unique' ? `${rl.mileageRates.unique ?? 0.45} €/km` : 'Par puissance'}
                      <Settings2 className="h-3.5 w-3.5" />
                    </button>
                    {openPopover?.role === rl.role && openPopover.type === 'mileage' && (
                      <MileageRatesPopover roleLimit={rl} onChange={(newRl) => updateRole(rl.role, newRl)} onClose={() => setOpenPopover(null)} />
                    )}
                  </td>
                ) : (
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        value={rl.limit.amount ?? ''}
                        onChange={(e) =>
                          updateRole(rl.role, {
                            limit: { ...rl.limit, amount: e.target.value === '' ? null : Number(e.target.value) },
                          })
                        }
                        className="w-20 border-0 bg-transparent text-center focus:ring-0"
                        placeholder="—"
                      />
                      <span className="text-xs text-slate-400">€</span>
                    </div>
                  </td>
                )}

                {hasConstraints && (
                  <td className="relative px-2 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => setOpenPopover(openPopover?.role === rl.role && openPopover.type === 'constraints' ? null : { role: rl.role, type: 'constraints' })}
                      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      Configurer
                      <Settings2 className="h-3.5 w-3.5" />
                    </button>
                    {openPopover?.role === rl.role && openPopover.type === 'constraints' && (
                      <ConstraintsPopover
                        expenseType={expenseType}
                        roleLimit={rl}
                        onChange={(newRl) => updateRole(rl.role, newRl)}
                        onClose={() => setOpenPopover(null)}
                      />
                    )}
                  </td>
                )}

                <td className="px-4 py-2.5">
                  <div className="flex flex-col items-center gap-1">
                    <label className="flex cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={rl.overrideAllowed}
                        onChange={(e) => updateRole(rl.role, { overrideAllowed: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
                      />
                      <span className="text-xs text-slate-600">Autorisé</span>
                    </label>
                    {rl.overrideAllowed && (
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={rl.overrideRequiresJustification ?? false}
                          onChange={(e) => updateRole(rl.role, { overrideRequiresJustification: e.target.checked })}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
                        />
                        <span className="text-xs text-slate-500">Justif.</span>
                      </label>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   CITY SUPPLEMENTS
───────────────────────────────────────────────────────────────────────────── */

interface CitySupplementsProps {
  supplements: CitySupplement[];
  onChange: (supplements: CitySupplement[]) => void;
}

const CitySupplements: FC<CitySupplementsProps> = ({ supplements, onChange }) => {
  const addSupplement = () => {
    onChange([...supplements, { id: `cs-${Date.now()}`, cities: [], supplementAmount: 0 }]);
  };

  const removeSupplement = (id: string) => {
    onChange(supplements.filter((s) => s.id !== id));
  };

  const updateSupplement = (id: string, patch: Partial<CitySupplement>) => {
    onChange(supplements.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  return (
    <div className="space-y-3">
      {supplements.map((sup) => (
        <div key={sup.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
          <div className="flex-1">
            <ChipInput values={sup.cities} onChange={(cities) => updateSupplement(sup.id, { cities })} suggestions={VILLES_SUGGESTIONS} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">+</span>
            <Input
              type="number"
              min={0}
              value={sup.supplementAmount || ''}
              onChange={(e) => updateSupplement(sup.id, { supplementAmount: Number(e.target.value) || 0 })}
              className="w-20 text-center"
            />
            <span className="text-xs text-slate-500">€</span>
            <button type="button" onClick={() => removeSupplement(sup.id)} className="p-1 text-slate-400 hover:text-slate-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addSupplement} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700">
        <Plus className="h-4 w-4" /> Ajouter un supplément ville
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export interface RuleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseType: ExpenseType;
  rule: PolicyRule | null;
  onSave: (rule: PolicyRule) => void;
}

const RuleConfigModal: FC<RuleConfigModalProps> = ({ isOpen, onClose, expenseType, rule: initialRule, onSave }) => {
  const config = EXPENSE_TYPE_CONFIG[expenseType];
  const { nom, Icon, color } = config;
  const TypeIcon = Icon;
  const availableModes = AVAILABLE_MODES[expenseType];

  const [visible, setVisible] = useState(false);
  const [rule, setRule] = useState<PolicyRule>(() => initialRule ?? createDefaultRule(expenseType));

  const resetForm = useCallback(() => {
    setRule(initialRule ?? createDefaultRule(expenseType));
  }, [expenseType, initialRule]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setVisible(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
    }
  }, [isOpen, resetForm]);

  const handleModeChange = (mode: ReimbursementMode) => {
    setRule({
      ...rule,
      reimbursementMode: mode,
      receiptRequired: mode === 'real',
      limitsByRole: rule.limitsByRole.map((rl) => createDefaultRoleLimit(rl.role, expenseType, mode)),
    });
  };

  const handleSave = () => {
    onSave(rule);
    onClose();
  };

  if (!isOpen) return null;

  const hasCitySupplements = ['hotel', 'flight', 'meals', 'client_meal'].includes(expenseType);
  const hasRequiredInfo = expenseType === 'client_meal';
  const hasReimbursableOptions = expenseType === 'car_rental';
  const hasAllowedVehicles = expenseType === 'mileage';
  const hasDescriptionRequired = expenseType === 'miscellaneous';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden
        onClick={onClose}
      />
      <div
        className={`relative z-50 w-full max-w-3xl transform rounded-2xl bg-white shadow-xl transition-all duration-200 ${visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        role="dialog"
        aria-modal
        aria-labelledby="rule-config-title"
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <TypeIcon className="h-5 w-5" />
            </span>
            <h2 id="rule-config-title" className="text-lg font-semibold text-slate-900">
              Configuration : {nom}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Content scrollable */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {/* Section 1: Mode selection (except mileage) */}
          {expenseType !== 'mileage' && (
            <Section title="Mode de remboursement">
              <div className="grid grid-cols-2 gap-3">
                {availableModes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModeChange(m)}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      rule.reimbursementMode === m ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <span className={`h-3.5 w-3.5 rounded-full border-2 ${rule.reimbursementMode === m ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`} />
                      {MODE_CONFIG[m].label}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">{MODE_CONFIG[m].desc}</p>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Section 2: Limits by role */}
          <Section title="Plafonds par poste">
            <LimitsByRoleTable
              expenseType={expenseType}
              mode={rule.reimbursementMode}
              limitsByRole={rule.limitsByRole}
              onChange={(limits) => setRule({ ...rule, limitsByRole: limits })}
            />
          </Section>

          {/* Section 3: City supplements (if applicable) */}
          {hasCitySupplements && (
            <Section title="Suppléments par ville" note="Ces montants s'ajoutent au plafond du poste">
              <CitySupplements supplements={rule.citySupplements || []} onChange={(s) => setRule({ ...rule, citySupplements: s })} />
            </Section>
          )}

          {/* Section 4: Additional options per expense type */}
          {hasRequiredInfo && (
            <Section title="Informations obligatoires">
              <div className="flex flex-wrap gap-4">
                {CLIENT_MEAL_INFOS.map((info) => (
                  <label key={info} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.requiredInfo?.includes(info)}
                      onChange={(e) => {
                        const current = rule.requiredInfo || [];
                        setRule({ ...rule, requiredInfo: e.target.checked ? [...current, info] : current.filter((i) => i !== info) });
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm text-slate-700">{info}</span>
                  </label>
                ))}
              </div>
            </Section>
          )}

          {hasReimbursableOptions && (
            <Section title="Options remboursables">
              <div className="flex flex-wrap gap-4">
                {CAR_RENTAL_OPTIONS.map((opt) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.reimbursableOptions?.includes(opt)}
                      onChange={(e) => {
                        const current = rule.reimbursableOptions || [];
                        setRule({ ...rule, reimbursableOptions: e.target.checked ? [...current, opt] : current.filter((o) => o !== opt) });
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm text-slate-700">{opt}</span>
                  </label>
                ))}
              </div>
            </Section>
          )}

          {hasAllowedVehicles && (
            <Section title="Véhicules autorisés">
              <div className="flex flex-wrap gap-4">
                {MILEAGE_VEHICLES.map((v) => (
                  <label key={v} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.allowedVehicles?.includes(v)}
                      onChange={(e) => {
                        const current = rule.allowedVehicles || [];
                        setRule({ ...rule, allowedVehicles: e.target.checked ? [...current, v] : current.filter((x) => x !== v) });
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm text-slate-700">{v}</span>
                  </label>
                ))}
              </div>
              {rule.allowedVehicles?.includes('Vélo') && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-600">Indemnité vélo :</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={rule.bikeAllowance ?? ''}
                    onChange={(e) => setRule({ ...rule, bikeAllowance: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="0.25"
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-slate-500">€ / km</span>
                </div>
              )}
            </Section>
          )}

          {hasDescriptionRequired && (
            <Section title="Options">
              <Toggle
                checked={rule.descriptionRequired ?? false}
                onChange={(v) => setRule({ ...rule, descriptionRequired: v })}
                label="Description détaillée obligatoire"
              />
            </Section>
          )}

          {/* Section 5: Receipt */}
          <Section noBorder title="Justificatif">
            {rule.reimbursementMode === 'real' ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>📎</span>
                <span>Justificatif obligatoire (mode réel)</span>
              </div>
            ) : (
              <Toggle
                checked={rule.receiptRequired}
                onChange={(v) => setRule({ ...rule, receiptRequired: v })}
                label="Justificatif obligatoire"
                note={expenseType === 'mileage' ? 'Ex: photo compteur, capture itinéraire' : undefined}
              />
            )}
          </Section>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2 border-t border-gray-100 p-6">
          <Button type="button" variant="secondary" onClick={onClose} className="rounded-lg px-6 py-2">
            Annuler
          </Button>
          <Button type="button" variant="primary" onClick={handleSave} className="rounded-lg px-6 py-2">
            Appliquer
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default RuleConfigModal;
