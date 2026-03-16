import type { FC } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, differenceInCalendarDays, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock3,
  Download,
  Send,
  HelpCircle,
  MessageCircle,
  Wallet,
  Receipt,
  Trash2,
  SendHorizontal,
  CheckCheck,
  HandCoins,
  BadgeCheck,
  Banknote,
  Flag,
  Lock,
  MessageSquare,
} from 'lucide-react';
import {
  missions,
  depenses,
  categoriesDepense,
  politiques,
  mockUsers,
  modeRemboursementLabel,
  getFlagLabel,
} from '../../data/mockData';
import type {
  Mission as MockMission,
  Depense,
  DepensePrevueMission,
  MissionEvent as MissionEventRaw,
  MissionEventType,
  ModeRemboursement,
} from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const statusConfig: Record<
  MockMission['statut'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  brouillon: { label: 'Brouillon', variant: 'neutral' },
  en_attente: { label: 'En attente approbation', variant: 'warning' },
  info_demandee: { label: 'Information demandée', variant: 'warning' },
  approuvee: { label: 'Approuvée', variant: 'success' },
  rejetee: { label: 'Rejetée', variant: 'danger' },
  en_cours: { label: 'En cours', variant: 'success' },
  cloture_demandee: { label: 'Clôture demandée', variant: 'warning' },
  remboursee: { label: 'Remboursée', variant: 'success' },
  cloturee: { label: 'Clôturée', variant: 'neutral' },
  annulee: { label: 'Annulée', variant: 'danger' },
};

const justificatifColor: Record<Depense['statutJustificatif'], string> = {
  non_fournis: 'bg-amber-50 text-amber-700 border-amber-100',
  en_attente: 'bg-sky-50 text-sky-700 border-sky-100',
  valide: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejete: 'bg-rose-50 text-rose-700 border-rose-100',
};

type TimelineFilter = 'all' | 'approvals' | 'expenses' | 'comments';

interface MissionEvent {
  id: string;
  type: MissionEventType;
  timestamp: Date;
  actor: { id: string; name: string; avatar?: string; role: string };
  data?: {
    comment?: string;
    amount?: number;
    oldValue?: unknown;
    newValue?: unknown;
    expenseId?: string;
    expenseDescription?: string;
  };
}

type EventPointState = 'completed' | 'current' | 'upcoming' | 'rejected';

const eventCategory: Record<MissionEventType, TimelineFilter | 'other'> = {
  created: 'other',
  submitted: 'approvals',
  approved: 'approvals',
  rejected: 'approvals',
  info_requested: 'approvals',
  info_provided: 'approvals',
  budget_modified: 'approvals',
  expense_added: 'expenses',
  expense_removed: 'expenses',
  closure_requested: 'approvals',
  closure_approved: 'approvals',
  reimbursement_sent: 'expenses',
  advance_requested: 'approvals',
  advance_approved: 'approvals',
  advance_paid: 'approvals',
  completed: 'other',
  closed: 'other',
  comment: 'comments',
};

const eventIcon: Record<MissionEventType, FC<{ className?: string }>> = {
  created: FileText,
  submitted: Send,
  approved: CheckCircle2,
  rejected: XCircle,
  info_requested: HelpCircle,
  info_provided: MessageCircle,
  budget_modified: Wallet,
  expense_added: Receipt,
  expense_removed: Trash2,
  closure_requested: SendHorizontal,
  closure_approved: CheckCheck,
  reimbursement_sent: Banknote,
  advance_requested: HandCoins,
  advance_approved: BadgeCheck,
  advance_paid: Banknote,
  completed: Flag,
  closed: Lock,
  comment: MessageSquare,
};

const isApprovalEvent = (type: MissionEventType) =>
  [
    'submitted',
    'approved',
    'rejected',
    'info_requested',
    'info_provided',
    'budget_modified',
    'closure_requested',
    'closure_approved',
    'advance_requested',
    'advance_approved',
    'advance_paid',
  ].includes(type);

const isExpenseEvent = (type: MissionEventType) =>
  [
    'expense_added',
    'expense_removed',
    'reimbursement_sent',
  ].includes(type);

const isCommentEvent = (type: MissionEventType) => type === 'comment';

const MissionDetail: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const mission = missions.find((m) => m.id === id);

  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const isBrouillon = mission?.statut === 'brouillon';
  const [localDepensesPrevues, setLocalDepensesPrevues] = useState<DepensePrevueMission[]>([]);
  const [addPrevueOpen, setAddPrevueOpen] = useState(false);
  const [selectedPrevue, setSelectedPrevue] = useState<DepensePrevueMission | null>(null);
  const [prevueForm, setPrevueForm] = useState({
    categorieId: '',
    description: '',
    montantEstime: '',
    modeRemboursement: 'reel' as ModeRemboursement,
  });

  // ── Avance modal state ──────────────────────────────────────────────────
  const [avanceModalOpen, setAvanceModalOpen] = useState(false);
  const [avanceMontant, setAvanceMontant] = useState('');
  const [avanceMotif, setAvanceMotif] = useState('');
  const [avanceSuccess, setAvanceSuccess] = useState(false);

  useEffect(() => {
    if (mission?.statut === 'brouillon') {
      setLocalDepensesPrevues(mission.depensesPrevues ?? []);
    }
  }, [mission?.id, mission?.statut, mission?.depensesPrevues]);

  const displayDepensesPrevues = isBrouillon ? localDepensesPrevues : (mission?.depensesPrevues ?? []);
  const displayMontantTotalPrevu = displayDepensesPrevues.reduce((s, p) => s + p.montantEstime, 0);

  const handleAddPrevue = () => {
    const cat = prevueForm.categorieId.trim();
    const desc = prevueForm.description.trim();
    const montant = Number(prevueForm.montantEstime);
    if (!cat || !desc || Number.isNaN(montant) || montant <= 0) return;
    setLocalDepensesPrevues((prev) => [
      ...prev,
      {
        id: `dp-local-${Date.now()}`,
        categorieId: cat,
        description: desc,
        montantEstime: montant,
        modeRemboursement: prevueForm.modeRemboursement,
      },
    ]);
    setPrevueForm({ categorieId: '', description: '', montantEstime: '', modeRemboursement: 'reel' });
    setAddPrevueOpen(false);
  };

  const handleRemovePrevue = (prevueId: string) => {
    if (!isBrouillon) return;
    setLocalDepensesPrevues((prev) => prev.filter((p) => p.id !== prevueId));
  };

  const {
    missionDepenses,
    depenseTotal,
    depensesPrevues,
    montantTotalPrevu,
    categoriesAvecRegles,
    budgetAlloue,
    budgetRestant,
    budgetRatio,
    timeline,
    avanceDemo,
    totalAvances,
    couvertParAvance,
    depenseAuDelaAvance,
    isOverBudget,
    depassement,
    depenseInBudget,
    avanceInBudget,
    depenseHorsAvanceInBudget,
    pctAvance,
    pctDepense,
    pctReste,
    pctDepassement,
    totalForPct,
  } = useMemo(() => {
    if (!mission) {
      return {
        missionDepenses: [] as Depense[],
        depenseTotal: 0,
        depensesPrevues: [] as DepensePrevueMission[],
        montantTotalPrevu: 0,
        categoriesAvecRegles: [] as {
          id: string;
          nom: string;
          mode: string;
          plafond: number | null;
          depense: number;
        }[],
        budgetAlloue: null as number | null,
        budgetRestant: 0,
        budgetRatio: 0,
        timeline: [] as MissionEvent[],
        avanceDemo: 0,
        totalAvances: 0,
        couvertParAvance: 0,
        depenseAuDelaAvance: 0,
        isOverBudget: false,
        depassement: 0,
        depenseInBudget: 0,
        avanceInBudget: 0,
        depenseHorsAvanceInBudget: 0,
        pctAvance: 0,
        pctDepense: 0,
        pctReste: 0,
        pctDepassement: 0,
        totalForPct: 0,
      };
    }

    const missionDepensesValue = depenses.filter((d) => d.missionId === mission.id);
    const depenseTotalValue = missionDepensesValue.reduce((sum, d) => sum + d.montant, 0);

    const categoriesMap = new Map<string, number>();
    missionDepensesValue.forEach((d) => {
      categoriesMap.set(d.categorie, (categoriesMap.get(d.categorie) ?? 0) + d.montant);
    });

    const categoriesAvecReglesValue = mission.categoriesDemandees.map((catId) => {
      const cat = categoriesDepense.find((c) => c.id === catId);
      // Chercher dans les nouvelles rules ou les anciennes reglesCategories
      const rule = politiques[0]?.rules?.find((r) => r.expenseType === catId);
      const regle = politiques[0]?.reglesCategories?.find((r) => r.categorieId === catId);
      const depense = categoriesMap.get(cat?.nom ?? '') ?? 0;
      // Utiliser le plafond du rôle "employee" par défaut depuis les nouvelles rules
      const employeeLimit = rule?.limitsByRole?.find((rl) => rl.role === 'employee');
      return {
        id: catId,
        nom: cat?.nom ?? catId,
        mode: rule?.reimbursementMode ?? regle?.modeDefaut ?? '-',
        plafond: employeeLimit?.limit?.amount ?? regle?.plafond ?? null,
        depense,
      };
    });

    const budgetAlloueValue = mission.budgetAlloue;
    const isOverBudget = budgetAlloueValue != null && depenseTotalValue > budgetAlloueValue;
    const budgetRestantValue =
      budgetAlloueValue != null ? Math.max(budgetAlloueValue - depenseTotalValue, 0) : 0;
    const depassementValue =
      budgetAlloueValue != null ? Math.max(depenseTotalValue - budgetAlloueValue, 0) : 0;
    const budgetRatioValue =
      budgetAlloueValue && budgetAlloueValue > 0
        ? Math.min(depenseTotalValue / budgetAlloueValue, 1)
        : 0;

    const totalAvancesValue = (mission.events ?? [])
      .filter((e) => e.type === 'advance_paid')
      .reduce((s, e) => s + ((e.data as { amount?: number })?.amount ?? 0), 0);
    const couvertParAvanceValue = Math.min(depenseTotalValue, totalAvancesValue);
    const depenseAuDelaAvanceValue = Math.max(0, depenseTotalValue - totalAvancesValue);

    const depenseInBudgetValue = budgetAlloueValue != null ? Math.min(depenseTotalValue, budgetAlloueValue) : depenseTotalValue;
    const avanceInBudgetValue = Math.min(couvertParAvanceValue, depenseInBudgetValue);
    const depenseHorsAvanceInBudgetValue = depenseInBudgetValue - avanceInBudgetValue;
    const barTotal = isOverBudget ? depenseTotalValue : (budgetAlloueValue || depenseTotalValue);
    const pctAvanceValue = barTotal > 0 ? (avanceInBudgetValue / barTotal) * 100 : 0;
    const pctDepenseValue = barTotal > 0 ? (depenseHorsAvanceInBudgetValue / barTotal) * 100 : 0;
    const pctResteValue = barTotal > 0 ? (budgetRestantValue / barTotal) * 100 : 0;
    const pctDepassementValue = barTotal > 0 ? (depassementValue / barTotal) * 100 : 0;

    const rawEvents = (mission.events ?? []) as MissionEventRaw[];
    const timelineValue: MissionEvent[] = rawEvents
      .map((e) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const depensesPrevuesValue = mission.depensesPrevues ?? [];
    const montantTotalPrevuValue = depensesPrevuesValue.reduce((s, p) => s + p.montantEstime, 0);

    return {
      missionDepenses: missionDepensesValue,
      depenseTotal: depenseTotalValue,
      depensesPrevues: depensesPrevuesValue,
      montantTotalPrevu: montantTotalPrevuValue,
      categoriesAvecRegles: categoriesAvecReglesValue,
      budgetAlloue: budgetAlloueValue,
      budgetRestant: budgetRestantValue,
      budgetRatio: budgetRatioValue,
      timeline: timelineValue,
      totalAvances: totalAvancesValue,
      couvertParAvance: couvertParAvanceValue,
      depenseAuDelaAvance: depenseAuDelaAvanceValue,
      isOverBudget,
      depassement: depassementValue,
      depenseInBudget: depenseInBudgetValue,
      avanceInBudget: avanceInBudgetValue,
      depenseHorsAvanceInBudget: depenseHorsAvanceInBudgetValue,
      pctAvance: pctAvanceValue,
      pctDepense: pctDepenseValue,
      pctReste: pctResteValue,
      pctDepassement: pctDepassementValue,
      totalForPct: barTotal,
      avanceDemo:
        budgetAlloueValue && budgetAlloueValue > 0
          ? Math.round((budgetAlloueValue * 0.3) / 50) * 50
          : 0,
    };
  }, [mission]);

  if (!mission) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/missions')}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Retour aux missions</span>
        </button>
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-600">
            Mission introuvable.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { label: statusLabel, variant } = statusConfig[mission.statut];

  const start = new Date(mission.dateDebut);
  const end = new Date(mission.dateFin);
  const durationDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate('/missions')}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="underline-offset-2 hover:underline">
              Missions
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600">Détail</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              {mission.titre}
            </h1>
            <Badge variant={variant === 'success' ? 'success' : variant === 'warning' ? 'warning' : variant === 'danger' ? 'danger' : 'neutral'}>
              {statusLabel}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            {mission.destination} •{' '}
            {format(start, 'dd MMM yyyy', { locale: fr })} –{' '}
            {format(end, 'dd MMM yyyy', { locale: fr })} · {durationDays} jour(s)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(mission.statut === 'brouillon' || mission.statut === 'rejetee') && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/missions/${mission.id}/edit`)}
            >
              Modifier
            </Button>
          )}
          {mission.statut === 'remboursee' && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
            >
              Clôturer
            </Button>
          )}
          {/* Ordre de mission : une fois approuvée et avant clôture */}
          {['approuvee', 'en_cours', 'cloture_demandee'].includes(mission.statut) && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="border border-slate-200"
              leftIcon={<Download className="h-3.5 w-3.5 shrink-0" />}
            >
              Ordre de mission
            </Button>
          )}
          {/* Exporter rapport : une fois la mission clôturée (à partir de l'approbation) */}
          {['remboursee', 'cloturee'].includes(mission.statut) && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="border border-slate-200"
              leftIcon={<Download className="h-3.5 w-3.5 shrink-0" />}
            >
              Exporter rapport
            </Button>
          )}
          {/* Demander une avance : une fois la mission approuvée (avant clôture) */}
          {['approuvee', 'en_cours', 'cloture_demandee'].includes(mission.statut) && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<HandCoins className="h-3.5 w-3.5 shrink-0" />}
              onClick={() => { setAvanceModalOpen(true); setAvanceSuccess(false); setAvanceMontant(''); setAvanceMotif(''); }}
            >
              Demander une avance
            </Button>
          )}
        </div>
      </div>

      {/* Infos + Budget */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-100 pb-2">
            <CardTitle className="text-sm">Informations</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-slate-700">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Ordre de mission
                </p>
                <p className="text-slate-900 font-mono text-[11px]">
                  OM-{mission.id.toUpperCase()}
                </p>

                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Destination
                </p>
                <p className="text-slate-900">{mission.destination}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Centre de coût
                </p>
                <p className="text-slate-900">Centre de coût projet (mock)</p>

                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Dates
                </p>
                <p className="text-slate-900">
                  {format(start, 'dd MMM yyyy', { locale: fr })} →{' '}
                  {format(end, 'dd MMM yyyy', { locale: fr })}{' '}
                  <span className="text-xs text-slate-500">
                    ({durationDays} jour(s))
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Description
              </p>
              <p className="mt-1 text-slate-900">
                Mission commerciale à {mission.destination} pour rencontrer les principaux
                clients et partenaires locaux, animer des ateliers avec les équipes sur place
                et préparer le lancement des prochaines initiatives. Cette mission a pour
                objectif de renforcer la relation client, sécuriser les opportunités en cours
                et aligner toutes les parties prenantes sur la stratégie à venir.
              </p>
            </div>

            {/* Participants */}
            {mission.participants && mission.participants.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Participants
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {mission.participants.map((uid) => {
                    const u = mockUsers.find((m) => m.id === uid);
                    if (!u) return null;
                    const isOwner = uid === mission.userId;
                    return (
                      <div
                        key={uid}
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">
                          {u.prenom[0]}{u.nom[0]}
                        </span>
                        <span className="font-medium text-slate-800">{u.prenom} {u.nom}</span>
                        <span className="text-[10px] text-slate-400">{u.departement}</span>
                        {isOwner && (
                          <span className="rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-600">
                            Responsable
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-slate-100 pb-2">
            <CardTitle className="text-sm">Budget</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-4 text-xs text-slate-700">
            {budgetAlloue != null ? (
              <>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-2.5 text-xs">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-blue-700">Budget alloué</span>
                    <span className="font-semibold text-blue-900 tabular-nums">
                      {formatCurrency(budgetAlloue)}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-xs ${isOverBudget ? 'border-rose-200 bg-rose-50/80' : 'border-slate-200 bg-slate-100/80'}`}>
                    <span className={`text-[11px] font-medium uppercase tracking-wide ${isOverBudget ? 'text-rose-700' : 'text-slate-600'}`}>
                      Dépensé {isOverBudget && `(+${formatCurrency(depassement)} hors budget)`}
                    </span>
                    <span className={`font-semibold tabular-nums ${isOverBudget ? 'text-rose-700' : 'text-slate-900'}`}>
                      {formatCurrency(depenseTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-xs">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Avances</span>
                    <span className="font-semibold text-emerald-900 tabular-nums">
                      {totalAvances > 0 ? formatCurrency(totalAvances) : '—'}
                    </span>
                  </div>
                </div>
                {totalForPct > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Consommation du budget
                    </p>
                    <div className="flex h-8 w-full overflow-hidden rounded-lg bg-slate-100">
                      {pctAvance > 0 && (
                        <div
                          className="relative flex shrink-0"
                          style={{ width: `${pctAvance}%` }}
                          title={`Couvert par l'avance : ${formatCurrency(avanceInBudget)}`}
                        >
                          <span className="h-full w-full min-w-[2px] bg-emerald-500" />
                          {pctAvance >= 12 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                              {formatCurrency(avanceInBudget)}
                            </span>
                          )}
                        </div>
                      )}
                      {pctDepense > 0 && (
                        <div
                          className="relative flex shrink-0"
                          style={{ width: `${pctDepense}%` }}
                          title={`Dépensé hors avance : ${formatCurrency(depenseHorsAvanceInBudget)}`}
                        >
                          <span className="h-full w-full min-w-[2px] bg-blue-500" />
                          {pctDepense >= 12 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                              {formatCurrency(depenseHorsAvanceInBudget)}
                            </span>
                          )}
                        </div>
                      )}
                      {pctReste > 0 && (
                        <div
                          className="relative flex shrink-0"
                          style={{ width: `${pctReste}%` }}
                          title={`Reste : ${formatCurrency(budgetRestant)}`}
                        >
                          <span className="h-full w-full min-w-[2px] bg-slate-300" />
                          {pctReste >= 12 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-slate-700">
                              {formatCurrency(budgetRestant)}
                            </span>
                          )}
                        </div>
                      )}
                      {pctDepassement > 0 && (
                        <div
                          className="relative flex shrink-0"
                          style={{ width: `${pctDepassement}%` }}
                          title={`Dépassement : ${formatCurrency(depassement)}`}
                        >
                          <span className="h-full w-full min-w-[2px] bg-rose-500" />
                          {pctDepassement >= 12 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                              {formatCurrency(depassement)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      {pctAvance > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                          Avance {formatCurrency(avanceInBudget)}
                          <span className="text-slate-400">({Math.round(pctAvance)} %)</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-blue-500" />
                        Dépensé {formatCurrency(depenseHorsAvanceInBudget)}
                        {budgetAlloue != null && (
                          <span className="text-slate-400">({Math.round(pctDepense)} %)</span>
                        )}
                      </span>
                      {pctReste > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-sm bg-slate-300" />
                          Reste {formatCurrency(budgetRestant)}
                          <span className="text-slate-400">({Math.round(pctReste)} %)</span>
                        </span>
                      )}
                      {pctDepassement > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-sm bg-rose-500" />
                          Dépassement {formatCurrency(depassement)}
                          <span className="text-slate-400">({Math.round(pctDepassement)} %)</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex flex-col items-start gap-2 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-amber-500" />
                  <span>Budget en attente de validation.</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Le manager devra définir un budget lors de l&apos;approbation de la mission.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Dépenses prévues + Dépenses réelles + Timeline */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Dépenses prévues */}
          <Card>
            <CardHeader className="flex items-center justify-between border-b border-slate-100 pb-2">
              <CardTitle className="text-sm">Dépenses prévues</CardTitle>
              {isBrouillon && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => navigate(`/expenses/new?missionId=${mission.id}&planned=true`)}
                >
                  Ajouter une dépense prévue
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {displayDepensesPrevues.length > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>
                      {displayDepensesPrevues.length} ligne(s) · Total prévu{' '}
                      <span className="font-medium text-slate-900">
                        {formatCurrency(displayMontantTotalPrevu)}
                      </span>
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Montant estimé</TableHead>
                        <TableHead>Mode</TableHead>
                        {isBrouillon && <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayDepensesPrevues.map((p) => (
                        <TableRow
                          key={p.id}
                          className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                          onClick={() => setSelectedPrevue(p)}
                        >
                          <TableCell className="text-xs text-slate-700">
                            {categoriesDepense.find((c) => c.nom === p.categorieId || c.id === p.categorieId)?.nom ?? p.categorieId}
                          </TableCell>
                          <TableCell className="text-xs text-slate-900">{p.description}</TableCell>
                          <TableCell className="text-xs text-slate-900">{formatCurrency(p.montantEstime)}</TableCell>
                          <TableCell className="text-xs text-slate-700 capitalize">{p.modeRemboursement}</TableCell>
                          {isBrouillon && (
                            <TableCell>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemovePrevue(p.id); }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                                aria-label="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-500">Aucune dépense prévue renseignée.</p>
                  {isBrouillon && (
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate(`/expenses/new?missionId=${mission.id}&planned=true`)}
                    >
                      Ajouter une dépense prévue
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal : ajouter une dépense prévue (brouillon) */}
          <Modal
            open={addPrevueOpen}
            title="Ajouter une dépense prévue"
            onClose={() => setAddPrevueOpen(false)}
            footer={
              <>
                <Button type="button" variant="secondary" onClick={() => setAddPrevueOpen(false)}>
                  Annuler
                </Button>
                <Button type="button" onClick={handleAddPrevue}>
                  Ajouter
                </Button>
              </>
            }
          >
            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-medium text-slate-700">Catégorie</label>
                <Select
                  value={prevueForm.categorieId}
                  onChange={(e) => setPrevueForm((f) => ({ ...f, categorieId: e.target.value }))}
                  className="w-full"
                >
                  <option value="">Choisir une catégorie</option>
                  {categoriesDepense.map((c) => (
                    <option key={c.id} value={c.nom}>
                      {c.nom}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Description</label>
                <Input
                  type="text"
                  value={prevueForm.description}
                  onChange={(e) => setPrevueForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ex. Train aller-retour, 2 nuits hôtel…"
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Montant estimé (€)</label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={prevueForm.montantEstime}
                  onChange={(e) => setPrevueForm((f) => ({ ...f, montantEstime: e.target.value }))}
                  placeholder="0"
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Mode de remboursement</label>
                <Select
                  value={prevueForm.modeRemboursement}
                  onChange={(e) => setPrevueForm((f) => ({ ...f, modeRemboursement: e.target.value as ModeRemboursement }))}
                  className="w-full"
                >
                  <option value="reel">Réel</option>
                  <option value="forfait">Forfait</option>
                  <option value="calcule">Calculé</option>
                </Select>
              </div>
            </div>
          </Modal>

          {/* Modal : détail d'une dépense prévue */}
          {selectedPrevue && (() => {
            const catName = categoriesDepense.find((c) => c.nom === selectedPrevue.categorieId || c.id === selectedPrevue.categorieId)?.nom ?? selectedPrevue.categorieId;
            const modeLabel = selectedPrevue.modeRemboursement === 'reel' ? 'Réel' : selectedPrevue.modeRemboursement === 'forfait' ? 'Forfaitaire' : 'Calculé (km)';

            return (
              <Modal
                open={!!selectedPrevue}
                title="Détail de la dépense prévue"
                onClose={() => setSelectedPrevue(null)}
                footer={
                  <>
                    {isBrouillon && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="border border-rose-300 text-rose-700 hover:bg-rose-50"
                          onClick={() => {
                            handleRemovePrevue(selectedPrevue.id);
                            setSelectedPrevue(null);
                          }}
                        >
                          Supprimer
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            navigate(`/expenses/new?missionId=${mission.id}&planned=true`);
                          }}
                        >
                          Modifier
                        </Button>
                      </>
                    )}
                    <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedPrevue(null)}>
                      Fermer
                    </Button>
                  </>
                }
              >
                <div className="space-y-4">
                  {/* Carte style dépense */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 space-y-3">
                    {/* Statut */}
                    <div className="flex items-center justify-between">
                      <Badge variant="neutral" size="sm">Prévue</Badge>
                      <Badge variant="neutral" size="sm">{modeLabel}</Badge>
                    </div>

                    {/* Montant + catégorie */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 border border-blue-200 text-blue-700">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-blue-900">{formatCurrency(selectedPrevue.montantEstime)}</p>
                        <p className="text-xs text-blue-700">{catName}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="rounded-lg bg-white/60 border border-blue-100 px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-blue-500">Description</p>
                      <p className="mt-0.5 text-xs text-blue-900">{selectedPrevue.description || '—'}</p>
                    </div>

                    {/* Infos détaillées */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white/60 border border-blue-100 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-blue-500">Mission</p>
                        <p className="mt-0.5 text-xs font-medium text-blue-900">{mission.titre}</p>
                      </div>
                      <div className="rounded-lg bg-white/60 border border-blue-100 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-blue-500">Destination</p>
                        <p className="mt-0.5 text-xs font-medium text-blue-900">{mission.destination}</p>
                      </div>
                      <div className="rounded-lg bg-white/60 border border-blue-100 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-blue-500">Période mission</p>
                        <p className="mt-0.5 text-xs font-medium text-blue-900">
                          {format(new Date(mission.dateDebut), 'dd MMM', { locale: fr })} – {format(new Date(mission.dateFin), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/60 border border-blue-100 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-blue-500">Mode remboursement</p>
                        <p className="mt-0.5 text-xs font-medium text-blue-900">{modeLabel}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-500">
                    Cette dépense est prévue et n'a pas encore été réalisée. Elle sera convertie en dépense réelle une fois la mission approuvée.
                  </div>
                </div>
              </Modal>
            );
          })()}

          {/* Dépenses réelles — débloquées uniquement après approbation */}
          {(() => {
            const canAddRealExpenses = ['approuvee', 'en_cours', 'cloture_demandee', 'remboursee', 'cloturee'].includes(mission.statut);
            return (
              <Card>
                <CardHeader className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <CardTitle className="text-sm">Dépenses réelles</CardTitle>
                  {canAddRealExpenses ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigate(`/expenses/new?missionId=${mission.id}`)}
                    >
                      Ajouter une dépense
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  {!canAddRealExpenses ? (
                    <div className="relative overflow-hidden rounded-xl min-h-[200px] max-h-[280px]">
                      {/* Table vide en arrière-plan */}
                      <div className="opacity-30 pointer-events-none">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                          <span>Total prévu : {formatCurrency(isBrouillon ? displayMontantTotalPrevu : montantTotalPrevu)}</span>
                          <span>Total réel : —</span>
                          <span>0 dépense(s)</span>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Catégorie</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead>Justificatif</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="text-xs text-slate-400">—</TableCell>
                              <TableCell className="text-xs text-slate-400">—</TableCell>
                              <TableCell className="text-xs text-slate-400">—</TableCell>
                              <TableCell className="text-xs text-slate-400">—</TableCell>
                              <TableCell className="text-xs text-slate-400">—</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      {/* Cadenas centré par-dessus */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-[1px]"
                        aria-hidden
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 border border-slate-200 shadow-sm">
                          <Lock className="h-7 w-7 text-slate-500" />
                        </div>
                        <p className="text-xs font-medium text-slate-600">
                          Débloqué après approbation
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-[220px] text-center">
                          Les dépenses réelles seront disponibles une fois la mission approuvée.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span>
                          Total prévu : <span className="font-medium text-slate-900">{formatCurrency(montantTotalPrevu)}</span>
                        </span>
                        <span>
                          Total réel : <span className="font-medium text-slate-900">{formatCurrency(depenseTotal)}</span>
                        </span>
                        <span>
                          {missionDepenses.length} dépense(s) saisie(s)
                        </span>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Justificatif</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {missionDepenses.map((d) => {
                            const date = new Date(d.date);
                            const cat = categoriesDepense.find((c) => c.nom === d.categorie);
                            const hasFlags = d.flags.length > 0;
                            return (
                              <TableRow key={d.id}>
                                <TableCell className="text-xs text-slate-700">
                                  {format(date, 'dd/MM/yyyy', { locale: fr })}
                                </TableCell>
                                <TableCell className="text-xs text-slate-900">
                                  {d.description}
                                  {hasFlags && (
                                    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                      <AlertTriangle className="h-2.5 w-2.5" />
                                      {getFlagLabel(d.flags[0])}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-slate-700">
                                  {cat?.nom ?? d.categorie}
                                </TableCell>
                                <TableCell className="text-xs text-slate-900">
                                  {formatCurrency(d.montant)}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                                      justificatifColor[d.statutJustificatif]
                                    }`}
                                  >
                                    {d.statutJustificatif === 'valide' && (
                                      <CheckCircle2 className="h-3 w-3" />
                                    )}
                                    {d.statutJustificatif === 'rejete' && (
                                      <XCircle className="h-3 w-3" />
                                    )}
                                    {d.statutJustificatif === 'en_attente' && (
                                      <Clock3 className="h-3 w-3" />
                                    )}
                                    {d.statutJustificatif === 'non_fournis' && (
                                      <FileText className="h-3 w-3" />
                                    )}
                                    <span className="capitalize">
                                      {d.statutJustificatif.replace('_', ' ')}
                                    </span>
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-2 flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Timeline mission</CardTitle>
            {timeline.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            )}
          </CardHeader>
          <CardContent className="pt-3 space-y-3">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 p-0.5 text-[11px] text-slate-600">
              <button
                type="button"
                className={`rounded-full px-2 py-0.5 ${
                  timelineFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
                onClick={() => setTimelineFilter('all')}
              >
                Tous
              </button>
              <button
                type="button"
                className={`rounded-full px-2 py-0.5 ${
                  timelineFilter === 'approvals'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
                onClick={() => setTimelineFilter('approvals')}
              >
                Approbations
              </button>
              <button
                type="button"
                className={`rounded-full px-2 py-0.5 ${
                  timelineFilter === 'expenses'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
                onClick={() => setTimelineFilter('expenses')}
              >
                Dépenses
              </button>
              <button
                type="button"
                className={`rounded-full px-2 py-0.5 ${
                  timelineFilter === 'comments'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
                onClick={() => setTimelineFilter('comments')}
              >
                Commentaires
              </button>
            </div>
            <div className="relative max-h-96 space-y-4 overflow-y-auto pr-2 text-xs text-slate-700">
              {(() => {
                const filtered = timeline.filter((event) => {
                  if (timelineFilter === 'all') return true;
                  if (timelineFilter === 'approvals') return isApprovalEvent(event.type);
                  if (timelineFilter === 'expenses') return isExpenseEvent(event.type);
                  if (timelineFilter === 'comments') return isCommentEvent(event.type);
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <p className="text-[11px] text-slate-500">
                      Aucun événement pour le moment sur cette mission.
                    </p>
                  );
                }

                const now = new Date();
                const hasFuture = filtered.some((e) => e.timestamp > now);
                const lastPastIndex = (() => {
                  let last = -1;
                  filtered.forEach((e, idx) => {
                    if (e.timestamp <= now) last = idx;
                  });
                  return last;
                })();

                let lastDayLabel = '';

                return (
                  <ol className="relative space-y-3">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
                    {filtered.map((event, idx) => {
                      const dayLabel = format(event.timestamp, 'dd MMM yyyy', { locale: fr });
                      const showDayLabel = dayLabel !== lastDayLabel;
                      if (showDayLabel) {
                        lastDayLabel = dayLabel;
                      }

                      let state: EventPointState = 'completed';
                      if (event.type === 'rejected') {
                        state = 'rejected';
                      } else if (event.timestamp > now) {
                        state = 'upcoming';
                      } else if (hasFuture && idx === lastPastIndex) {
                        state = 'current';
                      }

                      const Icon = eventIcon[event.type];

                      const pointClasses =
                        state === 'completed'
                          ? 'border-emerald-500 bg-emerald-50'
                          : state === 'current'
                          ? 'border-sky-500 bg-sky-50'
                          : state === 'upcoming'
                          ? 'border-slate-300 bg-white'
                          : 'border-rose-500 bg-rose-50';

                      const lineClasses =
                        state === 'upcoming' ? 'border-dashed border-slate-300' : 'border-slate-200';

                      const timeLabel = (() => {
                        if (isToday(event.timestamp)) {
                          return `Aujourd'hui · ${format(event.timestamp, 'HH:mm', { locale: fr })}`;
                        }
                        if (isYesterday(event.timestamp)) {
                          return `Hier · ${format(event.timestamp, 'HH:mm', { locale: fr })}`;
                        }
                        return format(event.timestamp, "dd MMM yyyy '·' HH:mm", { locale: fr });
                      })();

                      const relativeLabel = formatDistanceToNow(event.timestamp, {
                        locale: fr,
                        addSuffix: true,
                      });

                      return (
                        <li key={event.id}>
                          {showDayLabel && (
                            <p className="mb-1 pl-7 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              {dayLabel}
                            </p>
                          )}
                          <div
                            className="group relative flex gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                            onClick={() =>
                              setExpandedEventId((prev) =>
                                prev === event.id ? null : event.id,
                              )
                            }
                          >
                            <div className="relative flex flex-col items-center">
                              <span
                                className={`flex h-3 w-3 items-center justify-center rounded-full border-2 ${pointClasses}`}
                              />
                              {idx < filtered.length - 1 && (
                                <span
                                  className={`mt-1 flex-1 border-l ${lineClasses}`}
                                />
                              )}
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                                  <p className="text-[11px] text-slate-500">
                                    {timeLabel}{' '}
                                    <span className="ml-1 text-[10px] text-slate-400">
                                      ({relativeLabel})
                                    </span>
                                  </p>
                                </div>
                                <span className="text-[11px] text-slate-400">
                                  {state === 'completed'
                                    ? '✓'
                                    : state === 'current'
                                    ? '◐'
                                    : state === 'upcoming'
                                    ? '○'
                                    : '✗'}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-900">
                                {(() => {
                                  switch (event.type) {
                                    case 'created':
                                      return 'Mission créée';
                                    case 'submitted':
                                      return 'Soumise pour validation';
                                    case 'approved':
                                      return 'Mission approuvée';
                                    case 'rejected':
                                      return 'Mission rejetée';
                                    case 'info_requested':
                                      return 'Informations complémentaires demandées';
                                    case 'info_provided':
                                      return 'Informations complémentaires fournies';
                                    case 'budget_modified':
                                      return 'Budget modifié';
                                    case 'expense_added':
                                      return 'Dépense ajoutée';
                                    case 'expense_removed':
                                      return 'Dépense supprimée';
                                    case 'closure_requested':
                                      return 'Clôture demandée';
                                    case 'closure_approved':
                                      return 'Clôture validée';
                                    case 'reimbursement_sent':
                                      return 'Remboursement envoyé';
                                    case 'advance_requested':
                                      return "Demande d'avance";
                                    case 'advance_approved':
                                      return "Avance approuvée";
                                    case 'advance_paid':
                                      return "Avance payée";
                                    case 'completed':
                                      return 'Mission complétée';
                                    case 'closed':
                                      return 'Mission clôturée';
                                    case 'comment':
                                      return 'Commentaire';
                                  }
                                })()}
                              </p>
                              <p className="text-[11px] text-slate-600">
                                {event.actor.name}{' '}
                                <span className="text-slate-400">
                                  ({event.actor.role})
                                </span>
                              </p>
                              {expandedEventId === event.id && (
                                <div className="space-y-0.5 pt-1 text-[11px] text-slate-600">
                                  {event.data?.amount != null && (
                                    <p>
                                      <span className="font-semibold">
                                        Montant :{' '}
                                      </span>
                                      <span className="font-semibold">
                                        {formatCurrency(event.data.amount)}
                                      </span>
                                    </p>
                                  )}
                                  {event.data?.expenseDescription && (
                                    <p>
                                      <span className="font-semibold">Dépense : </span>
                                      {event.data.expenseDescription}
                                    </p>
                                  )}
                                  {event.data?.comment && (
                                    <p className="italic text-slate-500">
                                      “{event.data.comment}”
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Modal : Demander une avance ─────────────────────────────────── */}
      <Modal
        open={avanceModalOpen}
        title={avanceSuccess ? "Demande d'avance envoyée" : "Demander une avance"}
        onClose={() => setAvanceModalOpen(false)}
        footer={
          avanceSuccess ? (
            <Button type="button" size="sm" onClick={() => setAvanceModalOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" size="sm" onClick={() => setAvanceModalOpen(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!avanceMontant.trim() || Number(avanceMontant) <= 0 || !avanceMotif.trim()}
                onClick={() => setAvanceSuccess(true)}
              >
                Envoyer la demande
              </Button>
            </>
          )
        }
      >
        {avanceSuccess ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Votre demande a été envoyée</p>
            <p className="text-xs text-slate-500">
              Demande de {formatCurrency(Number(avanceMontant))} pour la mission <span className="font-medium">{mission.titre}</span>.
              Votre manager sera notifié pour approbation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Recap mission */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
              <div className="flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-slate-500" />
                <span className="font-medium text-slate-900">{mission.titre}</span>
              </div>
              <p className="mt-1 text-slate-500">
                {mission.destination} · {format(new Date(mission.dateDebut), 'dd MMM', { locale: fr })} – {format(new Date(mission.dateFin), 'dd MMM yyyy', { locale: fr })}
              </p>
              {budgetAlloue != null && (
                <div className="mt-2 flex items-center gap-4 text-slate-600">
                  <span>Budget : <span className="font-medium text-slate-900">{formatCurrency(budgetAlloue)}</span></span>
                  {totalAvances > 0 && (
                    <span>Avances existantes : <span className="font-medium text-slate-900">{formatCurrency(totalAvances)}</span></span>
                  )}
                </div>
              )}
            </div>

            {/* Montant */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Montant demandé (EUR)</label>
              <Input
                type="number"
                min={1}
                step={1}
                value={avanceMontant}
                onChange={(e) => setAvanceMontant(e.target.value)}
                placeholder="0"
              />
              {budgetAlloue != null && budgetAlloue > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {[0.2, 0.3, 0.5].map((pct) => {
                    const val = Math.round((budgetAlloue * pct) / 10) * 10;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setAvanceMontant(String(val))}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 hover:border-primary-300"
                      >
                        {Math.round(pct * 100)}% · {formatCurrency(val)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Motif */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Motif de la demande</label>
              <textarea
                rows={3}
                value={avanceMotif}
                onChange={(e) => setAvanceMotif(e.target.value)}
                placeholder="Ex. Couvrir les frais d'hébergement et de restauration sur place..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MissionDetail;

