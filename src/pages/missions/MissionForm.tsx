import type { FC, SVGProps } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  MapPin,
  Euro,
  Building2,
  Plane,
  Train,
  Car,
  Utensils,
  Users,
  CarTaxiFront,
  Gauge,
  ParkingCircle,
  Package,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { categoriesDepense, baremesForfaitaires, politiques, missions, mockUsers } from '../../data/mockData';
import type { DepensePrevueMission, MockUser } from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

type Step = 1 | 2 | 3;

interface FormValues {
  titre: string;
  description: string;
  destination: string;
  dateDebut: string;
  dateFin: string;
  centreCout: string;
  demandeAvance: boolean;
  montantAvance?: number | undefined;
  commentaire: string;
}

type ExpenseType =
  | 'hotel'
  | 'flight'
  | 'train'
  | 'car_rental'
  | 'meals'
  | 'client_meal'
  | 'taxi'
  | 'mileage'
  | 'parking'
  | 'miscellaneous';

interface ExpenseTypeConfig {
  id: ExpenseType;
  name: string;
  icon: FC<SVGProps<SVGSVGElement>>;
  color: string;
}

interface ExpectedExpenseBase {
  id: string;
  type: ExpenseType;
  totalAmount: number;
  summary: string;
  dateLabel?: string;
}

type ExpectedExpense = ExpectedExpenseBase & {
  data: Record<string, any>;
};

const EXPENSE_TYPES: ExpenseTypeConfig[] = [
  { id: 'hotel', name: 'Hôtel', icon: Building2, color: 'bg-violet-100 text-violet-700' },
  { id: 'flight', name: 'Vol', icon: Plane, color: 'bg-blue-100 text-blue-700' },
  { id: 'train', name: 'Train', icon: Train, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'car_rental', name: 'Location voiture', icon: Car, color: 'bg-amber-100 text-amber-700' },
  { id: 'meals', name: 'Repas', icon: Utensils, color: 'bg-pink-100 text-pink-700' },
  { id: 'client_meal', name: 'Repas client', icon: Users, color: 'bg-red-100 text-red-700' },
  { id: 'taxi', name: 'Taxi / VTC', icon: CarTaxiFront, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'mileage', name: 'Kilométrique', icon: Gauge, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'parking', name: 'Parking', icon: ParkingCircle, color: 'bg-slate-100 text-slate-700' },
  { id: 'miscellaneous', name: 'Autres', icon: Package, color: 'bg-stone-100 text-stone-700' },
];

const DESTINATIONS_SUGGESTIONS = [
  'Paris, France',
  'Lyon, France',
  'Marseille, France',
  'Lille, France',
  'Bordeaux, France',
  'Nantes, France',
  'Toulouse, France',
  'Nice, France',
  'Bruxelles, Belgique',
  'Berlin, Allemagne',
  'Genève, Suisse',
];

/** Map categorieId (mockData) vers ExpenseType (formulaire). */
function mapCategorieToExpenseType(categorieId: string): ExpenseType {
  const id = (categorieId || '').toLowerCase();
  if (['flight', 'vol'].some((k) => id.includes(k))) return 'flight';
  if (['train'].some((k) => id.includes(k))) return 'train';
  if (['hotel', 'hébergement'].some((k) => id.includes(k))) return 'hotel';
  if (['meals', 'repas'].some((k) => id.includes(k))) return 'meals';
  if (['taxi'].some((k) => id.includes(k))) return 'taxi';
  if (['car', 'location'].some((k) => id.includes(k))) return 'car_rental';
  return 'miscellaneous';
}

/** Convertir une dépense prévue mission en ExpectedExpense (étape 2). */
function depensePrevueToExpected(dp: DepensePrevueMission): ExpectedExpense {
  const type = mapCategorieToExpenseType(dp.categorieId);
  return {
    id: dp.id,
    type,
    totalAmount: dp.montantEstime,
    summary: dp.description || `${dp.categorieId} – ${dp.montantEstime} €`,
    data: {
      description: dp.description,
      montantEstime: dp.montantEstime,
      modeRemboursement: dp.modeRemboursement,
    },
  };
}

const MissionForm: FC = () => {
  const { id: missionId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isTeamMode = searchParams.get('team') === 'true';
  const isEditMode = Boolean(missionId && missionId !== 'new');
  const missionToEdit = useMemo(
    () => (isEditMode && missionId ? missions.find((m) => m.id === missionId) ?? null : null),
    [isEditMode, missionId],
  );

  const [step, setStep] = useState<Step>(1);
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      titre: '',
      description: '',
      destination: '',
      dateDebut: '',
      dateFin: '',
      centreCout: '',
      demandeAvance: false,
      montantAvance: undefined,
      commentaire: '',
    },
    mode: 'onChange',
  });

  const values = watch();
  const [selectedResponsable, setSelectedResponsable] = useState<string>('');
  const [responsableSearch, setResponsableSearch] = useState('');
  const [responsableDropdownOpen, setResponsableDropdownOpen] = useState(false);

  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantDropdownOpen, setParticipantDropdownOpen] = useState(false);

  const currentManagerId = 'user-006';
  const teamMembers = useMemo(
    () => mockUsers.filter((u) => u.managerId === currentManagerId || u.id === currentManagerId),
    [],
  );

  const filteredResponsables = useMemo(() => {
    const q = responsableSearch.toLowerCase();
    return teamMembers.filter(
      (u) =>
        `${u.prenom} ${u.nom}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [teamMembers, responsableSearch]);

  const filteredTeamMembers = useMemo(() => {
    const q = participantSearch.toLowerCase();
    return teamMembers.filter(
      (u) =>
        u.id !== selectedResponsable &&
        !selectedParticipants.includes(u.id) &&
        (`${u.prenom} ${u.nom}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  }, [teamMembers, selectedParticipants, selectedResponsable, participantSearch]);

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
    setParticipantSearch('');
    setParticipantDropdownOpen(false);
  };

  const [expectedExpenses, setExpectedExpenses] = useState<ExpectedExpense[]>([]);
  const [expenseMode, setExpenseMode] = useState<'list' | 'chooseType' | 'form'>('list');
  const [currentType, setCurrentType] = useState<ExpenseType | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});

  /** Préremplir les 3 étapes quand on édite une mission (brouillon ou rejetée). */
  useEffect(() => {
    if (!missionToEdit) return;
    const dateDebut = missionToEdit.dateDebut.slice(0, 10);
    const dateFin = missionToEdit.dateFin.slice(0, 10);
    reset({
      titre: missionToEdit.titre ?? '',
      description: '',
      destination: missionToEdit.destination ?? '',
      dateDebut,
      dateFin,
      centreCout: missionToEdit.projetAssocie ?? '',
      demandeAvance: false,
      montantAvance: undefined,
      commentaire: '',
    });
    setSelectedResponsable(missionToEdit.userId ?? '');
    setSelectedParticipants(missionToEdit.participants?.filter((id) => id !== missionToEdit.userId) ?? []);
    const prevues = missionToEdit.depensesPrevues ?? [];
    setExpectedExpenses(prevues.map(depensePrevueToExpected));
    setExpenseMode('list');
    setStep(1);
  }, [missionToEdit, reset]);

  const totalExpectedAmount = useMemo(
    () => expectedExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0),
    [expectedExpenses],
  );

  const expectedByType = useMemo(() => {
    const map = new Map<ExpenseType, number>();
    expectedExpenses.forEach((e) => {
      map.set(e.type, (map.get(e.type) ?? 0) + e.totalAmount);
    });
    return Array.from(map.entries()).map(([type, amount]) => ({
      type,
      amount,
      config: EXPENSE_TYPES.find((t) => t.id === type)!,
    }));
  }, [expectedExpenses]);

  const applicableBareme = useMemo(() => {
    if (!values.destination) return undefined;
    const ville = values.destination.split(',')[0]?.trim().toLowerCase();
    return baremesForfaitaires.find(
      (b) => b.ville.toLowerCase() === ville,
    );
  }, [values.destination]);

  const activePolitique = useMemo(
    () => politiques[0],
    [],
  );

  const resetDraft = () => {
    setDraft({});
    setCurrentType(null);
    setEditingIndex(null);
  };

  const openCreateExpense = () => {
    resetDraft();
    setExpenseMode('chooseType');
  };

  const openEditExpense = (index: number) => {
    const exp = expectedExpenses[index];
    setCurrentType(exp.type);
    setDraft({ ...exp.data });
    setEditingIndex(index);
    setExpenseMode('form');
  };

  const goToStep = async (next: Step) => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1 && next > 1) {
      fieldsToValidate = ['titre', 'destination', 'dateDebut', 'dateFin', 'centreCout'];
    }
    if (fieldsToValidate.length > 0) {
      const valid = await trigger(fieldsToValidate);
      if (!valid) return;
    }
    setStep(next);
  };

  const onSubmit = (data: FormValues) => {
    // eslint-disable-next-line no-console
    console.log('Mission soumise', { ...data, responsable: selectedResponsable, participants: selectedParticipants, expectedExpenses });
  };

  const onSaveDraft = (data: FormValues) => {
    // eslint-disable-next-line no-console
    console.log('Brouillon enregistré', { ...data, responsable: selectedResponsable, participants: selectedParticipants, expectedExpenses });
  };

  const stepLabel = (s: Step) => {
    switch (s) {
      case 1:
        return 'Informations générales';
      case 2:
        return 'Dépenses prévues';
      case 3:
        return 'Options et validation';
    }
  };

  const isStepCompleted = (s: Step) => {
    // Une étape est considérée comme "complétée" dès qu'on est passé à l'étape suivante.
    return s < step;
  };

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Fil d'Ariane en mode édition */}
      {isEditMode && missionToEdit && missionId && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/missions" className="hover:text-slate-700 underline-offset-2 hover:underline">
            Missions
          </Link>
          <span className="text-slate-400">/</span>
          <Link to={`/missions/${missionId}`} className="hover:text-slate-700 underline-offset-2 hover:underline truncate max-w-[200px]">
            {missionToEdit.titre}
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700 font-medium">Modifier</span>
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs shadow-sm">
        {[1, 2, 3].map((s) => {
          const isActive = step === s;
          const completed = isStepCompleted(s as Step);
          return (
            <button
              key={s}
              type="button"
              onClick={() => goToStep(s as Step)}
              className={[
                'flex flex-1 items-center gap-2 rounded-xl px-3 py-2 transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : completed
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-50',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={[
                  'flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold',
                  isActive
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : completed
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 bg-white text-slate-500',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {s}
              </span>
              <span className="truncate">{stepLabel(s as Step)}</span>
            </button>
          );
        })}
      </div>

      {/* Étapes */}
      {step === 1 && (
        <Card>
          <CardHeader className="border-b-0 pb-1">
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Titre de la mission"
                placeholder="Ex : Visite clients Île-de-France"
                error={errors.titre?.message}
                {...register('titre', {
                  required: 'Le titre est obligatoire.',
                  minLength: { value: 3, message: 'Au moins 3 caractères.' },
                })}
              />
            </div>
            {/* Responsable de la mission (mode équipe uniquement) */}
            {isTeamMode && <div className="md:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">
                Responsable de la mission
              </label>
              {selectedResponsable ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const u = mockUsers.find((m) => m.id === selectedResponsable);
                    if (!u) return null;
                    return (
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">
                          {u.prenom[0]}{u.nom[0]}
                        </span>
                        <span className="font-medium">{u.prenom} {u.nom}</span>
                        <span className="text-[11px] text-slate-400">{u.departement}</span>
                        <button
                          type="button"
                          className="ml-0.5 text-slate-400 hover:text-slate-700"
                          onClick={() => setSelectedResponsable('')}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })()}
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un membre de l'équipe..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    value={responsableSearch}
                    onChange={(e) => {
                      setResponsableSearch(e.target.value);
                      setResponsableDropdownOpen(true);
                    }}
                    onFocus={() => setResponsableDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setResponsableDropdownOpen(false), 150)}
                  />
                  {responsableDropdownOpen && filteredResponsables.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white py-1 shadow-lg max-h-48 overflow-y-auto">
                      {filteredResponsables.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-slate-50 transition-colors"
                          onClick={() => {
                            setSelectedResponsable(u.id);
                            setSelectedParticipants((prev) => prev.filter((id) => id !== u.id));
                            setResponsableSearch('');
                            setResponsableDropdownOpen(false);
                          }}
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                            {u.prenom[0]}{u.nom[0]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">{u.prenom} {u.nom}</p>
                            <p className="text-[11px] text-slate-500 truncate">{u.departement} · {u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>}

            <div className="md:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Description
              </label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                placeholder="Objectifs, contexte, participants..."
                {...register('description')}
              />
            </div>
            <div>
              <Input
                label="Destination"
                placeholder="Ex : Paris, France"
                error={errors.destination?.message}
                leftIcon={<MapPin className="h-4 w-4" />}
                list="mission-destinations"
                {...register('destination', {
                  required: 'La destination est obligatoire.',
                })}
              />
              <datalist id="mission-destinations">
                {DESTINATIONS_SUGGESTIONS.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  label="Date de début"
                  error={errors.dateDebut?.message}
                  {...register('dateDebut', {
                    required: 'La date de début est obligatoire.',
                  })}
                />
                <Input
                  type="date"
                  label="Date de fin"
                  error={errors.dateFin?.message}
                  {...register('dateFin', {
                    required: 'La date de fin est obligatoire.',
                    validate: (value) =>
                      !values.dateDebut ||
                      new Date(value) >= new Date(values.dateDebut) ||
                      'La date de fin doit être postérieure à la date de début.',
                  })}
                />
              </div>
            </div>
            <div>
              <Select
                label="Projet / Centre de coût"
                error={errors.centreCout?.message}
                {...register('centreCout', {
                  required: 'Le centre de coût est obligatoire.',
                })}
              >
                <option value="">Sélectionner...</option>
                <option value="CC101">CC101 - Ventes Île-de-France</option>
                <option value="CC202">CC202 - Marketing Europe</option>
                <option value="CC305">CC305 - Projet ERP</option>
                <option value="CC410">CC410 - Support clients</option>
              </Select>
            </div>

            {/* Participants (mode équipe uniquement) */}
            {isTeamMode && <div className="md:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">
                Autres participants
              </label>

              {/* Selected chips */}
              {selectedParticipants.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {selectedParticipants.map((uid) => {
                    const u = mockUsers.find((m) => m.id === uid);
                    if (!u) return null;
                    return (
                      <span
                        key={uid}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">
                          {u.prenom[0]}{u.nom[0]}
                        </span>
                        {u.prenom} {u.nom}
                        <button
                          type="button"
                          className="ml-0.5 text-slate-400 hover:text-slate-700"
                          onClick={() => toggleParticipant(uid)}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un membre de l'équipe..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  value={participantSearch}
                  onChange={(e) => {
                    setParticipantSearch(e.target.value);
                    setParticipantDropdownOpen(true);
                  }}
                  onFocus={() => setParticipantDropdownOpen(true)}
                />

                {/* Dropdown */}
                {participantDropdownOpen && filteredTeamMembers.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white py-1 shadow-lg max-h-48 overflow-y-auto">
                    {filteredTeamMembers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-slate-50 transition-colors"
                        onClick={() => toggleParticipant(u.id)}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                          {u.prenom[0]}{u.nom[0]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 truncate">{u.prenom} {u.nom}</p>
                          <p className="text-[11px] text-slate-500 truncate">{u.departement} · {u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {participantDropdownOpen && filteredTeamMembers.length === 0 && participantSearch && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500 shadow-lg">
                    Aucun membre trouvé
                  </div>
                )}
              </div>
            </div>}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="border-b-0 pb-1">
            <CardTitle>Dépenses prévues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Sélection du type ou formulaire spécifique */}
            {expenseMode === 'list' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Dépenses prévues
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    className="text-xs"
                    onClick={openCreateExpense}
                  >
                    Ajouter une dépense prévue
                  </Button>
                </div>

                {/* Liste des dépenses prévues */}
                <div className="space-y-2">
                  {expectedExpenses.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500">
                      <p>Aucune dépense prévue pour le moment.</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={openCreateExpense}
                      >
                        Ajouter une dépense prévue
                      </Button>
                    </div>
                  )}
                  {expectedExpenses.length > 0 && (
                    <div className="space-y-2">
                      {expectedExpenses.map((exp, index) => {
                        const cfg = EXPENSE_TYPES.find((t) => t.id === exp.type)!;
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={exp.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-xl ${cfg.color}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="text-xs">
                                <p className="font-semibold text-slate-900">
                                  {cfg.name}
                                </p>
                                <p className="text-slate-600">{exp.summary}</p>
                                {exp.dateLabel && (
                                  <p className="text-[11px] text-slate-500">
                                      {exp.dateLabel}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {exp.totalAmount.toLocaleString('fr-FR')} €
                              </p>
                              <div className="flex gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs px-2"
                                  onClick={() => openEditExpense(index)}
                                >
                                  Modifier
                                </Button>
                                <button
                                  type="button"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                  onClick={() =>
                                    setExpectedExpenses((prev) =>
                                      prev.filter((_, i) => i !== index),
                                    )
                                  }
                                  aria-label="Supprimer la dépense"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Synthèse minimale */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-xs text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Total des dépenses prévues
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {totalExpectedAmount.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sélection du type */}
            {expenseMode === 'chooseType' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
                      onClick={() => setExpenseMode('list')}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                    <span className="font-medium">Choisir un type de dépense</span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {EXPENSE_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 text-left text-xs text-slate-800 shadow-sm hover:border-primary-200 hover:shadow-md transition-all"
                        onClick={() => {
                          setCurrentType(t.id);
                          setDraft({});
                          setExpenseMode('form');
                        }}
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="font-semibold">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formulaire spécifique par type */}
            {expenseMode === 'form' && currentType && (
              <div className="space-y-4">
                {(() => {
                  const cfg = EXPENSE_TYPES.find((t) => t.id === currentType)!;
                  const Icon = cfg.icon;

                  const updateDraft = (patch: Record<string, any>) =>
                    setDraft((prev) => ({ ...prev, ...patch }));

                  const handleCancel = () => {
                    resetDraft();
                    setExpenseMode('list');
                  };

                  const saveExpense = () => {
                    let total = 0;
                    let summary = '';
                    let dateLabel: string | undefined;

                    switch (currentType) {
                      case 'hotel': {
                        const nights =
                          draft.checkInDate && draft.checkOutDate
                            ? Math.max(
                                1,
                                Math.ceil(
                                  (new Date(draft.checkOutDate).getTime() -
                                    new Date(draft.checkInDate).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                ),
                              )
                            : draft.numberOfNights || 0;
                        const price = Number(draft.pricePerNight || 0);
                        total = nights * price;
                        summary = `${draft.ville || 'Ville'} – ${nights || 0} nuit(s)`;
                        if (draft.checkInDate && draft.checkOutDate) {
                          dateLabel = `${draft.checkInDate} → ${draft.checkOutDate}`;
                        }
                        break;
                      }
                      case 'flight': {
                        total = Number(draft.estimatedAmount || 0);
                        const direction = draft.isRoundTrip
                          ? `${draft.departure || 'Origine'} ↔ ${draft.destination || 'Destination'}`
                          : `${draft.departure || 'Origine'} → ${draft.destination || 'Destination'}`;
                        summary = direction;
                        if (draft.departureDate) {
                          dateLabel = draft.isRoundTrip && draft.returnDate
                            ? `${draft.departureDate} & ${draft.returnDate}`
                            : draft.departureDate;
                        }
                        break;
                      }
                      case 'train': {
                        total = Number(draft.estimatedAmount || 0);
                        const direction = draft.isRoundTrip
                          ? `${draft.departureStation || 'Départ'} ↔ ${draft.arrivalStation || 'Arrivée'}`
                          : `${draft.departureStation || 'Départ'} → ${draft.arrivalStation || 'Arrivée'}`;
                        summary = direction;
                        if (draft.departureDate) {
                          dateLabel = draft.isRoundTrip && draft.returnDate
                            ? `${draft.departureDate} & ${draft.returnDate}`
                            : draft.departureDate;
                        }
                        break;
                      }
                      case 'car_rental': {
                        const days =
                          draft.pickupDate && draft.dropoffDate
                            ? Math.max(
                                1,
                                Math.ceil(
                                  (new Date(draft.dropoffDate).getTime() -
                                    new Date(draft.pickupDate).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                ),
                              )
                            : draft.numberOfDays || 0;
                        const price = Number(draft.pricePerDay || 0);
                        total = days * price;
                        summary = `${draft.pickupLocation || 'Lieu de prise en charge'} – ${
                          days || 0
                        } jour(s)`;
                        if (draft.pickupDate && draft.dropoffDate) {
                          dateLabel = `${draft.pickupDate} → ${draft.dropoffDate}`;
                        }
                        break;
                      }
                      case 'meals': {
                        const days = Number(draft.numberOfDays || 0);
                        const perDiem = Number(draft.perDiemRate || 0);
                        const usePerDiem = !!draft.usePerDiem;
                        const mealsCount =
                          (draft.mealBreakfast ? 1 : 0) +
                          (draft.mealLunch ? 1 : 0) +
                          (draft.mealDinner ? 1 : 0);
                        total = usePerDiem ? days * perDiem : Number(draft.totalAmount || 0);
                        const parts = [];
                        if (draft.mealBreakfast) parts.push('petits-déjeuners');
                        if (draft.mealLunch) parts.push('déjeuners');
                        if (draft.mealDinner) parts.push('dîners');
                        summary = `${days || 0} jour(s) – ${parts.join(' / ') || 'repas'}`;
                        break;
                      }
                      case 'client_meal': {
                        total = Number(draft.estimatedAmount || 0);
                        summary = `${draft.city || 'Ville'} – ${draft.numberOfGuests || 0} invité(s)`;
                        if (draft.date) {
                          dateLabel = draft.date;
                        }
                        break;
                      }
                      case 'taxi': {
                        const trips = Number(draft.numberOfTrips || 0);
                        const avg = Number(draft.averagePerTrip || 0);
                        total = trips * avg;
                        summary = `${trips || 0} trajet(s)`;
                        break;
                      }
                      case 'mileage': {
                        const km = Number(draft.estimatedKm || 0);
                        const rate = Number(draft.ratePerKm || 0);
                        total = km * rate;
                        summary = `${km || 0} km – ${draft.vehicleType || 'Véhicule'}`;
                        break;
                      }
                      case 'parking': {
                        const days =
                          draft.startDate && draft.endDate
                            ? Math.max(
                                1,
                                Math.ceil(
                                  (new Date(draft.endDate).getTime() -
                                    new Date(draft.startDate).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                ),
                              )
                            : draft.numberOfDays || 0;
                        const price = Number(draft.pricePerDay || 0);
                        total = days * price;
                        summary = `${draft.location || 'Parking'} – ${days || 0} jour(s)`;
                        if (draft.startDate && draft.endDate) {
                          dateLabel = `${draft.startDate} → ${draft.endDate}`;
                        }
                        break;
                      }
                      case 'miscellaneous': {
                        total = Number(draft.estimatedAmount || 0);
                        summary = draft.category || 'Autre dépense';
                        break;
                      }
                      default:
                        total = 0;
                    }

                    const newExpense: ExpectedExpense = {
                      id: editingIndex != null
                        ? expectedExpenses[editingIndex].id
                        : crypto.randomUUID(),
                      type: currentType,
                      totalAmount: total,
                      summary,
                      dateLabel,
                      data: { ...draft },
                    };

                    setExpectedExpenses((prev) => {
                      if (editingIndex != null) {
                        return prev.map((e, idx) => (idx === editingIndex ? newExpense : e));
                      }
                      return [...prev, newExpense];
                    });

                    setExpenseMode('list');
                    resetDraft();
                  };

                  const renderFields = () => {
                    const commonButtons = (
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={saveExpense}
                        >
                          {editingIndex != null ? 'Mettre à jour' : 'Ajouter'}
                        </Button>
                      </div>
                    );

                    switch (currentType) {
                      case 'hotel': {
                        const nights =
                          draft.checkInDate && draft.checkOutDate
                            ? Math.max(
                                1,
                                Math.ceil(
                                  (new Date(draft.checkOutDate).getTime() -
                                    new Date(draft.checkInDate).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                ),
                              )
                            : Number(draft.numberOfNights || 0);
                        const price = Number(draft.pricePerNight || 0);
                        const total = nights * price;
                        return (
                          <>
                            <div className="grid gap-3 md:grid-cols-2 text-xs">
                              <Input
                                label="Ville"
                                placeholder="Paris"
                                value={draft.ville || ''}
                                onChange={(e) => updateDraft({ ville: e.target.value })}
                              />
                              <Input
                                label="Nom de l'hôtel (optionnel)"
                                value={draft.hotelName || ''}
                                onChange={(e) => updateDraft({ hotelName: e.target.value })}
                              />
                              <Input
                                type="date"
                                label="Date d'arrivée"
                                value={draft.checkInDate || ''}
                                onChange={(e) => updateDraft({ checkInDate: e.target.value })}
                              />
                              <Input
                                type="date"
                                label="Date de départ"
                                value={draft.checkOutDate || ''}
                                onChange={(e) => updateDraft({ checkOutDate: e.target.value })}
                              />
                              <Input
                                label="Nombre de nuits"
                                value={nights || ''}
                                readOnly
                              />
                              <Input
                                type="number"
                                label="Prix par nuit (€)"
                                leftIcon={<Euro className="h-3.5 w-3.5" />}
                                value={draft.pricePerNight || ''}
                                onChange={(e) =>
                                  updateDraft({ pricePerNight: Number(e.target.value) })
                                }
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-600">
                                  Petit-déjeuner inclus
                                </span>
                                <button
                                  type="button"
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                                    draft.breakfastIncluded
                                      ? 'border-primary-500 bg-primary-500'
                                      : 'border-slate-300 bg-slate-200'
                                  }`}
                                  onClick={() =>
                                    updateDraft({
                                      breakfastIncluded: !draft.breakfastIncluded,
                                    })
                                  }
                                >
                                  <span
                                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                      draft.breakfastIncluded
                                        ? 'translate-x-4'
                                        : 'translate-x-0.5'
                                    }`}
                                  />
                                </button>
                              </div>
                              <Input
                                label="Référence de réservation (optionnel)"
                                value={draft.bookingReference || ''}
                                onChange={(e) =>
                                  updateDraft({ bookingReference: e.target.value })
                                }
                              />
                            </div>
                            <div className="mt-2 text-xs text-slate-600">
                              Total estimé :{' '}
                              <span className="font-semibold">
                                {total.toLocaleString('fr-FR')} €
                              </span>
                            </div>
                            {commonButtons}
                          </>
                        );
                      }
                      case 'flight': {
                        const total = Number(draft.estimatedAmount || 0);
                        return (
                          <>
                            <div className="grid gap-3 md:grid-cols-2 text-xs">
                              <div className="flex items-center gap-2 md:col-span-2">
                                <span className="text-[11px] font-medium text-slate-600">
                                  Aller-retour
                                </span>
                                <button
                                  type="button"
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                                    draft.isRoundTrip
                                      ? 'border-primary-500 bg-primary-500'
                                      : 'border-slate-300 bg-slate-200'
                                  }`}
                                  onClick={() =>
                                    updateDraft({ isRoundTrip: !draft.isRoundTrip })
                                  }
                                >
                                  <span
                                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                      draft.isRoundTrip ? 'translate-x-4' : 'translate-x-0.5'
                                    }`}
                                  />
                                </button>
                              </div>
                              <Input
                                label="Départ"
                                value={draft.departure || ''}
                                onChange={(e) => updateDraft({ departure: e.target.value })}
                              />
                              <Input
                                label="Destination"
                                value={draft.destination || ''}
                                onChange={(e) => updateDraft({ destination: e.target.value })}
                              />
                              <Input
                                type="date"
                                label="Date aller"
                                value={draft.departureDate || ''}
                                onChange={(e) =>
                                  updateDraft({ departureDate: e.target.value })
                                }
                              />
                              {draft.isRoundTrip && (
                                <Input
                                  type="date"
                                  label="Date retour"
                                  value={draft.returnDate || ''}
                                  onChange={(e) =>
                                    updateDraft({ returnDate: e.target.value })
                                  }
                                />
                              )}
                              <Select
                                label="Classe"
                                value={draft.cabinClass || 'economy'}
                                onChange={(e) =>
                                  updateDraft({ cabinClass: e.target.value })
                                }
                              >
                                <option value="economy">Économie</option>
                                <option value="premium_economy">Premium Economy</option>
                                <option value="business">Business</option>
                                <option value="first">Première</option>
                              </Select>
                              <Input
                                type="number"
                                label="Montant estimé (€)"
                                leftIcon={<Euro className="h-3.5 w-3.5" />}
                                value={draft.estimatedAmount || ''}
                                onChange={(e) =>
                                  updateDraft({ estimatedAmount: Number(e.target.value) })
                                }
                              />
                              <Input
                                label="Compagnie (optionnel)"
                                value={draft.airline || ''}
                                onChange={(e) => updateDraft({ airline: e.target.value })}
                              />
                              <Input
                                label="Numéro de vol (optionnel)"
                                value={draft.flightNumber || ''}
                                onChange={(e) =>
                                  updateDraft({ flightNumber: e.target.value })
                                }
                              />
                            </div>
                            <div className="mt-2 text-xs text-slate-600">
                              Total estimé :{' '}
                              <span className="font-semibold">
                                {total.toLocaleString('fr-FR')} €
                              </span>
                            </div>
                            {commonButtons}
                          </>
                        );
                      }
                      case 'train': {
                        const total = Number(draft.estimatedAmount || 0);
                        return (
                          <>
                            <div className="grid gap-3 md:grid-cols-2 text-xs">
                              <div className="flex items-center gap-2 md:col-span-2">
                                <span className="text-[11px] font-medium text-slate-600">
                                  Aller-retour
                                </span>
                                <button
                                  type="button"
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                                    draft.isRoundTrip
                                      ? 'border-primary-500 bg-primary-500'
                                      : 'border-slate-300 bg-slate-200'
                                  }`}
                                  onClick={() =>
                                    updateDraft({ isRoundTrip: !draft.isRoundTrip })
                                  }
                                >
                                  <span
                                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                      draft.isRoundTrip ? 'translate-x-4' : 'translate-x-0.5'
                                    }`}
                                  />
                                </button>
                              </div>
                              <Input
                                label="Gare de départ"
                                value={draft.departureStation || ''}
                                onChange={(e) =>
                                  updateDraft({ departureStation: e.target.value })
                                }
                              />
                              <Input
                                label="Gare d'arrivée"
                                value={draft.arrivalStation || ''}
                                onChange={(e) =>
                                  updateDraft({ arrivalStation: e.target.value })
                                }
                              />
                              <Input
                                type="date"
                                label="Date aller"
                                value={draft.departureDate || ''}
                                onChange={(e) =>
                                  updateDraft({ departureDate: e.target.value })
                                }
                              />
                              {draft.isRoundTrip && (
                                <Input
                                  type="date"
                                  label="Date retour"
                                  value={draft.returnDate || ''}
                                  onChange={(e) =>
                                    updateDraft({ returnDate: e.target.value })
                                  }
                                />
                              )}
                              <Input
                                type="number"
                                label="Montant estimé (€)"
                                leftIcon={<Euro className="h-3.5 w-3.5" />}
                                value={draft.estimatedAmount || ''}
                                onChange={(e) =>
                                  updateDraft({ estimatedAmount: Number(e.target.value) })
                                }
                              />
                              <Input
                                label="Train (TGV, Intercités…) (optionnel)"
                                value={draft.trainType || ''}
                                onChange={(e) => updateDraft({ trainType: e.target.value })}
                              />
                            </div>
                            <div className="mt-2 text-xs text-slate-600">
                              Total estimé :{' '}
                              <span className="font-semibold">
                                {total.toLocaleString('fr-FR')} €
                              </span>
                            </div>
                            {commonButtons}
                          </>
                        );
                      }
                      case 'car_rental': {
                        const days =
                          draft.pickupDate && draft.dropoffDate
                            ? Math.max(
                                1,
                                Math.ceil(
                                  (new Date(draft.dropoffDate).getTime() -
                                    new Date(draft.pickupDate).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                ),
                              )
                            : Number(draft.numberOfDays || 0);
                        const price = Number(draft.pricePerDay || 0);
                        const total = days * price;
                        return (
                          <>
                            <div className="grid gap-3 md:grid-cols-2 text-xs">
                              <Input
                                label="Lieu de prise en charge"
                                placeholder="Aéroport de Paris-CDG"
                                value={draft.pickupLocation || ''}
                                onChange={(e) =>
                                  updateDraft({ pickupLocation: e.target.value })
                                }
                              />
                              <Input
                                label="Agence / Loueur (optionnel)"
                                value={draft.rentalCompany || ''}
                                onChange={(e) =>
                                  updateDraft({ rentalCompany: e.target.value })
                                }
                              />
                              <Input
                                type="date"
                                label="Date de début"
                                value={draft.pickupDate || ''}
                                onChange={(e) => updateDraft({ pickupDate: e.target.value })}
                              />
                              <Input
                                type="date"
                                label="Date de fin"
                                value={draft.dropoffDate || ''}
                                onChange={(e) => updateDraft({ dropoffDate: e.target.value })}
                              />
                              <Input
                                label="Nombre de jours"
                                value={days || ''}
                                readOnly
                              />
                              <Input
                                type="number"
                                label="Prix par jour (€)"
                                leftIcon={<Euro className="h-3.5 w-3.5" />}
                                value={draft.pricePerDay || ''}
                                onChange={(e) =>
                                  updateDraft({ pricePerDay: Number(e.target.value) })
                                }
                              />
                              <Select
                                label="Catégorie de véhicule"
                                value={draft.carCategory || 'economy'}
                                onChange={(e) =>
                                  updateDraft({ carCategory: e.target.value })
                                }
                              >
                                <option value="economy">Économique</option>
                                <option value="compact">Compacte</option>
                                <option value="midsize">Intermédiaire</option>
                                <option value="suv">SUV</option>
                              </Select>
                            </div>
                            <div className="mt-2 text-xs text-slate-600">
                              Total estimé :{' '}
                              <span className="font-semibold">
                                {total.toLocaleString('fr-FR')} €
                              </span>
                            </div>
                            {commonButtons}
                          </>
                        );
                      }
                      case 'meals': {
                        const days = Number(draft.numberOfDays || 0);
                        const perDiem = Number(draft.perDiemRate || 0);
                        const usePerDiem = !!draft.usePerDiem;
                        const total = usePerDiem
                          ? days * perDiem
                          : Number(draft.totalAmount || 0);
                        return (
                          <>
                            <div className="grid gap-3 md:grid-cols-2 text-xs">
                              <Input
                                type="number"
                                label="Nombre de jours"
                                value={draft.numberOfDays || ''}
                                onChange={(e) =>
                                  updateDraft({ numberOfDays: Number(e.target.value) })
                                }
                              />
                              <Input
                                type="number"
                                label="Forfait par jour (€)"
                                leftIcon={<Euro className="h-3.5 w-3.5" />}
                                value={draft.perDiemRate || ''}
                                onChange={(e) =>
                                  updateDraft({ perDiemRate: Number(e.target.value) })
                                }
                              />
                              <div className="flex items-center gap-2 md:col-span-2">
                                <span className="text-[11px] font-medium text-slate-600">
                                  Utiliser le forfait par jour
                                </span>
                                <button
                                  type="button"
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                                    usePerDiem
                                      ? 'border-primary-500 bg-primary-500'
                                      : 'border-slate-300 bg-slate-200'
                                  }`}
                                  onClick={() =>
                                    updateDraft({ usePerDiem: !draft.usePerDiem })
                                  }
                                >
                                  <span
                                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                      usePerDiem ? 'translate-x-4' : 'translate-x-0.5'
                                    }`}
                                  />
                                </button>
                              </div>
                              {!usePerDiem && (
                                <Input
                                  type="number"
                                  label="Montant total estimé (€)"
                                  leftIcon={<Euro className="h-3.5 w-3.5" />}
                                  value={draft.totalAmount || ''}
                                  onChange={(e) =>
                                    updateDraft({ totalAmount: Number(e.target.value) })
                                  }
                                />
                              )}
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <span className="text-[11px] font-medium text-slate-600">
                                  Types de repas concernés
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className={`rounded-full border px-2 py-1 text-[11px] ${
                                      draft.mealBreakfast
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-slate-200 text-slate-600'
                                    }`}
                                    onClick={() =>
                                      updateDraft({ mealBreakfast: !draft.mealBreakfast })
                                    }
                                  >
                                    Petit-déjeuner
                                  </button>
                                  <button
                                    type="button"
                                    className={`rounded-full border px-2 py-1 text-[11px] ${
                                      draft.mealLunch
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-slate-200 text-slate-600'
                                    }`}
                                    onClick={() =>
                                      updateDraft({ mealLunch: !draft.mealLunch })
                                    }
                                  >
                                    Déjeuner
                                  </button>
                                  <button
                                    type="button"
                                    className={`rounded-full border px-2 py-1 text-[11px] ${
                                      draft.mealDinner
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-slate-200 text-slate-600'
                                    }`}
                                    onClick={() =>
                                      updateDraft({ mealDinner: !draft.mealDinner })
                                    }
                                  >
                                    Dîner
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-600">
                              Total estimé :{' '}
                              <span className="font-semibold">
                                {total.toLocaleString('fr-FR')} €
                              </span>
                            </div>
                            {commonButtons}
                          </>
                        );
                      }
                      case 'client_meal': {
                        const total = Number(draft.estimatedAmount || 0);
                        return (
                          <>
                            <div className="grid gap-3 md:grid-cols-2 text-xs">
                              <Input
                                label="Ville"
                                value={draft.city || ''}
                                onChange={(e) => updateDraft({ city: e.target.value })}
                              />
                              <Input
                                type="date"
                                label="Date"
                                value={draft.date || ''}
                                onChange={(e) => updateDraft({ date: e.target.value })}
                              />
                              <Input
                                type="number"
                                label="Nombre de participants (collaborateurs + clients)"
                                value={draft.numberOfGuests || ''}
                                onChange={(e) =>
                                  updateDraft({ numberOfGuests: Number(e.target.value) })
                                }
                              />
                              <Input
                                type="number"
                                label="Montant estimé (€)"
                                leftIcon={<Euro className="h-3.5 w-3.5" />}
                                value={draft.estimatedAmount || ''}
                                onChange={(e) =>
                                  updateDraft({ estimatedAmount: Number(e.target.value) })
                                }
                              />
                              <Input
                                label="Client / prospect (optionnel)"
                                value={draft.clientName || ''}
                                onChange={(e) =>
                                  updateDraft({ clientName: e.target.value })
                                }
                              />
                              <Input
                                label="Objet / contexte (optionnel)"
                                value={draft.purpose || ''}
                                onChange={(e) => updateDraft({ purpose: e.target.value })}
                              />
                            </div>
                            <div className="mt-2 text-xs text-slate-600">
                              Total estimé :{' '}
                              <span className="font-semibold">
                                {total.toLocaleString('fr-FR')} €
                              </span>
                            </div>
                            {commonButtons}
                          </>
                        );
                      }
                      case 'taxi': {
                        const trips = Number(draft.numberOfTrips || 0);
                        const avg = Number(draft.averagePerTrip || 0);
                        const total = trips * avg;
                        return (
                          <>
                            <div className="grid gap-3 md:grid-cols-2 text-xs">
                              <Input
                                type="number"
                                label="Nombre de trajets"
                                value={draft.numberOfTrips || ''}
                                onChange={(e) =>
                                  updateDraft({ numberOfTrips: Number(e.target.value) })
                                }
                              />
                              <Input
                                type="number"
                                label="Montant moyen par trajet (€)"
                                leftIcon={<Euro className="h-3.5 w-3.5" />}
                                value={draft.averagePerTrip || ''}
                                onChange={(e) =>
                                  updateDraft({ averagePerTrip: Number(e.target.value) })
                                }
                              />
                              <Input
                                label="Ville principale (optionnel)"
                                value={draft.city || ''}
                                onChange={(e) => updateDraft({ city: e.target.value })}
                              />
                            </div>
                            <div className="mt-2 text-xs text-slate-600">
                              Total estimé :{' '}
                              <span className="font-semibold">
                                {total.toLocaleString('fr-FR')} €
                              </span>
                            </div>
                            {commonButtons}
                          </>
                        );
                      }
                      case 'mileage': {
                        const km = Number(draft.estimatedKm || 0);
                        const rate = Number(draft.ratePerKm || 0);
                        const total = km * rate;
                        return (
                          <>
                            <div className="grid gap-3 md:grid-cols-2 text-xs">
                              <Input
                                type="number"
                                label="Kilomètres estimés"
                                value={draft.estimatedKm || ''}
                                onChange={(e) =>
                                  updateDraft({ estimatedKm: Number(e.target.value) })
                                }
                              />
                              <Input
                                type="number"
                                label="Taux au kilomètre (€)"
                                leftIcon={<Euro className="h-3.5 w-3.5" />}
                                value={draft.ratePerKm || ''}
                                onChange={(e) =>
                                  updateDraft({ ratePerKm: Number(e.target.value) })
                                }
                              />
                              <Select
                                label="Type de véhicule"
                                value={draft.vehicleType || 'car'}
                                onChange={(e) =>
                                  updateDraft({ vehicleType: e.target.value })
                                }
                              >
                                <option value="car">Voiture</option>
                                <option value="motorcycle">Deux-roues</option>
                                <option value="van">Utilitaire</option>
                              </Select>
                              <Input
                                label="Immatriculation (optionnel)"
                                value={draft.plateNumber || ''}
                                onChange={(e) =>
                                  updateDraft({ plateNumber: e.target.value })
                                }
                              />
                            </div>
                            <div className="mt-2 text-xs text-slate-600">
                              Total estimé :{' '}
                              <span className="font-semibold">
                                {total.toLocaleString('fr-FR')} €
                              </span>
                            </div>
                            {commonButtons}
                          </>
                        );
                      }
                      case 'parking': {
                        const days =
                          draft.startDate && draft.endDate
                            ? Math.max(
                                1,
                                Math.ceil(
                                  (new Date(draft.endDate).getTime() -
                                    new Date(draft.startDate).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                ),
                              )
                            : Number(draft.numberOfDays || 0);
                        const price = Number(draft.pricePerDay || 0);
                        const total = days * price;
                        return (
                          <>
                            <div className="grid gap-3 md:grid-cols-2 text-xs">
                              <Input
                                label="Lieu de stationnement"
                                value={draft.location || ''}
                                onChange={(e) => updateDraft({ location: e.target.value })}
                              />
                              <Input
                                type="date"
                                label="Date de début"
                                value={draft.startDate || ''}
                                onChange={(e) => updateDraft({ startDate: e.target.value })}
                              />
                              <Input
                                type="date"
                                label="Date de fin"
                                value={draft.endDate || ''}
                                onChange={(e) => updateDraft({ endDate: e.target.value })}
                              />
                              <Input
                                label="Nombre de jours"
                                value={days || ''}
                                readOnly
                              />
                              <Input
                                type="number"
                                label="Prix par jour (€)"
                                leftIcon={<Euro className="h-3.5 w-3.5" />}
                                value={draft.pricePerDay || ''}
                                onChange={(e) =>
                                  updateDraft({ pricePerDay: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div className="mt-2 text-xs text-slate-600">
                              Total estimé :{' '}
                              <span className="font-semibold">
                                {total.toLocaleString('fr-FR')} €
                              </span>
                            </div>
                            {commonButtons}
                          </>
                        );
                      }
                      case 'miscellaneous': {
                        const total = Number(draft.estimatedAmount || 0);
                        return (
                          <>
                            <div className="grid gap-3 md:grid-cols-2 text-xs">
                              <Input
                                label="Type de dépense"
                                placeholder="Frais de visa, péage, fournitures..."
                                value={draft.category || ''}
                                onChange={(e) => updateDraft({ category: e.target.value })}
                              />
                              <Input
                                type="date"
                                label="Date (si connue)"
                                value={draft.date || ''}
                                onChange={(e) => updateDraft({ date: e.target.value })}
                              />
                              <Input
                                type="number"
                                label="Montant estimé (€)"
                                leftIcon={<Euro className="h-3.5 w-3.5" />}
                                value={draft.estimatedAmount || ''}
                                onChange={(e) =>
                                  updateDraft({ estimatedAmount: Number(e.target.value) })
                                }
                              />
                              <Input
                                label="Commentaire (optionnel)"
                                value={draft.comment || ''}
                                onChange={(e) => updateDraft({ comment: e.target.value })}
                              />
                            </div>
                            <div className="mt-2 text-xs text-slate-600">
                              Total estimé :{' '}
                              <span className="font-semibold">
                                {total.toLocaleString('fr-FR')} €
                              </span>
                            </div>
                            {commonButtons}
                          </>
                        );
                      }
                      default:
                        return null;
                    }
                  };

                  return (
                    <>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
                          onClick={() => {
                            setExpenseMode('chooseType');
                            resetDraft();
                          }}
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full ${cfg.color}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-semibold">{cfg.name}</span>
                        </span>
                      </div>
                      {renderFields()}
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="border-b-0 pb-1">
            <CardTitle>Options et validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Avance de frais
                </p>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-700">
                    Demander une avance pour cette mission
                  </span>
                  <button
                    type="button"
                    className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                      values.demandeAvance
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-slate-300 bg-slate-200'
                    }`}
                    onClick={() =>
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore - on met à jour via event synthétique
                      (document.getElementById('demandeAvance-hidden') as HTMLInputElement).click()
                    }
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        values.demandeAvance ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <input
                    id="demandeAvance-hidden"
                    type="checkbox"
                    className="hidden"
                    {...register('demandeAvance')}
                  />
                </label>
                {values.demandeAvance && (
                  <div className="max-w-xs">
                    <Input
                      type="number"
                      step="50"
                      min={0}
                      label="Montant de l'avance demandée"
                      leftIcon={<Euro className="h-4 w-4" />}
                      error={errors.montantAvance?.message}
                      {...register('montantAvance', {
                        required: 'Le montant de l’avance est obligatoire.',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Le montant doit être positif.' },
                      })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Commentaire pour l&apos;approbateur
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  placeholder="Contexte, urgences, éléments utiles pour la validation..."
                  {...register('commentaire')}
                />
              </div>
            </div>

            {/* Résumé */}
            <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-700">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Résumé de la mission
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-[11px] text-slate-500">Titre</p>
                  <p className="font-medium text-slate-900">{values.titre || '—'}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Destination</p>
                  <p className="text-slate-900">{values.destination || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Période</p>
                  <p className="text-slate-900">
                    {values.dateDebut && values.dateFin
                      ? `${values.dateDebut} → ${values.dateFin}`
                      : '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Total des dépenses prévues
                  </p>
                  <p className="text-slate-900">
                    {totalExpectedAmount
                      ? `${totalExpectedAmount.toLocaleString('fr-FR')} €`
                      : '—'}
                  </p>
                </div>
                <div>
                  {isTeamMode && (
                    <>
                      <p className="text-[11px] text-slate-500">Responsable</p>
                      <p className="text-slate-900">
                        {(() => {
                          const u = mockUsers.find((m) => m.id === selectedResponsable);
                          return u ? `${u.prenom} ${u.nom}` : 'Non défini';
                        })()}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">Participants</p>
                      <p className="text-slate-900">
                        {selectedParticipants.length > 0
                          ? selectedParticipants
                              .map((id) => {
                                const u = mockUsers.find((m) => m.id === id);
                                return u ? `${u.prenom} ${u.nom}` : id;
                              })
                              .join(', ')
                          : 'Aucun'}
                      </p>
                    </>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500">Dépenses prévues</p>
                  <p className="text-slate-900">
                    {expectedExpenses.length > 0
                      ? `${expectedExpenses.length} élément(s)`
                      : 'Aucune'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Avance</p>
                  <p className="text-slate-900">
                    {values.demandeAvance
                      ? values.montantAvance
                        ? `${values.montantAvance.toLocaleString('fr-FR')} €`
                        : 'À préciser'
                      : 'Non'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={step === 1}
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
        >
          Précédent
        </Button>
        <div className="flex items-center gap-2">
          {/* Sauvegarder : présent dans les 3 étapes (modification) */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSubmit(onSaveDraft)}
          >
            Sauvegarder
          </Button>
          {step < 3 && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => goToStep((step + 1) as Step)}
            >
              Suivant
            </Button>
          )}
          {step === 3 && (
            <Button type="submit" variant="primary" size="sm">
              Soumettre pour validation
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default MissionForm;

