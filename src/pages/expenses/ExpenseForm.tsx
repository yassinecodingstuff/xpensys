import type { FC, FormEvent, SVGProps, ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Car,
  FileUp,
  Gauge,
  Hotel,
  MapPin,
  Utensils,
  Building2,
  Plane,
  Train,
  Users,
  CarTaxiFront,
  ParkingCircle,
  Package,
  ArrowLeft,
  Euro,
} from 'lucide-react';
import {
  missions,
  depenses,
  mockUsers,
  politiques,
  categoriesDepense,
  type Mission,
  type RegleCategorie,
} from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import {
  CURRENCIES,
  getCurrency,
  convertToEUR,
  formatAmount,
  DEFAULT_CURRENCY,
} from '../../config/currencies';

type ModeRemboursement = 'reel' | 'forfait' | 'calcule';

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

// Mapping catégorie → types disponibles
const categoryToTypesMap: Record<string, ExpenseType[]> = {
  Transport: ['flight', 'train', 'taxi', 'car_rental', 'mileage', 'parking'],
  Hôtel: ['hotel'],
  Restaurant: ['meals', 'client_meal'],
  'Frais kilométriques': ['mileage'],
  'Indemnité journalière': ['meals'],
  Autres: ['miscellaneous'],
};

// Mapping type → catégorie (pour déterminer automatiquement la catégorie depuis le type)
const typeToCategoryMap: Record<ExpenseType, string> = {
  hotel: 'Hôtel',
  flight: 'Transport',
  train: 'Transport',
  car_rental: 'Transport',
  taxi: 'Transport',
  mileage: 'Frais kilométriques',
  parking: 'Transport',
  meals: 'Restaurant',
  client_meal: 'Restaurant',
  miscellaneous: 'Autres',
};

interface FormState {
  date: string;
  amount: number | '';
  currency: string;
  description: string;
  categorieId: string;
  expenseType: ExpenseType | null;
  expenseTypeData: Record<string, any>;
  linkToMission: boolean;
  missionId?: string;
  mode: ModeRemboursement;
  switchToReelWithReason: boolean;
  switchReason: string;
  participants: string;
  commentaire: string;
  centreCout: string;
}

// Mapping catégorie dépense (mock) → ExpenseType pour le préremplissage en mode édition
const depenseCategoryToExpenseType: Record<string, ExpenseType> = {
  Train: 'train',
  Vol: 'flight',
  Hébergement: 'hotel',
  Repas: 'meals',
  Taxi: 'taxi',
  'Location voiture': 'car_rental',
  Kilométrique: 'mileage',
  Parking: 'parking',
  Autres: 'miscellaneous',
};

const currentUser = mockUsers[1]; // même logique que Dashboard (Thomas)

const formatCurrency = (value: number, currency: string) =>
  formatAmount(value, currency);

const categoryIconMap: Record<string, FC<{ className?: string }>> = {
  Transport: Car,
  Hôtel: Hotel,
  Restaurant: Utensils,
  'Frais kilométriques': Gauge,
};

const ExpenseForm: FC = () => {
  const today = useMemo(() => new Date(), []);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('editId');
  const editingExpense = editId ? depenses.find((d) => d.id === editId) : undefined;
  const isEditMode = !!editingExpense;
  const isPlannedMode = searchParams.get('planned') === 'true';
  const prefilledMissionId = searchParams.get('missionId') ?? undefined;

  const [state, setState] = useState<FormState>(() => {
    if (editingExpense) {
      const cat = categoriesDepense.find((c) => c.nom === editingExpense.categorie);
      return {
        date: editingExpense.date.split('T')[0],
        amount: editingExpense.montant,
        currency: editingExpense.devise || DEFAULT_CURRENCY,
        description: editingExpense.description,
        categorieId: cat?.id ?? categoriesDepense[0]?.id ?? '',
        expenseType: depenseCategoryToExpenseType[editingExpense.categorie] ?? null,
        expenseTypeData: {},
        linkToMission: !!editingExpense.missionId,
        missionId: editingExpense.missionId ?? undefined,
        mode: editingExpense.modeRemboursement,
        switchToReelWithReason: false,
        switchReason: '',
        participants: '',
        commentaire: '',
        centreCout: '',
      };
    }
    return {
      date: format(today, 'yyyy-MM-dd'),
      amount: '',
      currency: DEFAULT_CURRENCY,
      description: '',
      categorieId: categoriesDepense[0]?.id ?? '',
      expenseType: null,
      expenseTypeData: {},
      linkToMission: !!prefilledMissionId,
      missionId: prefilledMissionId,
      mode: 'reel',
      switchToReelWithReason: false,
      switchReason: '',
      participants: '',
      commentaire: '',
      centreCout: '',
    };
  });

  const [expenseMode, setExpenseMode] = useState<'chooseType' | 'form'>(isEditMode ? 'form' : 'chooseType');
  const [receiptInfo, setReceiptInfo] = useState<{
    fileName: string;
    extractedAmount: number;
    extractedDate: string;
  } | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const activeMissions = useMemo(
    () =>
      missions.filter(
        (m) =>
          m.userId === currentUser.id &&
          ['approuvee', 'en_attente', 'remboursee'].includes(m.statut),
      ),
    [],
  );

  const selectedMission: Mission | undefined = useMemo(
    () => activeMissions.find((m) => m.id === state.missionId),
    [activeMissions, state.missionId],
  );

  const regleCategorie: RegleCategorie | undefined = useMemo(() => {
    const politique = politiques[0];
    if (!politique || !state.categorieId) return undefined;
    return politique.reglesCategories?.find((r) => r.categorieId === state.categorieId);
  }, [state.categorieId]);

  // Met à jour le mode par défaut lorsque la catégorie change
  const handleCategorieChange = (categorieId: string) => {
    const regle = politiques[0]?.reglesCategories?.find((r) => r.categorieId === categorieId);
    setState((prev) => ({
      ...prev,
      categorieId,
      mode: regle?.modeDefaut ?? 'reel',
    }));
  };

  // Gère la sélection d'un type de dépense
  const handleTypeSelect = (type: ExpenseType) => {
    const categoryName = typeToCategoryMap[type];
    const category = categoriesDepense.find((c) => c.nom === categoryName);
    const regle = category
      ? politiques[0]?.reglesCategories?.find((r) => r.categorieId === category.id)
      : undefined;

    setState((prev) => ({
      ...prev,
      expenseType: type,
      expenseTypeData: {},
      categorieId: category?.id ?? prev.categorieId,
      mode: regle?.modeDefaut ?? 'reel',
    }));
    setExpenseMode('form');
  };

  const updateTypeData = (patch: Record<string, any>) => {
    setState((prev) => ({
      ...prev,
      expenseTypeData: { ...prev.expenseTypeData, ...patch },
    }));
  };

  const plafond = regleCategorie?.plafond ?? null;

  const montantNumber = typeof state.amount === 'number' ? state.amount : 0;

  const alerts = useMemo(() => {
    const list: string[] = [];

    if (plafond != null && montantNumber > plafond) {
      list.push(
        `Le montant dépasse le plafond de la catégorie (${formatCurrency(
          plafond,
          state.currency,
        )}).`,
      );
    }

    if (selectedMission && state.date) {
      const d = new Date(state.date);
      const start = new Date(selectedMission.dateDebut);
      const end = new Date(selectedMission.dateFin);
      if (isBefore(d, start) || isAfter(d, end)) {
        list.push('La date de la dépense est hors des dates de la mission.');
      }
    }

    if (selectedMission && state.categorieId) {
      const cat = categoriesDepense.find((c) => c.id === state.categorieId);
      if (cat && !selectedMission.categoriesDemandees.includes(cat.nom)) {
        list.push(
          `La catégorie "${cat.nom}" n’est pas autorisée pour cette mission selon la politique actuelle.`,
        );
      }
    }

    return list;
  }, [plafond, montantNumber, state.currency, selectedMission, state.date, state.categorieId]);

  const handleReceiptUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extractedDateIso = state.date || format(today, 'yyyy-MM-dd');
    const extractedAmount = typeof state.amount === 'number' && state.amount > 0 ? state.amount : 56.8;

    setReceiptInfo({
      fileName: file.name,
      extractedAmount,
      extractedDate: extractedDateIso,
    });

    const cleanedLabel = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    setState((prev) => ({
      ...prev,
      date: prev.date || extractedDateIso,
      amount: typeof prev.amount === 'number' && prev.amount > 0 ? prev.amount : extractedAmount,
      description: prev.description || cleanedLabel || prev.description,
    }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      // Mode édition : mettre à jour la dépense existante
      editingExpense.description = state.description;
      editingExpense.montant = typeof state.amount === 'number' ? state.amount : editingExpense.montant;
      editingExpense.date = state.date || editingExpense.date;
      editingExpense.missionId = state.missionId ?? editingExpense.missionId;
      navigate(`/expenses/${editingExpense.id}`);
      return;
    }
    if (isPlannedMode && prefilledMissionId) {
      // Mode dépense prévue : ajouter à la mission et retourner
      const missionObj = missions.find((m) => m.id === prefilledMissionId);
      if (missionObj) {
        const cat = categoriesDepense.find((c) => c.id === state.categorieId);
        const newPrevue = {
          id: `dp-${Date.now()}`,
          categorieId: cat?.nom ?? state.categorieId,
          description: state.description,
          montantEstime: typeof state.amount === 'number' ? state.amount : 0,
          modeRemboursement: state.mode,
        };
        if (!missionObj.depensesPrevues) missionObj.depensesPrevues = [];
        missionObj.depensesPrevues.push(newPrevue);
      }
      navigate(`/missions/${prefilledMissionId}`);
      return;
    }
    // Pour la démo, on log seulement
    // eslint-disable-next-line no-console
    console.log('Dépense sauvegardée', state);
  };

  const montantForfaitaire = plafond ?? 0;

  const montantCalcule = useMemo(() => {
    if (state.mode !== 'calcule') return 0;
    // Si le type est mileage, utiliser les données du type
    if (state.expenseType === 'mileage') {
      const km = state.expenseTypeData.estimatedKm || 0;
      const rate = state.expenseTypeData.ratePerKm || 0.35;
      return km * rate;
    }
    // Sinon, utiliser les champs génériques (pour compatibilité)
    const rate = 0.35;
    const km = state.expenseTypeData.distanceKm || 0;
    return km * rate;
  }, [state.mode, state.expenseType, state.expenseTypeData]);

  const CatMeta = categoriesDepense.find((c) => c.id === state.categorieId);
  const CatIcon = CatMeta ? categoryIconMap[CatMeta.nom] ?? Car : Car;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* En-tête mode édition */}
      {isEditMode && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
            onClick={() => navigate(`/expenses/${editingExpense.id}`)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-slate-900">Modifier la dépense</p>
            <p className="text-[11px] text-slate-500">{editingExpense.description} — {editingExpense.categorie}</p>
          </div>
        </div>
      )}

      {/* En-tête mode dépense prévue */}
      {!isEditMode && isPlannedMode && prefilledMissionId && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
            onClick={() => navigate(`/missions/${prefilledMissionId}`)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-slate-900">Ajouter une dépense prévue</p>
            <p className="text-[11px] text-slate-500">
              Mission : {missions.find((m) => m.id === prefilledMissionId)?.titre ?? prefilledMissionId}
            </p>
          </div>
        </div>
      )}

      {/* Section type de dépense */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-2">
          <CardTitle className="text-sm">Type de dépense</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-4 text-xs text-slate-700">
          {/* Mode : Sélection du type (masqué en mode édition) */}
          {expenseMode === 'chooseType' && !isEditMode && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-medium">Choisir un type de dépense</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {EXPENSE_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 text-left text-xs text-slate-800 shadow-sm hover:border-primary-200 hover:shadow-md transition-all"
                      onClick={() => handleTypeSelect(t.id)}
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

          {/* Mode : Formulaire spécifique */}
          {expenseMode === 'form' && state.expenseType && (() => {
            const typeConfig = EXPENSE_TYPES.find((t) => t.id === state.expenseType);
            if (!typeConfig) return null;
            const Icon = typeConfig.icon;

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  {!isEditMode && (
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
                      onClick={() => {
                        setExpenseMode('chooseType');
                        setField('expenseType', null);
                        setField('expenseTypeData', {});
                      }}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                  )}
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${typeConfig.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold">{typeConfig.name}</span>
                </span>
              </div>

              {/* Upload justificatif après choix du type (sauf dépenses forfaitaires et dépenses prévues) */}
              {state.expenseType !== 'meals' && !isPlannedMode && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-600">
                    Importez le justificatif pour ce type de dépense. Les champs détectables (date,
                    montant, libellé) seront pré-remplis automatiquement dans les champs ci-dessous.
                  </p>
                  <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-500 hover:border-primary-400 hover:bg-primary-50/40">
                    <FileUp className="h-5 w-5 text-slate-400" />
                    <span>
                      Glissez un justificatif ici ou{' '}
                      <span className="font-medium text-primary-700">cliquez pour parcourir</span>
                    </span>
                    <span className="text-[10px] text-slate-400">PDF, JPG, PNG...</span>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={handleReceiptUpload}
                    />
                  </label>
                  {receiptInfo && (
                    <p className="text-[11px] text-slate-500">
                      Justificatif importé :{' '}
                      <span className="font-medium text-slate-900">{receiptInfo.fileName}</span>. Les
                      champs détectés ont été appliqués automatiquement aux champs de la dépense.
                    </p>
                  )}
                </div>
              )}

              {/* Formulaire spécifique au type */}
              {(() => {
                const renderTypeForm = () => {
                    switch (state.expenseType) {
                      case 'hotel': {
                        const checkIn = state.expenseTypeData.checkInDate ? new Date(state.expenseTypeData.checkInDate) : null;
                        const checkOut = state.expenseTypeData.checkOutDate ? new Date(state.expenseTypeData.checkOutDate) : null;
                        const nights = checkIn && checkOut && checkOut > checkIn
                          ? Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
                          : 0;
                        const pricePerNight = state.expenseTypeData.pricePerNight || 0;
                        const hotelTotal = nights * pricePerNight;

                        return (
                          <div className="grid gap-3 md:grid-cols-2">
                            <Input
                              label="Ville"
                              placeholder="Paris"
                              value={state.expenseTypeData.ville || ''}
                              onChange={(e) => updateTypeData({ ville: e.target.value })}
                            />
                            <Input
                              label="Nom de l'hôtel (optionnel)"
                              value={state.expenseTypeData.hotelName || ''}
                              onChange={(e) => updateTypeData({ hotelName: e.target.value })}
                            />
                            <Input
                              type="date"
                              label="Date d'arrivée"
                              value={state.expenseTypeData.checkInDate || ''}
                              onChange={(e) => {
                                updateTypeData({ checkInDate: e.target.value });
                                const ci = new Date(e.target.value);
                                const co = state.expenseTypeData.checkOutDate ? new Date(state.expenseTypeData.checkOutDate) : null;
                                if (co && co > ci) {
                                  const n = Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
                                  setField('amount', n * (state.expenseTypeData.pricePerNight || 0));
                                }
                              }}
                            />
                            <Input
                              type="date"
                              label="Date de départ"
                              value={state.expenseTypeData.checkOutDate || ''}
                              onChange={(e) => {
                                updateTypeData({ checkOutDate: e.target.value });
                                const ci = state.expenseTypeData.checkInDate ? new Date(state.expenseTypeData.checkInDate) : null;
                                const co = new Date(e.target.value);
                                if (ci && co > ci) {
                                  const n = Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
                                  setField('amount', n * (state.expenseTypeData.pricePerNight || 0));
                                }
                              }}
                            />
                            <Input
                              type="number"
                              label={`Prix par nuit (${getCurrency(state.currency).symbol})`}
                              leftIcon={<span className="text-[11px] font-semibold">{getCurrency(state.currency).symbol}</span>}
                              value={state.expenseTypeData.pricePerNight || ''}
                              onChange={(e) => {
                                const ppn = Number(e.target.value);
                                updateTypeData({ pricePerNight: ppn });
                                if (nights > 0) {
                                  setField('amount', nights * ppn);
                                }
                              }}
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-slate-600">
                                Petit-déjeuner inclus
                              </span>
                              <button
                                type="button"
                                className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                                  state.expenseTypeData.breakfastIncluded
                                    ? 'border-primary-500 bg-primary-500'
                                    : 'border-slate-300 bg-slate-200'
                                }`}
                                onClick={() =>
                                  updateTypeData({
                                    breakfastIncluded: !state.expenseTypeData.breakfastIncluded,
                                  })
                                }
                              >
                                <span
                                  className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                    state.expenseTypeData.breakfastIncluded
                                      ? 'translate-x-4'
                                      : 'translate-x-0.5'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      }
                      case 'flight': {
                        return (
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="flex items-center gap-2 md:col-span-2">
                              <span className="text-[11px] font-medium text-slate-600">
                                Aller-retour
                              </span>
                              <button
                                type="button"
                                className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                                  state.expenseTypeData.isRoundTrip
                                    ? 'border-primary-500 bg-primary-500'
                                    : 'border-slate-300 bg-slate-200'
                                }`}
                                onClick={() =>
                                  updateTypeData({ isRoundTrip: !state.expenseTypeData.isRoundTrip })
                                }
                              >
                                <span
                                  className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                    state.expenseTypeData.isRoundTrip
                                      ? 'translate-x-4'
                                      : 'translate-x-0.5'
                                  }`}
                                />
                              </button>
                            </div>
                            <Input
                              label="Départ"
                              value={state.expenseTypeData.departure || ''}
                              onChange={(e) => updateTypeData({ departure: e.target.value })}
                            />
                            <Input
                              label="Destination"
                              value={state.expenseTypeData.destination || ''}
                              onChange={(e) => updateTypeData({ destination: e.target.value })}
                            />
                            <Input
                              type="date"
                              label="Date aller"
                              value={state.expenseTypeData.departureDate || ''}
                              onChange={(e) => updateTypeData({ departureDate: e.target.value })}
                            />
                            {state.expenseTypeData.isRoundTrip && (
                              <Input
                                type="date"
                                label="Date retour"
                                value={state.expenseTypeData.returnDate || ''}
                                onChange={(e) => updateTypeData({ returnDate: e.target.value })}
                              />
                            )}
                            <Select
                              label="Classe"
                              value={state.expenseTypeData.cabinClass || 'economy'}
                              onChange={(e) => updateTypeData({ cabinClass: e.target.value })}
                            >
                              <option value="economy">Économie</option>
                              <option value="premium_economy">Premium Economy</option>
                              <option value="business">Business</option>
                              <option value="first">Première</option>
                            </Select>
                            <Input
                              label="Compagnie (optionnel)"
                              value={state.expenseTypeData.airline || ''}
                              onChange={(e) => updateTypeData({ airline: e.target.value })}
                            />
                            <Input
                              label="Numéro de vol (optionnel)"
                              value={state.expenseTypeData.flightNumber || ''}
                              onChange={(e) => updateTypeData({ flightNumber: e.target.value })}
                            />
                          </div>
                        );
                      }
                      case 'train': {
                        return (
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="flex items-center gap-2 md:col-span-2">
                              <span className="text-[11px] font-medium text-slate-600">
                                Aller-retour
                              </span>
                              <button
                                type="button"
                                className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                                  state.expenseTypeData.isRoundTrip
                                    ? 'border-primary-500 bg-primary-500'
                                    : 'border-slate-300 bg-slate-200'
                                }`}
                                onClick={() =>
                                  updateTypeData({ isRoundTrip: !state.expenseTypeData.isRoundTrip })
                                }
                              >
                                <span
                                  className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                                    state.expenseTypeData.isRoundTrip
                                      ? 'translate-x-4'
                                      : 'translate-x-0.5'
                                  }`}
                                />
                              </button>
                            </div>
                            <Input
                              label="Gare de départ"
                              value={state.expenseTypeData.departureStation || ''}
                              onChange={(e) =>
                                updateTypeData({ departureStation: e.target.value })
                              }
                            />
                            <Input
                              label="Gare d'arrivée"
                              value={state.expenseTypeData.arrivalStation || ''}
                              onChange={(e) => updateTypeData({ arrivalStation: e.target.value })}
                            />
                            <Input
                              type="date"
                              label="Date aller"
                              value={state.expenseTypeData.departureDate || ''}
                              onChange={(e) => updateTypeData({ departureDate: e.target.value })}
                            />
                            {state.expenseTypeData.isRoundTrip && (
                              <Input
                                type="date"
                                label="Date retour"
                                value={state.expenseTypeData.returnDate || ''}
                                onChange={(e) => updateTypeData({ returnDate: e.target.value })}
                              />
                            )}
                            <Input
                              label="Train (TGV, Intercités…) (optionnel)"
                              value={state.expenseTypeData.trainType || ''}
                              onChange={(e) => updateTypeData({ trainType: e.target.value })}
                            />
                          </div>
                        );
                      }
                      case 'taxi': {
                        const trips = state.expenseTypeData.numberOfTrips || 0;
                        const avgTrip = state.expenseTypeData.averagePerTrip || 0;
                        const taxiTotal = trips * avgTrip;

                        return (
                          <div className="grid gap-3 md:grid-cols-2">
                            <Input
                              type="number"
                              label="Nombre de trajets"
                              value={state.expenseTypeData.numberOfTrips || ''}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                updateTypeData({ numberOfTrips: n });
                                if (n > 0 && avgTrip > 0) setField('amount', n * avgTrip);
                              }}
                            />
                            <Input
                              type="number"
                              label={`Montant moyen par trajet (${getCurrency(state.currency).symbol})`}
                              leftIcon={<span className="text-[11px] font-semibold">{getCurrency(state.currency).symbol}</span>}
                              value={state.expenseTypeData.averagePerTrip || ''}
                              onChange={(e) => {
                                const avg = Number(e.target.value);
                                updateTypeData({ averagePerTrip: avg });
                                if (trips > 0 && avg > 0) setField('amount', trips * avg);
                              }}
                            />
                            <Input
                              label="Ville principale (optionnel)"
                              value={state.expenseTypeData.city || ''}
                              onChange={(e) => updateTypeData({ city: e.target.value })}
                            />
                          </div>
                        );
                      }
                      case 'car_rental': {
                        return (
                          <div className="grid gap-3 md:grid-cols-2">
                            <Input
                              label="Lieu de prise en charge"
                              placeholder="Aéroport de Paris-CDG"
                              value={state.expenseTypeData.pickupLocation || ''}
                              onChange={(e) => updateTypeData({ pickupLocation: e.target.value })}
                            />
                            <Input
                              label="Agence / Loueur (optionnel)"
                              value={state.expenseTypeData.rentalCompany || ''}
                              onChange={(e) => updateTypeData({ rentalCompany: e.target.value })}
                            />
                            <Input
                              type="date"
                              label="Date de début"
                              value={state.expenseTypeData.pickupDate || ''}
                              onChange={(e) => updateTypeData({ pickupDate: e.target.value })}
                            />
                            <Input
                              type="date"
                              label="Date de fin"
                              value={state.expenseTypeData.dropoffDate || ''}
                              onChange={(e) => updateTypeData({ dropoffDate: e.target.value })}
                            />
                            <Select
                              label="Catégorie de véhicule"
                              value={state.expenseTypeData.carCategory || 'economy'}
                              onChange={(e) => updateTypeData({ carCategory: e.target.value })}
                            >
                              <option value="economy">Économique</option>
                              <option value="compact">Compacte</option>
                              <option value="midsize">Intermédiaire</option>
                              <option value="suv">SUV</option>
                            </Select>
                          </div>
                        );
                      }
                      case 'meals':
                      case 'client_meal': {
                        return (
                          <div className="grid gap-3 md:grid-cols-2">
                            {state.expenseType === 'client_meal' && (
                              <>
                                <Input
                                  label="Ville"
                                  value={state.expenseTypeData.city || ''}
                                  onChange={(e) => updateTypeData({ city: e.target.value })}
                                />
                                <Input
                                  type="date"
                                  label="Date"
                                  value={state.expenseTypeData.date || ''}
                                  onChange={(e) => updateTypeData({ date: e.target.value })}
                                />
                                <Input
                                  type="number"
                                  label="Nombre de participants"
                                  value={state.expenseTypeData.numberOfGuests || ''}
                                  onChange={(e) =>
                                    updateTypeData({ numberOfGuests: Number(e.target.value) })
                                  }
                                />
                                <Input
                                  label="Client / prospect (optionnel)"
                                  value={state.expenseTypeData.clientName || ''}
                                  onChange={(e) => updateTypeData({ clientName: e.target.value })}
                                />
                              </>
                            )}
                            {state.expenseType === 'meals' && (
                              <>
                                <Input
                                  type="number"
                                  label="Nombre de jours"
                                  value={state.expenseTypeData.numberOfDays || ''}
                                  onChange={(e) =>
                                    updateTypeData({ numberOfDays: Number(e.target.value) })
                                  }
                                />
                                <div className="flex flex-col gap-1 md:col-span-2">
                                  <span className="text-[11px] font-medium text-slate-600">
                                    Types de repas concernés
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {['breakfast', 'lunch', 'dinner'].map((meal) => (
                                      <button
                                        key={meal}
                                        type="button"
                                        className={`rounded-full border px-2 py-1 text-[11px] ${
                                          state.expenseTypeData[`meal${meal.charAt(0).toUpperCase() + meal.slice(1)}`]
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-slate-200 text-slate-600'
                                        }`}
                                        onClick={() =>
                                          updateTypeData({
                                            [`meal${meal.charAt(0).toUpperCase() + meal.slice(1)}`]:
                                              !state.expenseTypeData[`meal${meal.charAt(0).toUpperCase() + meal.slice(1)}`],
                                          })
                                        }
                                      >
                                        {meal === 'breakfast'
                                          ? 'Petit-déjeuner'
                                          : meal === 'lunch'
                                          ? 'Déjeuner'
                                          : 'Dîner'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                      case 'parking': {
                        const pStart = state.expenseTypeData.startDate ? new Date(state.expenseTypeData.startDate) : null;
                        const pEnd = state.expenseTypeData.endDate ? new Date(state.expenseTypeData.endDate) : null;
                        const parkDays = pStart && pEnd && pEnd >= pStart
                          ? Math.round((pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
                          : 0;
                        const ppd = state.expenseTypeData.pricePerDay || 0;
                        const parkTotal = parkDays * ppd;

                        return (
                          <div className="grid gap-3 md:grid-cols-2">
                            <Input
                              label="Lieu de stationnement"
                              value={state.expenseTypeData.location || ''}
                              onChange={(e) => updateTypeData({ location: e.target.value })}
                            />
                            <Input
                              type="date"
                              label="Date de début"
                              value={state.expenseTypeData.startDate || ''}
                              onChange={(e) => {
                                updateTypeData({ startDate: e.target.value });
                                const s = new Date(e.target.value);
                                const en = state.expenseTypeData.endDate ? new Date(state.expenseTypeData.endDate) : null;
                                if (en && en >= s) {
                                  const d = Math.round((en.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                  if (ppd > 0) setField('amount', d * ppd);
                                }
                              }}
                            />
                            <Input
                              type="date"
                              label="Date de fin"
                              value={state.expenseTypeData.endDate || ''}
                              onChange={(e) => {
                                updateTypeData({ endDate: e.target.value });
                                const s = state.expenseTypeData.startDate ? new Date(state.expenseTypeData.startDate) : null;
                                const en = new Date(e.target.value);
                                if (s && en >= s) {
                                  const d = Math.round((en.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                  if (ppd > 0) setField('amount', d * ppd);
                                }
                              }}
                            />
                            <Input
                              type="number"
                              label={`Prix par jour (${getCurrency(state.currency).symbol})`}
                              leftIcon={<span className="text-[11px] font-semibold">{getCurrency(state.currency).symbol}</span>}
                              value={state.expenseTypeData.pricePerDay || ''}
                              onChange={(e) => {
                                const p = Number(e.target.value);
                                updateTypeData({ pricePerDay: p });
                                if (parkDays > 0 && p > 0) setField('amount', parkDays * p);
                              }}
                            />
                          </div>
                        );
                      }
                      case 'mileage': {
                        return (
                          <div className="grid gap-3 md:grid-cols-2">
                            <Input
                              type="number"
                              label="Kilomètres estimés"
                              value={state.expenseTypeData.estimatedKm || ''}
                              onChange={(e) =>
                                updateTypeData({ estimatedKm: Number(e.target.value) })
                              }
                            />
                            <Input
                              type="number"
                              label={`Taux au kilomètre (${getCurrency(state.currency).symbol})`}
                              leftIcon={<span className="text-[11px] font-semibold">{getCurrency(state.currency).symbol}</span>}
                              value={state.expenseTypeData.ratePerKm || ''}
                              onChange={(e) =>
                                updateTypeData({ ratePerKm: Number(e.target.value) })
                              }
                            />
                            <Select
                              label="Type de véhicule"
                              value={state.expenseTypeData.vehicleType || 'car'}
                              onChange={(e) => updateTypeData({ vehicleType: e.target.value })}
                            >
                              <option value="car">Voiture</option>
                              <option value="motorcycle">Deux-roues</option>
                              <option value="van">Utilitaire</option>
                            </Select>
                            <Input
                              label="Immatriculation (optionnel)"
                              value={state.expenseTypeData.plateNumber || ''}
                              onChange={(e) => updateTypeData({ plateNumber: e.target.value })}
                            />
                          </div>
                        );
                      }
                      case 'miscellaneous': {
                        return (
                          <div className="grid gap-3 md:grid-cols-2">
                            <Input
                              label="Type de dépense"
                              placeholder="Frais de visa, péage, fournitures..."
                              value={state.expenseTypeData.category || ''}
                              onChange={(e) => updateTypeData({ category: e.target.value })}
                            />
                            <Input
                              type="date"
                              label="Date (si connue)"
                              value={state.expenseTypeData.date || ''}
                              onChange={(e) => updateTypeData({ date: e.target.value })}
                            />
                            <Input
                              label="Commentaire (optionnel)"
                              value={state.expenseTypeData.comment || ''}
                              onChange={(e) => updateTypeData({ comment: e.target.value })}
                            />
                          </div>
                        );
                      }
                      default:
                        return null;
                    }
                  };

                  return renderTypeForm();
                })()}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Autres sections - affichées uniquement après sélection du type */}
      {expenseMode === 'form' && state.expenseType && (
        <>
          {/* Section montant, date, description */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-2">
              <CardTitle className="text-sm">Détails de la dépense</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-4 text-xs text-slate-700">
              {(() => {
                const autoCalcTypes: string[] = ['hotel', 'taxi', 'parking', 'mileage'];
                const isAutoCalc = autoCalcTypes.includes(state.expenseType ?? '');
                const currencyConfig = getCurrency(state.currency);
                const isAutoLocked = isAutoCalc && typeof state.amount === 'number' && state.amount > 0;
                const showConversion = state.currency !== 'EUR' && typeof state.amount === 'number' && state.amount > 0;
                const eurEquivalent = showConversion ? convertToEUR(state.amount as number, state.currency) : 0;

                return (
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1 md:col-span-1">
                        <Select
                          label="Devise"
                          value={state.currency}
                          onChange={(e) => setField('currency', e.target.value)}
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} — {c.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1 md:col-span-1">
                        <Input
                          type="number"
                          label={isAutoCalc ? `Montant (${currencyConfig.symbol}) — calculé` : `Montant (${currencyConfig.symbol})`}
                          leftIcon={<span className="text-[11px] font-semibold">{currencyConfig.symbol}</span>}
                          value={state.amount === '' ? '' : state.amount}
                          onChange={(e) => setField('amount', e.target.value ? Number(e.target.value) : '')}
                          disabled={isAutoLocked}
                          className={isAutoLocked ? 'bg-slate-50 font-semibold' : ''}
                        />
                        {isAutoLocked && (
                          <p className="text-[10px] text-slate-400">Calculé à partir des champs ci-dessus.</p>
                        )}
                      </div>
                      <div className="space-y-1 md:col-span-1">
                        <Input
                          type="date"
                          label="Date de la dépense"
                          value={state.date}
                          onChange={(e) => setField('date', e.target.value)}
                        />
                      </div>
                    </div>
                    {showConversion && (
                      <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-1.5">
                        <Euro className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-[11px] text-blue-800">
                          Équivalent indicatif : <span className="font-semibold">{formatCurrency(eurEquivalent, 'EUR')}</span>
                          <span className="ml-1 text-blue-500">(1 {state.currency} ≈ {currencyConfig.rateToEUR.toFixed(4)} EUR)</span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-600">Description</p>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                  placeholder="Décrivez la dépense..."
                  value={state.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section mission + commentaire */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-2">
              <CardTitle className="text-sm">{prefilledMissionId ? 'Commentaire' : 'Mission & commentaire'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-4 text-xs text-slate-700">
              {!prefilledMissionId && (
                <div className="space-y-1">
                  <Select
                    label="Mission"
                    value={state.missionId ?? ''}
                    onChange={(e) => setField('missionId', e.target.value || undefined)}
                  >
                    <option value="">Sans mission</option>
                    {activeMissions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.titre}
                      </option>
                    ))}
                  </Select>
                  {selectedMission && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      {format(new Date(selectedMission.dateDebut), 'dd MMM yyyy', { locale: fr })}{' '}
                      →{' '}
                      {format(new Date(selectedMission.dateFin), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-600">Commentaire</p>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                  placeholder="Ajoutez un contexte pour l'approbateur..."
                  value={state.commentaire}
                  onChange={(e) => setField('commentaire', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          <p className="flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            Attention aux règles de la politique de dépense :
          </p>
          <ul className="list-disc pl-5">
            {alerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(isEditMode ? `/expenses/${editingExpense!.id}` : isPlannedMode && prefilledMissionId ? `/missions/${prefilledMissionId}` : '/expenses')}
            >
              Annuler
            </Button>
            <div className="flex items-center gap-2">
              {!isEditMode && !isPlannedMode && (
                <Button type="button" variant="secondary" size="sm">
                  Enregistrer brouillon
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm">
                {isEditMode ? 'Enregistrer les modifications' : isPlannedMode ? 'Ajouter la dépense prévue' : 'Soumettre'}
              </Button>
            </div>
          </div>
        </>
      )}
    </form>
  );
};

export default ExpenseForm;

