import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInCalendarDays, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { FC as IconFC } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  XCircle,
  FileText,
  Send,
  HelpCircle,
  MessageCircle,
  Wallet,
  Receipt,
  Trash2,
  SendHorizontal,
  CheckCheck,
  Banknote,
  HandCoins,
  BadgeCheck,
  Flag,
  Lock,
  MessageSquare,
  Sparkles,
  Train,
  Plane,
  Hotel,
  Utensils,
  Car,
} from 'lucide-react';
import {
  demandesApprobation,
  mockUsers,
  missions,
  depenses,
  categoriesDepense,
  modeRemboursementLabel,
  getFlagLabel,
  type DemandeApprobation,
  type Mission,
  type Depense,
  type DepensePrevueMission,
  type MissionEventType,
} from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

const justificatifColor: Record<Depense['statutJustificatif'], string> = {
  non_fournis: 'bg-amber-50 text-amber-700 border-amber-100',
  en_attente: 'bg-sky-50 text-sky-700 border-sky-100',
  valide: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejete: 'bg-rose-50 text-rose-700 border-rose-100',
};

const categorieIconMap: Record<string, IconFC<{ className?: string }>> = {
  Train,
  Plane,
  Hotel,
  Utensils,
  Car,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const eventIcon: Record<MissionEventType, IconFC<{ className?: string }>> = {
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

const eventLabel: Record<MissionEventType, string> = {
  created: 'Mission créée',
  submitted: 'Soumise pour validation',
  approved: 'Mission approuvée',
  rejected: 'Mission rejetée',
  info_requested: 'Informations complémentaires demandées',
  info_provided: 'Informations complémentaires fournies',
  budget_modified: 'Budget modifié',
  expense_added: 'Dépense ajoutée',
  expense_removed: 'Dépense supprimée',
  closure_requested: 'Clôture demandée',
  closure_approved: 'Clôture validée',
  reimbursement_sent: 'Remboursement envoyé',
  advance_requested: "Demande d'avance",
  advance_approved: 'Avance approuvée',
  advance_paid: 'Avance payée',
  completed: 'Mission complétée',
  closed: 'Mission clôturée',
  comment: 'Commentaire',
};

const statutDemandeLabel: Record<DemandeApprobation['statut'], string> = {
  en_attente: 'En attente',
  approuvee: 'Approuvée',
  rejete: 'Rejetée',
};

const statutDemandeVariant: Record<DemandeApprobation['statut'], 'success' | 'warning' | 'danger' | 'default'> = {
  en_attente: 'warning',
  approuvee: 'success',
  rejete: 'danger',
};

const typeLabel: Record<DemandeApprobation['type'], string> = {
  mission: 'Mission',
  avance: 'Avance',
  depense: 'Dépense',
};

const posteEtDepartementLabel: Record<'Commercial' | 'Marketing' | 'Finance' | 'RH' | 'Ops' | 'Tech', string> = {
  Commercial: 'Commercial - Département Ventes et Communication',
  Marketing: 'Marketing - Département Marketing et Communication',
  Finance: 'Finance - Département Finance',
  RH: 'RH - Département Ressources humaines',
  Ops: 'Ops - Département Opérations',
  Tech: 'Tech - Département Technique',
};

const ApprovalDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [budgetAlloue, setBudgetAlloue] = useState<string>('');
  const [avanceOctroyee, setAvanceOctroyee] = useState<string>('');
  const [approveAttemptedWithoutFields, setApproveAttemptedWithoutFields] = useState(false);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [justificatifModalOpen, setJustificatifModalOpen] = useState(false);
  const [otherExpensesExpanded, setOtherExpensesExpanded] = useState(false);
  /** Quand on ouvre un modal depuis une "autre" carte dépense, on stocke son id pour afficher les bonnes données. */
  const [modalContextDemandeId, setModalContextDemandeId] = useState<string | null>(null);
  /** Demandes traitées (approuvées/rejetées) depuis cette page pour les retirer de la liste "autres dépenses". */
  const [processedDemandeIds, setProcessedDemandeIds] = useState<string[]>([]);

  const { demande, user, mission, depense: demandeDepense, isUrgent } = useMemo(() => {
    const d = demandesApprobation.find((x) => x.id === id);
    if (!d) {
      return { demande: null, user: null, mission: null, demandeDepense: null, isUrgent: false };
    }
    const u = mockUsers.find((x) => x.id === d.demandeurId) ?? null;
    const m = d.type === 'mission' ? missions.find((x) => x.id === d.entityId) ?? null : null;
    const dep = d.type === 'depense' ? depenses.find((x) => x.id === d.entityId) ?? null : null;
    const createdAt = new Date(d.dateCreation);
    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const urgent = ageHours > 48 && d.statut === 'en_attente';
    return { demande: d, user: u, mission: m, depense: dep, isUrgent: urgent };
  }, [id]);

  const demandeurMissionsCount = useMemo(() => {
    if (!demande) return 0;
    return missions.filter((m) => m.userId === demande.demandeurId).length;
  }, [demande]);

  const demandeurDepensesThisMonth = useMemo(() => {
    if (!demande) return 0;
    const now = new Date();
    return depenses.filter(
      (d) => d.userId === demande.demandeurId && new Date(d.date).getMonth() === now.getMonth()
    ).length;
  }, [demande]);

  const canApproveMission =
    demande?.type !== 'mission' ||
    (budgetAlloue.trim() !== '' &&
      avanceOctroyee.trim() !== '' &&
      Number(budgetAlloue) > 0 &&
      !Number.isNaN(Number(avanceOctroyee)) &&
      Number(avanceOctroyee) >= 0);

  const canApproveAdvance =
    demande?.type !== 'avance' ||
    (avanceOctroyee.trim() !== '' &&
      !Number.isNaN(Number(avanceOctroyee)) &&
      Number(avanceOctroyee) >= 0);

  /** Autres demandes d'approbation dépense en attente (hors la demande courante et celles déjà traitées). */
  const otherPendingDepenseDemandes = useMemo(() => {
    if (!demande || demande.type !== 'depense') return [];
    return demandesApprobation.filter(
      (d) =>
        d.type === 'depense' &&
        d.statut === 'en_attente' &&
        d.id !== demande.id &&
        !processedDemandeIds.includes(d.id)
    );
  }, [demande, processedDemandeIds]);

  /** Demande et dépense utilisées dans les modales (carte courante ou "autre" carte selon modalContextDemandeId). */
  const displayDemandeId = modalContextDemandeId ?? id ?? '';
  const displayDemandeForModal = useMemo(
    () => demandesApprobation.find((d) => d.id === displayDemandeId) ?? null,
    [displayDemandeId]
  );
  const displayDepenseForModal = useMemo(
    () =>
      displayDemandeForModal?.type === 'depense'
        ? depenses.find((d) => d.id === displayDemandeForModal.entityId) ?? null
        : null,
    [displayDemandeForModal]
  );

  /** Mission liée à la dépense (pour approbation dépense). */
  const missionDepense = useMemo(() => {
    if (demande?.type !== 'depense' || !demandeDepense?.missionId) return null;
    return missions.find((m) => m.id === demandeDepense.missionId) ?? null;
  }, [demande?.type, demandeDepense?.missionId]);

  const missionDetailData = useMemo(() => {
    if (!mission) return null;
    const missionDepensesValue = depenses.filter((d) => d.missionId === mission.id);
    const depenseTotalValue = missionDepensesValue.reduce((sum, d) => sum + d.montant, 0);
    const depensesPrevuesValue = mission.depensesPrevues ?? [];
    const montantTotalPrevuValue = depensesPrevuesValue.reduce((s, p) => s + p.montantEstime, 0);
    const budgetAlloueValue = mission.budgetAlloue;
    const budgetRestantValue =
      budgetAlloueValue != null ? Math.max(budgetAlloueValue - depenseTotalValue, 0) : 0;
    const budgetRatioValue =
      budgetAlloueValue && budgetAlloueValue > 0
        ? Math.min(depenseTotalValue / budgetAlloueValue, 1)
        : 0;
    const totalAvancesValue = (mission.events ?? [])
      .filter((e) => e.type === 'advance_paid')
      .reduce((s, e) => s + ((e.data as { amount?: number })?.amount ?? 0), 0);
    const couvertParAvanceValue = Math.min(depenseTotalValue, totalAvancesValue);
    const depenseAuDelaAvanceValue = Math.max(0, depenseTotalValue - totalAvancesValue);
    const totalForPct = budgetAlloueValue ?? depenseTotalValue + budgetRestantValue;
    const pctCouvertValue = totalForPct > 0 ? (couvertParAvanceValue / totalForPct) * 100 : 0;
    const pctAuDelaValue = totalForPct > 0 ? (depenseAuDelaAvanceValue / totalForPct) * 100 : 0;
    const pctResteValue = totalForPct > 0 ? (budgetRestantValue / totalForPct) * 100 : 0;
    const categoriesMap = new Map<string, number>();
    missionDepensesValue.forEach((d) => {
      categoriesMap.set(d.categorie, (categoriesMap.get(d.categorie) ?? 0) + d.montant);
    });
    const donutDataValue = Array.from(categoriesMap.entries()).map(([name, value]) => ({ name, value }));
    const avanceDemo =
      budgetAlloueValue && budgetAlloueValue > 0
        ? Math.round((budgetAlloueValue * 0.3) / 50) * 50
        : 0;
    return {
      missionDepenses: missionDepensesValue,
      depenseTotal: depenseTotalValue,
      depensesPrevues: depensesPrevuesValue,
      montantTotalPrevu: montantTotalPrevuValue,
      budgetAlloue: budgetAlloueValue,
      budgetRestant: budgetRestantValue,
      budgetRatio: budgetRatioValue,
      donutData: donutDataValue,
      avanceDemo,
      totalAvances: totalAvancesValue,
      couvertParAvance: couvertParAvanceValue,
      depenseAuDelaAvance: depenseAuDelaAvanceValue,
      totalForPct: totalForPct,
      pctCouvert: pctCouvertValue,
      pctAuDela: pctAuDelaValue,
      pctReste: pctResteValue,
    };
  }, [mission]);

  /** Timeline de la mission liée à la dépense (pour approbation dépense). */
  const missionTimelineDepense = useMemo(() => {
    if (!missionDepense?.events?.length) return [];
    return missionDepense.events
      .map((e) => ({ ...e, timestamp: new Date(e.timestamp) }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [missionDepense?.events]);

  /** Données budget + tableaux de la mission liée à la dépense (pour approbation dépense). */
  const missionDetailDataDepense = useMemo(() => {
    if (!missionDepense) return null;
    const m = missionDepense;
    const missionDepensesValue = depenses.filter((d) => d.missionId === m.id);
    const depenseTotalValue = missionDepensesValue.reduce((sum, d) => sum + d.montant, 0);
    const depensesPrevuesValue = m.depensesPrevues ?? [];
    const montantTotalPrevuValue = depensesPrevuesValue.reduce((s, p) => s + p.montantEstime, 0);
    const budgetAlloueValue = m.budgetAlloue;
    const budgetRestantValue =
      budgetAlloueValue != null ? Math.max(budgetAlloueValue - depenseTotalValue, 0) : 0;
    const totalAvancesValue = (m.events ?? [])
      .filter((e) => e.type === 'advance_paid')
      .reduce((s, e) => s + ((e.data as { amount?: number })?.amount ?? 0), 0);
    const couvertParAvanceValue = Math.min(depenseTotalValue, totalAvancesValue);
    const depenseAuDelaAvanceValue = Math.max(0, depenseTotalValue - totalAvancesValue);
    const totalForPct = budgetAlloueValue ?? depenseTotalValue + budgetRestantValue;
    const pctCouvertValue = totalForPct > 0 ? (couvertParAvanceValue / totalForPct) * 100 : 0;
    const pctAuDelaValue = totalForPct > 0 ? (depenseAuDelaAvanceValue / totalForPct) * 100 : 0;
    const pctResteValue = totalForPct > 0 ? (budgetRestantValue / totalForPct) * 100 : 0;
    return {
      missionDepenses: missionDepensesValue,
      depensesPrevues: depensesPrevuesValue,
      montantTotalPrevu: montantTotalPrevuValue,
      budgetAlloue: budgetAlloueValue,
      depenseTotal: depenseTotalValue,
      budgetRestant: budgetRestantValue,
      totalAvances: totalAvancesValue,
      couvertParAvance: couvertParAvanceValue,
      depenseAuDelaAvance: depenseAuDelaAvanceValue,
      totalForPct: totalForPct,
      pctCouvert: pctCouvertValue,
      pctAuDela: pctAuDelaValue,
      pctReste: pctResteValue,
    };
  }, [missionDepense]);

  const missionTimeline = useMemo(() => {
    if (!mission?.events?.length) return [];
    return mission.events
      .map((e) => ({ ...e, timestamp: new Date(e.timestamp) }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [mission?.events]);

  /** Pour une demande d'avance, mission associée (entityId = id de la mission). */
  const missionAssocieeAvance = useMemo(() => {
    if (!demande || demande.type !== 'avance') return null;
    return missions.find((m) => m.id === demande.entityId) ?? null;
  }, [demande]);

  /** Données mission pour approbation avance (mission associée). */
  const missionDetailDataAvance = useMemo(() => {
    if (!missionAssocieeAvance) return null;
    const m = missionAssocieeAvance;
    const missionDepensesValue = depenses.filter((d) => d.missionId === m.id);
    const depenseTotalValue = missionDepensesValue.reduce((sum, d) => sum + d.montant, 0);
    const depensesPrevuesValue = m.depensesPrevues ?? [];
    const montantTotalPrevuValue = depensesPrevuesValue.reduce((s, p) => s + p.montantEstime, 0);
    const budgetAlloueValue = m.budgetAlloue;
    const avanceDemo = 500; // Montant de l'avance demandée
    return {
      missionDepenses: missionDepensesValue,
      depenseTotal: depenseTotalValue,
      depensesPrevues: depensesPrevuesValue,
      montantTotalPrevu: montantTotalPrevuValue,
      budgetAlloue: budgetAlloueValue,
      avanceDemo,
    };
  }, [missionAssocieeAvance]);

  const missionTimelineAvance = useMemo(() => {
    if (!missionAssocieeAvance?.events?.length) return [];
    return missionAssocieeAvance.events
      .map((e) => ({ ...e, timestamp: new Date(e.timestamp) }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [missionAssocieeAvance?.events]);

  /** Historique des avances déjà octroyées sur cette mission (événements advance_paid). */
  const avancesOctroyeesMission = useMemo(() => {
    if (!missionAssocieeAvance?.events?.length) return [];
    return missionAssocieeAvance.events
      .filter((e) => e.type === 'advance_paid')
      .map((e) => ({
        date: e.timestamp,
        amount: (e.data as { amount?: number } | undefined)?.amount ?? 0,
        statut: 'Payée' as const,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [missionAssocieeAvance?.events]);

  /** Récap budget / dépensé / avance pour la mission (demande d'avance). */
  const recapAvanceMission = useMemo(() => {
    if (!missionAssocieeAvance || !missionDetailDataAvance) return null;
    const budgetAlloue = missionAssocieeAvance.budgetAlloue ?? 0;
    const depenseTotal = missionDetailDataAvance.depenseTotal;
    const totalAvances = avancesOctroyeesMission.reduce((s, a) => s + a.amount, 0);
    const reste = Math.max(0, budgetAlloue - depenseTotal);
    const couvertParAvance = Math.min(depenseTotal, totalAvances);
    const depenseAuDelaAvance = Math.max(0, depenseTotal - totalAvances);
    const total = budgetAlloue || depenseTotal + reste;
    const pctCouvert = total > 0 ? (couvertParAvance / total) * 100 : 0;
    const pctAuDela = total > 0 ? (depenseAuDelaAvance / total) * 100 : 0;
    const pctReste = total > 0 ? (reste / total) * 100 : 0;
    return {
      budgetAlloue,
      depenseTotal,
      totalAvances,
      reste,
      couvertParAvance,
      depenseAuDelaAvance,
      total,
      pctCouvert,
      pctAuDela,
      pctReste,
    };
  }, [missionAssocieeAvance, missionDetailDataAvance, avancesOctroyeesMission]);

  if (!demande) {
    return (
      <div className="space-y-4">
        <Link
          to="/approvals"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour à la file
        </Link>
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-600">
            Demande introuvable.
          </CardContent>
        </Card>
      </div>
    );
  }

  const reference =
    demande.type === 'mission'
      ? mission?.titre ?? demande.entityId
      : demande.type === 'depense'
      ? demandeDepense
        ? `${demandeDepense.categorie} – ${demandeDepense.description}`
        : demande.entityId
      : missionAssocieeAvance && missionDetailDataAvance
      ? `${missionAssocieeAvance.titre} · ${formatCurrency(missionDetailDataAvance.avanceDemo)}`
      : `Avance ${demande.entityId}`;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Link
            to="/approvals"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-3 w-3" />
            Retour à la file
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{typeLabel[demande.type]}</Badge>
            <span className="text-sm font-medium text-slate-900">{reference}</span>
            <Badge variant={statutDemandeVariant[demande.statut]}>
              {statutDemandeLabel[demande.statut]}
            </Badge>
            {isUrgent && (
              <Badge variant="danger" className="inline-flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Urgent
              </Badge>
            )}
          </div>
          <p className="text-xs leading-tight text-slate-500">
            Soumise le {format(new Date(demande.dateCreation), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
            <br />
            <span className="text-[11px]">{formatDistanceToNow(new Date(demande.dateCreation), { addSuffix: true, locale: fr })}</span>
          </p>
        </div>

        {/* Section Demandeur */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demandeur</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Avatar
              name={user ? `${user.prenom} ${user.nom}` : 'Inconnu'}
              id={demande.demandeurId}
              size="lg"
            />
            <div className="space-y-1">
              <p className="font-medium text-slate-900">
                {user ? `${user.prenom} ${user.nom}` : 'Collaborateur'}
              </p>
              {user && (
                <p className="text-xs text-slate-500">
                  {posteEtDepartementLabel[user.departement]}
                </p>
              )}
              <p className="text-[11px] text-slate-500">
                {demandeurDepensesThisMonth} dépenses ce mois
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Avance demandée : bloc très visible pour les demandes d'avance */}
        {demande.type === 'avance' && missionAssocieeAvance && missionDetailDataAvance && (
          <Card className="border-2 border-emerald-200 bg-emerald-50/90 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200">
                    <Banknote className="h-7 w-7 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Montant de l'avance demandée
                    </p>
                    <p className="mt-0.5 text-2xl font-bold text-emerald-900 tabular-nums">
                      {formatCurrency(missionDetailDataAvance.avanceDemo)}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Mission : <span className="font-medium text-slate-900">{missionAssocieeAvance.titre}</span>
                    </p>
                  </div>
                </div>
                <div className="sm:text-right max-w-[280px]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Motif / Raison de la demande</p>
                  <p className="mt-1 text-xs text-slate-700">
                    {demande.commentaire ?? '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historique des avances octroyées sur cette mission (juste après le bloc Avance demandée) */}
        {demande.type === 'avance' && missionAssocieeAvance && (
          <Card>
            <CardHeader className="border-b border-slate-100 pb-2">
              <CardTitle className="text-sm">Historique des avances octroyées sur cette mission</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {avancesOctroyeesMission.length === 0 ? (
                <p className="text-xs text-slate-500">Aucune avance octroyée sur cette mission pour le moment.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date versement</TableHead>
                      <TableHead className="text-xs">Montant</TableHead>
                      <TableHead className="text-xs">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avancesOctroyeesMission.map((a, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs text-slate-700">
                          {format(new Date(a.date), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-900">{formatCurrency(a.amount)}</TableCell>
                        <TableCell className="text-xs">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {a.statut}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section Contenu : détail complet pour mission, résumé pour le reste */}
        {demande.type === 'mission' && mission && missionDetailData && (
          <>
            {/* Informations mission */}
            <Card>
              <CardHeader className="border-b border-slate-100 pb-2">
                <CardTitle className="text-sm">Informations mission</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs text-slate-700">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ordre de mission</p>
                    <p className="text-slate-900">{mission.titre}</p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Destination</p>
                    <p className="text-slate-900">{mission.destination}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Projet associé</p>
                    <p className="text-slate-900">{mission.projetAssocie ?? '—'}</p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dates</p>
                    <p className="text-slate-900">
                      {format(new Date(mission.dateDebut), 'dd MMM yyyy', { locale: fr })} –{' '}
                      {format(new Date(mission.dateFin), 'dd MMM yyyy', { locale: fr })}{' '}
                      <span className="text-slate-500">
                        ({differenceInCalendarDays(new Date(mission.dateFin), new Date(mission.dateDebut)) + 1} jour(s))
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</p>
                  <p className="mt-1 text-slate-900">
                    Mission commerciale à {mission.destination} pour rencontrer les principaux clients et partenaires locaux,
                    animer des ateliers avec les équipes sur place et préparer le lancement des prochaines initiatives.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dépenses prévues + Avance demandée */}
            <Card>
              <CardHeader className="border-b border-slate-100 pb-2">
                <CardTitle className="text-sm">Dépenses prévues</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-4">
                {/* Avance demandée */}
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-xs">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Avance demandée</span>
                  {missionDetailData.budgetAlloue != null && missionDetailData.avanceDemo > 0 ? (
                    <span className="font-semibold text-slate-900">{formatCurrency(missionDetailData.avanceDemo)}</span>
                  ) : (
                    <span className="text-slate-500">À définir lors de l&apos;approbation</span>
                  )}
                </div>

                {/* Liste des dépenses prévues */}
                {missionDetailData.depensesPrevues.length > 0 ? (
                  <>
                    <div className="text-xs text-slate-600">
                      {missionDetailData.depensesPrevues.length} ligne(s) · Total prévu{' '}
                      <span className="font-medium text-slate-900">{formatCurrency(missionDetailData.montantTotalPrevu)}</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Catégorie</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Montant estimé</TableHead>
                          <TableHead>Mode</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {missionDetailData.depensesPrevues.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs text-slate-700">
                              {categoriesDepense.find((c) => c.nom === p.categorieId || c.id === p.categorieId)?.nom ?? p.categorieId}
                            </TableCell>
                            <TableCell className="text-xs text-slate-900">{p.description}</TableCell>
                            <TableCell className="text-xs text-slate-900">{formatCurrency(p.montantEstime)}</TableCell>
                            <TableCell className="text-xs text-slate-700">{modeRemboursementLabel[p.modeRemboursement]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">Aucune dépense prévue renseignée.</p>
                )}
              </CardContent>
            </Card>

            {/* Dépenses réelles — style bloqué quand demande en attente, données réelles après approbation */}
            <Card>
              <CardHeader className="border-b border-slate-100 pb-2">
                <CardTitle className="text-sm">Dépenses réelles</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                {demande.statut === 'en_attente' ? (
                  <div className="relative overflow-hidden rounded-xl min-h-[200px] max-h-[280px]">
                    <div className="opacity-30 pointer-events-none">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                        <span>Total prévu : {formatCurrency(missionDetailData.montantTotalPrevu)}</span>
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
                      <span>Total prévu : <span className="font-medium text-slate-900">{formatCurrency(missionDetailData.montantTotalPrevu)}</span></span>
                      <span>Total réel : <span className="font-medium text-slate-900">{formatCurrency(missionDetailData.depenseTotal)}</span></span>
                      <span>{missionDetailData.missionDepenses.length} dépense(s) saisie(s)</span>
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
                        {missionDetailData.missionDepenses.map((d) => {
                          const date = new Date(d.date);
                          const cat = categoriesDepense.find((c) => c.nom === d.categorie);
                          const hasFlags = d.flags.length > 0;
                          return (
                            <TableRow key={d.id}>
                              <TableCell className="text-xs text-slate-700">{format(date, 'dd/MM/yyyy', { locale: fr })}</TableCell>
                              <TableCell className="text-xs text-slate-900">
                                {d.description}
                                {hasFlags && (
                                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    {getFlagLabel(d.flags[0])}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-slate-700">{cat?.nom ?? d.categorie}</TableCell>
                              <TableCell className="text-xs text-slate-900">{formatCurrency(d.montant)}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${justificatifColor[d.statutJustificatif]}`}>
                                  {d.statutJustificatif === 'valide' && <CheckCircle2 className="h-3 w-3" />}
                                  {d.statutJustificatif === 'rejete' && <XCircle className="h-3 w-3" />}
                                  {d.statutJustificatif === 'en_attente' && <Clock3 className="h-3 w-3" />}
                                  {d.statutJustificatif === 'non_fournis' && <FileText className="h-3 w-3" />}
                                  <span className="capitalize">{d.statutJustificatif.replace('_', ' ')}</span>
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {missionDetailData.missionDepenses.length === 0 && (
                      <p className="text-xs text-slate-500">Aucune dépense réelle saisie.</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeline mission */}
            <Card>
              <CardHeader className="border-b border-slate-100 pb-2">
                <CardTitle className="text-sm">Timeline mission</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                {missionTimeline.length === 0 ? (
                  <p className="text-[11px] text-slate-500">Aucun événement pour le moment sur cette mission.</p>
                ) : (
                  <ol className="relative space-y-3 max-h-80 overflow-y-auto pr-2">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
                    {missionTimeline.map((event, idx) => {
                      const Icon = eventIcon[event.type];
                      const timeLabel = isToday(event.timestamp)
                        ? `Aujourd'hui · ${format(event.timestamp, 'HH:mm', { locale: fr })}`
                        : isYesterday(event.timestamp)
                        ? `Hier · ${format(event.timestamp, 'HH:mm', { locale: fr })}`
                        : format(event.timestamp, "dd MMM yyyy '·' HH:mm", { locale: fr });
                      const relativeLabel = formatDistanceToNow(event.timestamp, {
                        locale: fr,
                        addSuffix: true,
                      });
                      return (
                        <li key={event.id} className="relative flex gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50/80">
                          <div className="relative flex flex-col items-center">
                            <span className="flex h-3 w-3 shrink-0 rounded-full border-2 border-emerald-500 bg-emerald-50" />
                            {idx < missionTimeline.length - 1 && (
                              <span className="mt-1 flex-1 border-l border-slate-200" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5 pb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                              <p className="text-[11px] text-slate-500">
                                {timeLabel}
                                <span className="ml-1 text-[10px] text-slate-400">({relativeLabel})</span>
                              </p>
                            </div>
                            <p className="text-xs font-medium text-slate-900">{eventLabel[event.type]}</p>
                            <p className="text-[11px] text-slate-600">
                              {event.actor.name}{' '}
                              <span className="text-slate-400">({event.actor.role})</span>
                            </p>
                            {event.data?.comment && (
                              <p className="text-[11px] italic text-slate-500">&quot;{event.data.comment}&quot;</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Avance : même layout que mission (infos mission + dépenses prévues + dépenses réelles bloquées + timeline) + historique avances */}
        {demande.type === 'avance' && missionAssocieeAvance && missionDetailDataAvance && (
          <>
            {/* Informations mission */}
            <Card>
              <CardHeader className="border-b border-slate-100 pb-2">
                <CardTitle className="text-sm">Informations mission</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs text-slate-700">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ordre de mission</p>
                    <p className="text-slate-900">{missionAssocieeAvance.titre}</p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Destination</p>
                    <p className="text-slate-900">{missionAssocieeAvance.destination}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Projet associé</p>
                    <p className="text-slate-900">{missionAssocieeAvance.projetAssocie ?? '—'}</p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dates</p>
                    <p className="text-slate-900">
                      {format(new Date(missionAssocieeAvance.dateDebut), 'dd MMM yyyy', { locale: fr })} –{' '}
                      {format(new Date(missionAssocieeAvance.dateFin), 'dd MMM yyyy', { locale: fr })}{' '}
                      <span className="text-slate-500">
                        ({differenceInCalendarDays(new Date(missionAssocieeAvance.dateFin), new Date(missionAssocieeAvance.dateDebut)) + 1} jour(s))
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</p>
                  <p className="mt-1 text-slate-900">
                    Mission commerciale à {missionAssocieeAvance.destination} pour rencontrer les principaux clients et partenaires locaux,
                    animer des ateliers avec les équipes sur place et préparer le lancement des prochaines initiatives.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dépenses prévues */}
            <Card>
              <CardHeader className="border-b border-slate-100 pb-2">
                <CardTitle className="text-sm">Dépenses prévues (mission)</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-4">
                {missionDetailDataAvance.depensesPrevues.length > 0 ? (
                  <>
                    <div className="text-xs text-slate-600">
                      {missionDetailDataAvance.depensesPrevues.length} ligne(s) · Total prévu{' '}
                      <span className="font-medium text-slate-900">{formatCurrency(missionDetailDataAvance.montantTotalPrevu)}</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Catégorie</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Montant estimé</TableHead>
                          <TableHead>Mode</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {missionDetailDataAvance.depensesPrevues.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs text-slate-700">
                              {categoriesDepense.find((c) => c.nom === p.categorieId || c.id === p.categorieId)?.nom ?? p.categorieId}
                            </TableCell>
                            <TableCell className="text-xs text-slate-900">{p.description}</TableCell>
                            <TableCell className="text-xs text-slate-900">{formatCurrency(p.montantEstime)}</TableCell>
                            <TableCell className="text-xs text-slate-700">{modeRemboursementLabel[p.modeRemboursement]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">Aucune dépense prévue renseignée.</p>
                )}
              </CardContent>
            </Card>

            {/* Dépenses réelles — bloqué (avance = mission pas encore clôturée) */}
            <Card>
              <CardHeader className="border-b border-slate-100 pb-2">
                <CardTitle className="text-sm">Dépenses réelles</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div className="relative overflow-hidden rounded-xl min-h-[200px] max-h-[280px]">
                  <div className="opacity-30 pointer-events-none">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                      <span>Total prévu : {formatCurrency(missionDetailDataAvance.montantTotalPrevu)}</span>
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
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-[1px]"
                    aria-hidden
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 border border-slate-200 shadow-sm">
                      <Lock className="h-7 w-7 text-slate-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-600">Débloqué après approbation</p>
                    <p className="text-[11px] text-slate-500 max-w-[220px] text-center">
                      Les dépenses réelles seront disponibles une fois la mission approuvée.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline mission */}
            <Card>
              <CardHeader className="border-b border-slate-100 pb-2">
                <CardTitle className="text-sm">Timeline mission</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                {missionTimelineAvance.length === 0 ? (
                  <p className="text-[11px] text-slate-500">Aucun événement pour le moment sur cette mission.</p>
                ) : (
                  <ol className="relative space-y-3 max-h-80 overflow-y-auto pr-2">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
                    {missionTimelineAvance.map((event, idx) => {
                      const Icon = eventIcon[event.type];
                      const timeLabel = isToday(event.timestamp)
                        ? `Aujourd'hui · ${format(event.timestamp, 'HH:mm', { locale: fr })}`
                        : isYesterday(event.timestamp)
                        ? `Hier · ${format(event.timestamp, 'HH:mm', { locale: fr })}`
                        : format(event.timestamp, "dd MMM yyyy '·' HH:mm", { locale: fr });
                      const relativeLabel = formatDistanceToNow(event.timestamp, {
                        locale: fr,
                        addSuffix: true,
                      });
                      return (
                        <li key={event.id} className="relative flex gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50/80">
                          <div className="relative flex flex-col items-center">
                            <span className="flex h-3 w-3 shrink-0 rounded-full border-2 border-emerald-500 bg-emerald-50" />
                            {idx < missionTimelineAvance.length - 1 && (
                              <span className="mt-1 flex-1 border-l border-slate-200" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5 pb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                              <p className="text-[11px] text-slate-500">
                                {timeLabel}
                                <span className="ml-1 text-[10px] text-slate-400">({relativeLabel})</span>
                              </p>
                            </div>
                            <p className="text-xs font-medium text-slate-900">{eventLabel[event.type]}</p>
                            <p className="text-[11px] text-slate-600">
                              {event.actor.name}{' '}
                              <span className="text-slate-400">({event.actor.role})</span>
                            </p>
                            {event.data?.comment && (
                              <p className="text-[11px] italic text-slate-500">&quot;{event.data.comment}&quot;</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Dépense : template aligné sur avance (bloc visible + Informations dépense) */}
        {demande.type === 'depense' && demandeDepense && (
          <>
            {/* Dépense : bloc bleu organisé en sections claires */}
            <Card className="border border-blue-200 bg-blue-50/80 pb-4 shadow-sm">
              <CardContent className="px-4 pt-0 pb-1 space-y-4">
                {/* Badges tout en haut à droite (ligne dédiée) */}
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <Badge variant="neutral" className="text-[10px] font-medium">
                    {modeRemboursementLabel[demandeDepense.modeRemboursement]}
                  </Badge>
                  {demandeDepense.flags.length > 0 && (
                    demandeDepense.flags.map((f) => (
                      <Badge key={f} variant="warning" className="text-[10px]">
                        {getFlagLabel(f)}
                      </Badge>
                    ))
                  )}
                </div>

                {/* Gauche (moitié) : icône + montant + date — Droite (à partir du milieu) : description */}
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const cat = categoriesDepense.find((c) => c.nom === demandeDepense.categorie || c.id === demandeDepense.categorie);
                        const IconCat = cat ? categorieIconMap[cat.icone] : Receipt;
                        return (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 border border-blue-200 text-blue-700" title={demandeDepense.categorie}>
                            <IconCat className="h-5 w-5" />
                          </div>
                        );
                      })()}
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">Montant</p>
                        <p className="text-xl font-bold text-blue-900 tabular-nums">{formatCurrency(demandeDepense.montant)}</p>
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700">
                      Dépensé le {format(new Date(demandeDepense.date), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  {(demandeDepense.description?.trim()) ? (
                    <div className="min-w-0 pl-4 pr-0 border-l border-blue-200/50 flex items-center justify-end">
                      <p className="text-base font-semibold text-slate-700 leading-snug text-right max-w-full">
                        {demandeDepense.description}
                      </p>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>

                {/* Footer : date de soumission à gauche, boutons à droite */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                  <div className="text-[11px] leading-tight text-slate-500 shrink-0 [&>p]:mt-0 [&>p:not(:first-child)]:mt-px">
                    <p>Soumise le {format(new Date(demande.dateCreation), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</p>
                    <p>{formatDistanceToNow(new Date(demande.dateCreation), { addSuffix: true, locale: fr })}</p>
                  </div>
                  <div className="inline-flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      leftIcon={<FileText className="h-3.5 w-3.5 shrink-0" />}
                      className="h-8 shrink-0 border border-blue-300 text-xs text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setModalContextDemandeId(null);
                        setJustificatifModalOpen(true);
                      }}
                    >
                      Voir justificatif
                    </Button>
                    {demande.statut === 'en_attente' && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 shrink-0 border border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            setModalContextDemandeId(null);
                            setApproveModalOpen(true);
                          }}
                        >
                          Approuver
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 shrink-0 border border-rose-300 text-xs text-rose-700 hover:bg-rose-50"
                          onClick={() => {
                            setModalContextDemandeId(null);
                            setRejectModalOpen(true);
                          }}
                        >
                          Rejeter
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 shrink-0 text-xs"
                          onClick={() => {
                            setModalContextDemandeId(null);
                            setInfoModalOpen(true);
                          }}
                        >
                          Demander information
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Autres dépenses en attente : bouton "Voir" puis cartes en dessous */}
            {otherPendingDepenseDemandes.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">
                    {otherPendingDepenseDemandes.length === 1
                      ? 'Une autre dépense attend votre validation'
                      : `${otherPendingDepenseDemandes.length} autres dépenses attendent votre validation`}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setOtherExpensesExpanded((v) => !v)}
                  >
                    {otherExpensesExpanded ? 'Masquer' : 'Voir'}
                  </Button>
                </div>
                {otherExpensesExpanded && (
                  <div className="space-y-4">
                    {otherPendingDepenseDemandes.map((autreDemande) => {
                      const autreDep = depenses.find((d) => d.id === autreDemande.entityId);
                      if (!autreDep) return null;
                      const cat = categoriesDepense.find((c) => c.nom === autreDep.categorie || c.id === autreDep.categorie);
                      const IconCat = cat ? categorieIconMap[cat.icone] : Receipt;
                      const openJustificatif = () => {
                        setModalContextDemandeId(autreDemande.id);
                        setJustificatifModalOpen(true);
                      };
                      const openApprove = () => {
                        setModalContextDemandeId(autreDemande.id);
                        setApproveModalOpen(true);
                      };
                      const openReject = () => {
                        setModalContextDemandeId(autreDemande.id);
                        setRejectModalOpen(true);
                      };
                      const openInfo = () => {
                        setModalContextDemandeId(autreDemande.id);
                        setInfoModalOpen(true);
                      };
                      return (
                        <Card key={autreDemande.id} className="border border-blue-200 bg-blue-50/80 pb-4 shadow-sm">
                          <CardContent className="px-4 pt-0 pb-1 space-y-4">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <Badge variant="neutral" className="text-[10px] font-medium">
                                {modeRemboursementLabel[autreDep.modeRemboursement]}
                              </Badge>
                              {autreDep.flags.length > 0 &&
                                autreDep.flags.map((f) => (
                                  <Badge key={f} variant="warning" className="text-[10px]">
                                    {getFlagLabel(f)}
                                  </Badge>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                              <div className="flex flex-col gap-1.5 min-w-0">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 border border-blue-200 text-blue-700" title={autreDep.categorie}>
                                    <IconCat className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">Montant</p>
                                    <p className="text-xl font-bold text-blue-900 tabular-nums">{formatCurrency(autreDep.montant)}</p>
                                  </div>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-700">
                                  Dépensé le {format(new Date(autreDep.date), 'dd MMM yyyy', { locale: fr })}
                                </p>
                              </div>
                              {autreDep.description?.trim() ? (
                                <div className="min-w-0 pl-4 pr-0 border-l border-blue-200/50 flex items-center justify-end">
                                  <p className="text-base font-semibold text-slate-700 leading-snug text-right max-w-full">
                                    {autreDep.description}
                                  </p>
                                </div>
                              ) : (
                                <div />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                              <div className="text-[11px] leading-tight text-slate-500 shrink-0 [&>p]:mt-0 [&>p:not(:first-child)]:mt-px">
                                <p>Soumise le {format(new Date(autreDemande.dateCreation), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</p>
                                <p>{formatDistanceToNow(new Date(autreDemande.dateCreation), { addSuffix: true, locale: fr })}</p>
                              </div>
                              <div className="inline-flex flex-wrap items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  leftIcon={<FileText className="h-3.5 w-3.5 shrink-0" />}
                                  className="h-8 shrink-0 border border-blue-300 text-xs text-blue-700 hover:bg-blue-50"
                                  onClick={openJustificatif}
                                >
                                  Voir justificatif
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 shrink-0 border border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50"
                                  onClick={openApprove}
                                >
                                  Approuver
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 shrink-0 border border-rose-300 text-xs text-rose-700 hover:bg-rose-50"
                                  onClick={openReject}
                                >
                                  Rejeter
                                </Button>
                                <Button type="button" size="sm" variant="secondary" className="h-8 shrink-0 text-xs" onClick={openInfo}>
                                  Demander information
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Modal Justificatif (dépense) — utilise displayDepenseForModal pour carte courante ou "autre" */}
            {demande.type === 'depense' && (displayDepenseForModal ?? demandeDepense) && (
              <Modal
                open={justificatifModalOpen}
                title="Justificatif"
                onClose={() => {
                  setJustificatifModalOpen(false);
                  setModalContextDemandeId(null);
                }}
                footer={
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setJustificatifModalOpen(false);
                      setModalContextDemandeId(null);
                    }}
                  >
                    Fermer
                  </Button>
                }
              >
                <div className="space-y-3 text-xs">
                  {(() => {
                    const dep = displayDepenseForModal ?? demandeDepense;
                    if (!dep) return null;
                    return (
                      <>
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-slate-500">Statut</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium capitalize ${justificatifColor[dep.statutJustificatif]}`}>
                            {dep.statutJustificatif === 'valide' && <CheckCircle2 className="h-3 w-3" />}
                            {dep.statutJustificatif === 'rejete' && <XCircle className="h-3 w-3" />}
                            {dep.statutJustificatif === 'en_attente' && <Clock3 className="h-3 w-3" />}
                            {dep.statutJustificatif === 'non_fournis' && <FileText className="h-3 w-3" />}
                            {dep.statutJustificatif.replace('_', ' ')}
                          </span>
                        </p>
                        {dep.justificatifUrl ? (
                          <a
                            href={dep.justificatifUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Voir le document
                          </a>
                        ) : (
                          <p className="text-slate-500">Aucun document joint.</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </Modal>
            )}

            {/* Informations mission + Dépenses prévues + Dépenses réelles + Timeline (quand la dépense est liée à une mission) */}
            {missionDepense && missionDetailDataDepense && (
              <>
                <Card className="gap-0 space-y-0">
                  <CardHeader className="border-b border-slate-100 pb-2">
                    <CardTitle className="text-sm">Informations mission</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-4 text-xs text-slate-700">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ordre de mission</p>
                        <p className="text-slate-900">{missionDepense.titre}</p>
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Destination</p>
                        <p className="text-slate-900">{missionDepense.destination}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Projet associé</p>
                        <p className="text-slate-900">{missionDepense.projetAssocie ?? '—'}</p>
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dates</p>
                        <p className="text-slate-900">
                          {format(new Date(missionDepense.dateDebut), 'dd MMM yyyy', { locale: fr })} –{' '}
                          {format(new Date(missionDepense.dateFin), 'dd MMM yyyy', { locale: fr })}{' '}
                          <span className="text-slate-500">
                            ({differenceInCalendarDays(new Date(missionDepense.dateFin), new Date(missionDepense.dateDebut)) + 1} jour(s))
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</p>
                      <p className="mt-1 text-slate-900">
                        Mission commerciale à {missionDepense.destination} pour rencontrer les principaux clients et partenaires locaux,
                        animer des ateliers avec les équipes sur place et préparer le lancement des prochaines initiatives.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Dépenses prévues (mission) */}
                <Card>
                  <CardHeader className="border-b border-slate-100 pb-2">
                    <CardTitle className="text-sm">Dépenses prévues (mission)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-4">
                    {missionDetailDataDepense.depensesPrevues.length > 0 ? (
                      <>
                        <div className="text-xs text-slate-600">
                          {missionDetailDataDepense.depensesPrevues.length} ligne(s) · Total prévu{' '}
                          <span className="font-medium text-slate-900">{formatCurrency(missionDetailDataDepense.montantTotalPrevu)}</span>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Catégorie</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Montant estimé</TableHead>
                              <TableHead>Mode</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {missionDetailDataDepense.depensesPrevues.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="text-xs text-slate-700">
                                  {categoriesDepense.find((c) => c.nom === p.categorieId || c.id === p.categorieId)?.nom ?? p.categorieId}
                                </TableCell>
                                <TableCell className="text-xs text-slate-900">{p.description}</TableCell>
                                <TableCell className="text-xs text-slate-900">{formatCurrency(p.montantEstime)}</TableCell>
                                <TableCell className="text-xs text-slate-700">{modeRemboursementLabel[p.modeRemboursement]}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">Aucune dépense prévue renseignée.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Dépenses réelles (mission) */}
                <Card>
                  <CardHeader className="border-b border-slate-100 pb-2">
                    <CardTitle className="text-sm">Dépenses réelles</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span>Total prévu : <span className="font-medium text-slate-900">{formatCurrency(missionDetailDataDepense.montantTotalPrevu)}</span></span>
                      <span>Total réel : <span className="font-medium text-slate-900">{formatCurrency(missionDetailDataDepense.depenseTotal)}</span></span>
                      <span>{missionDetailDataDepense.missionDepenses.length} dépense(s)</span>
                    </div>
                    {missionDetailDataDepense.missionDepenses.length > 0 ? (
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
                          {missionDetailDataDepense.missionDepenses.map((d) => {
                            const date = new Date(d.date);
                            const cat = categoriesDepense.find((c) => c.nom === d.categorie);
                            const hasFlags = d.flags.length > 0;
                            return (
                              <TableRow key={d.id}>
                                <TableCell className="text-xs text-slate-700">{format(date, 'dd/MM/yyyy', { locale: fr })}</TableCell>
                                <TableCell className="text-xs text-slate-900">
                                  {d.description}
                                  {hasFlags && (
                                    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                      <AlertTriangle className="h-2.5 w-2.5" />
                                      {getFlagLabel(d.flags[0])}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-slate-700">{cat?.nom ?? d.categorie}</TableCell>
                                <TableCell className="text-xs text-slate-900">{formatCurrency(d.montant)}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${justificatifColor[d.statutJustificatif]}`}>
                                    {d.statutJustificatif === 'valide' && <CheckCircle2 className="h-3 w-3" />}
                                    {d.statutJustificatif === 'rejete' && <XCircle className="h-3 w-3" />}
                                    {d.statutJustificatif === 'en_attente' && <Clock3 className="h-3 w-3" />}
                                    {d.statutJustificatif === 'non_fournis' && <FileText className="h-3 w-3" />}
                                    <span className="capitalize">{d.statutJustificatif.replace('_', ' ')}</span>
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-xs text-slate-500">Aucune dépense réelle saisie sur cette mission.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline mission */}
                <Card>
                  <CardHeader className="border-b border-slate-100 pb-2">
                    <CardTitle className="text-sm">Timeline mission</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    {missionTimelineDepense.length === 0 ? (
                      <p className="text-[11px] text-slate-500">Aucun événement pour le moment sur cette mission.</p>
                    ) : (
                      <ol className="relative space-y-3 max-h-80 overflow-y-auto pr-2">
                        <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
                        {missionTimelineDepense.map((event, idx) => {
                          const Icon = eventIcon[event.type];
                          const timeLabel = isToday(event.timestamp)
                            ? `Aujourd'hui · ${format(event.timestamp, 'HH:mm', { locale: fr })}`
                            : isYesterday(event.timestamp)
                            ? `Hier · ${format(event.timestamp, 'HH:mm', { locale: fr })}`
                            : format(event.timestamp, "dd MMM yyyy '·' HH:mm", { locale: fr });
                          const relativeLabel = formatDistanceToNow(event.timestamp, {
                            locale: fr,
                            addSuffix: true,
                          });
                          return (
                            <li key={event.id} className="relative flex gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50/80">
                              <div className="relative flex flex-col items-center">
                                <span className="flex h-3 w-3 shrink-0 rounded-full border-2 border-emerald-500 bg-emerald-50" />
                                {idx < missionTimelineDepense.length - 1 && (
                                  <span className="mt-1 flex-1 border-l border-slate-200" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5 pb-2">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                  <p className="text-[11px] text-slate-500">
                                    {timeLabel}
                                    <span className="ml-1 text-[10px] text-slate-400">({relativeLabel})</span>
                                  </p>
                                </div>
                                <p className="text-xs font-medium text-slate-900">{eventLabel[event.type]}</p>
                                <p className="text-[11px] text-slate-600">
                                  {event.actor.name}{' '}
                                  <span className="text-slate-400">({event.actor.role})</span>
                                </p>
                                {event.data?.comment && (
                                  <p className="text-[11px] italic text-slate-500">&quot;{event.data.comment}&quot;</p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>

      {/* Sidebar actions (sticky) + Budget en dessous */}
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-6 lg:w-80">
        <Card className="gap-0 space-y-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            {demande.statut === 'en_attente' && (
              <>
                {demande.type === 'mission' && (
                  <div className="space-y-3 pb-2 border-b border-slate-100">
                    <div>
                      <label className="text-xs font-medium text-slate-700">Budget alloué (€) *</label>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Montant en €"
                        value={budgetAlloue}
                        onChange={(e) => setBudgetAlloue(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Avance octroyée (€) *</label>
                      <Input
                        type="number"
                        min={0}
                        step={50}
                        placeholder="0 si aucune avance"
                        value={avanceOctroyee}
                        onChange={(e) => setAvanceOctroyee(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
                {demande.type === 'avance' && missionDetailDataAvance && (
                  <div className="space-y-3 pb-2 border-b border-slate-100">
                    <div>
                      <label className="text-xs font-medium text-slate-700">Montant à octroyer (€) *</label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Avance demandée : <span className="font-semibold text-emerald-700">{formatCurrency(missionDetailDataAvance.avanceDemo)}</span> (voir en haut de page)
                      </p>
                      <Input
                        type="number"
                        min={0}
                        step={50}
                        placeholder={formatCurrency(missionDetailDataAvance.avanceDemo)}
                        value={avanceOctroyee}
                        onChange={(e) => setAvanceOctroyee(e.target.value)}
                        className="mt-1 border-emerald-200 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => {
                    if (demande.type === 'mission' && !canApproveMission) {
                      setApproveAttemptedWithoutFields(true);
                      return;
                    }
                    if (demande.type === 'avance' && !canApproveAdvance) {
                      setApproveAttemptedWithoutFields(true);
                      return;
                    }
                    setApproveModalOpen(true);
                  }}
                >
                  Approuver
                </Button>
                {approveAttemptedWithoutFields && demande.type === 'mission' && !canApproveMission && (
                  <p className="text-[11px] text-amber-600">
                    Renseignez le budget alloué et l&apos;avance octroyée pour pouvoir approuver.
                  </p>
                )}
                {approveAttemptedWithoutFields && demande.type === 'avance' && !canApproveAdvance && (
                  <p className="text-[11px] text-amber-600">
                    Renseignez l&apos;avance octroyée pour pouvoir approuver.
                  </p>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full border border-rose-300 text-rose-700 hover:bg-rose-50"
                  onClick={() => setRejectModalOpen(true)}
                >
                  Rejeter
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setInfoModalOpen(true)}
                >
                  Demander information
                </Button>
              </>
            )}

            {/* Modal Approuver */}
            <Modal
              open={approveModalOpen}
              title="Confirmer l'approbation"
              onClose={() => {
                setApproveModalOpen(false);
                setModalContextDemandeId(null);
              }}
              footer={
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setApproveModalOpen(false);
                      setModalContextDemandeId(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      setProcessedDemandeIds((prev) => [...prev, displayDemandeId]);
                      setApproveModalOpen(false);
                      setModalContextDemandeId(null);
                    }}
                  >
                    Confirmer
                  </Button>
                </>
              }
            >
              <p className="text-xs text-slate-600">
                Êtes-vous sûr de vouloir approuver cette demande ?
              </p>
            </Modal>

            {/* Modal Rejeter */}
            <Modal
              open={rejectModalOpen}
              title="Confirmer le rejet"
              onClose={() => {
                setRejectModalOpen(false);
                setRejectReason('');
                setModalContextDemandeId(null);
              }}
              footer={
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setRejectModalOpen(false);
                      setRejectReason('');
                      setModalContextDemandeId(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="border-rose-300 text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      setProcessedDemandeIds((prev) => [...prev, displayDemandeId]);
                      setRejectModalOpen(false);
                      setRejectReason('');
                      setModalContextDemandeId(null);
                    }}
                  >
                    Rejeter
                  </Button>
                </>
              }
            >
              <div className="space-y-2">
                <p className="text-xs text-slate-600">Indiquez le motif du rejet (obligatoire pour le demandeur).</p>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Motif du rejet..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </Modal>

            {/* Modal Demander information */}
            <Modal
              open={infoModalOpen}
              title="Demander des informations"
              onClose={() => {
                setInfoModalOpen(false);
                setInfoMessage('');
                setModalContextDemandeId(null);
              }}
              footer={
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setInfoModalOpen(false);
                      setInfoMessage('');
                      setModalContextDemandeId(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      setInfoModalOpen(false);
                      setInfoMessage('');
                      setModalContextDemandeId(null);
                    }}
                  >
                    Envoyer
                  </Button>
                </>
              }
            >
              <div className="space-y-2">
                <p className="text-xs text-slate-600">Précisez les informations dont vous avez besoin.</p>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Informations demandées..."
                  value={infoMessage}
                  onChange={(e) => setInfoMessage(e.target.value)}
                />
              </div>
            </Modal>
            {demande.statut !== 'en_attente' && (
              <p className="text-xs text-slate-500">
                Cette demande a déjà été traitée.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Budget — affiché sous les Actions pour mission et avance */}
        {demande.type === 'mission' && missionDetailData && (
          <Card className="gap-0 space-y-0">
            <CardHeader className="border-b border-slate-100 pb-2">
              <CardTitle className="text-sm">Budget</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-4 text-xs text-slate-700">
              {missionDetailData.budgetAlloue != null ? (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-blue-700">Budget alloué</span>
                      <span className="font-semibold text-blue-900 tabular-nums">
                        {formatCurrency(missionDetailData.budgetAlloue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-600">Dépensé</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(missionDetailData.depenseTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Avances</span>
                      <span className="font-semibold text-emerald-900 tabular-nums">
                        {missionDetailData.totalAvances > 0 ? formatCurrency(missionDetailData.totalAvances) : '—'}
                      </span>
                    </div>
                  </div>
                  {missionDetailData.totalForPct > 0 ? (
                    <div className="space-y-2">
                      <div className="flex h-8 w-full overflow-hidden rounded-lg bg-slate-100">
                        {missionDetailData.pctCouvert > 0 && (
                          <div className="relative flex shrink-0" style={{ width: `${missionDetailData.pctCouvert}%` }}>
                            <span className="h-full w-full min-w-[2px] bg-emerald-500" />
                          </div>
                        )}
                        {missionDetailData.pctAuDela > 0 && (
                          <div className="relative flex shrink-0" style={{ width: `${missionDetailData.pctAuDela}%` }}>
                            <span className="h-full w-full min-w-[2px] bg-blue-500" />
                          </div>
                        )}
                        {missionDetailData.pctReste > 0 && (
                          <div className="relative flex shrink-0" style={{ width: `${missionDetailData.pctReste}%` }}>
                            <span className="h-full w-full min-w-[2px] bg-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-sm bg-emerald-500" />Couvert par l&apos;avance : {formatCurrency(missionDetailData.couvertParAvance)}</span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-sm bg-blue-500" />Dépensé au-delà de l&apos;avance : {formatCurrency(missionDetailData.depenseAuDelaAvance)}</span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-sm bg-slate-300" />Reste budget : {formatCurrency(missionDetailData.budgetRestant)}</span>
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
                    Définir lors de l&apos;approbation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {demande.type === 'avance' && recapAvanceMission && (
          <Card className="gap-0 space-y-0">
            <CardHeader className="border-b border-slate-100 pb-2">
              <CardTitle className="text-sm">Budget</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-blue-700">Budget alloué</span>
                  <span className="font-semibold text-blue-900 tabular-nums">
                    {formatCurrency(recapAvanceMission.budgetAlloue)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-600">Dépensé</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(recapAvanceMission.depenseTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Avances</span>
                  <span className="font-semibold text-emerald-900 tabular-nums">
                    {formatCurrency(recapAvanceMission.totalAvances)}
                  </span>
                </div>
              </div>
              {recapAvanceMission.total > 0 ? (
                <div className="space-y-2">
                  <div className="flex h-8 w-full overflow-hidden rounded-lg bg-slate-100">
                    {recapAvanceMission.pctCouvert > 0 && (
                      <div className="relative flex shrink-0" style={{ width: `${recapAvanceMission.pctCouvert}%` }}>
                        <span className="h-full w-full min-w-[2px] bg-emerald-500" />
                      </div>
                    )}
                    {recapAvanceMission.pctAuDela > 0 && (
                      <div className="relative flex shrink-0" style={{ width: `${recapAvanceMission.pctAuDela}%` }}>
                        <span className="h-full w-full min-w-[2px] bg-blue-500" />
                      </div>
                    )}
                    {recapAvanceMission.pctReste > 0 && (
                      <div className="relative flex shrink-0" style={{ width: `${recapAvanceMission.pctReste}%` }}>
                        <span className="h-full w-full min-w-[2px] bg-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-sm bg-emerald-500" />Couvert par l&apos;avance : {formatCurrency(recapAvanceMission.couvertParAvance)}</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-sm bg-blue-500" />Dépensé au-delà de l&apos;avance : {formatCurrency(recapAvanceMission.depenseAuDelaAvance)}</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-sm bg-slate-300" />Reste budget : {formatCurrency(recapAvanceMission.reste)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Aucune donnée à afficher.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Budget — mission liée à la dépense (approbation dépense) */}
        {demande.type === 'depense' && missionDepense && missionDetailDataDepense && (
          <Card className="gap-0 space-y-0">
            <CardHeader className="border-b border-slate-100 pb-2">
              <CardTitle className="text-sm">Budget</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-4 text-xs text-slate-700">
              {missionDetailDataDepense.budgetAlloue != null ? (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-blue-700">Budget alloué</span>
                      <span className="font-semibold text-blue-900 tabular-nums">
                        {formatCurrency(missionDetailDataDepense.budgetAlloue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-600">Dépensé</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(missionDetailDataDepense.depenseTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Avances</span>
                      <span className="font-semibold text-emerald-900 tabular-nums">
                        {missionDetailDataDepense.totalAvances > 0 ? formatCurrency(missionDetailDataDepense.totalAvances) : '—'}
                      </span>
                    </div>
                  </div>
                  {missionDetailDataDepense.totalForPct > 0 ? (
                    <div className="space-y-2">
                      <div className="flex h-8 w-full overflow-hidden rounded-lg bg-slate-100">
                        {missionDetailDataDepense.pctCouvert > 0 && (
                          <div className="relative flex shrink-0" style={{ width: `${missionDetailDataDepense.pctCouvert}%` }}>
                            <span className="h-full w-full min-w-[2px] bg-emerald-500" />
                          </div>
                        )}
                        {missionDetailDataDepense.pctAuDela > 0 && (
                          <div className="relative flex shrink-0" style={{ width: `${missionDetailDataDepense.pctAuDela}%` }}>
                            <span className="h-full w-full min-w-[2px] bg-blue-500" />
                          </div>
                        )}
                        {missionDetailDataDepense.pctReste > 0 && (
                          <div className="relative flex shrink-0" style={{ width: `${missionDetailDataDepense.pctReste}%` }}>
                            <span className="h-full w-full min-w-[2px] bg-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-sm bg-emerald-500" />Couvert par l&apos;avance : {formatCurrency(missionDetailDataDepense.couvertParAvance)}</span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-sm bg-blue-500" />Dépensé au-delà de l&apos;avance : {formatCurrency(missionDetailDataDepense.depenseAuDelaAvance)}</span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-sm bg-slate-300" />Reste budget : {formatCurrency(missionDetailDataDepense.budgetRestant)}</span>
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
                    Mission non encore approuvée.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </aside>

      {/* Bouton flottant Agent IA */}
      <button
        type="button"
        onClick={() => setAgentPanelOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        title="Analyse Agent IA"
        aria-label="Ouvrir l'analyse Agent IA"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {/* Fenêtre flottante Agent IA */}
      {agentPanelOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[min(calc(100vw-3rem),360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          style={{ boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.12), 0 20px 40px rgba(0,0,0,0.12)' }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-900">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-violet-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
              </span>
              Agent IA
            </span>
            <button
              type="button"
              onClick={() => setAgentPanelOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
              aria-label="Fermer"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-4">
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600/90">Recommandation</p>
              <p className="mt-0.5 text-sm font-semibold text-emerald-800">Approbation recommandée</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200/80">
                <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" title="88% confiance" />
              </div>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Insights</p>
            <ul className="mt-2 space-y-2">
              <li className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Toutes les dépenses conformes à la politique</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Justificatifs complets</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-600">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>1 override forfait→réel (justifié)</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-600">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>Repas 15% au-dessus de la moyenne</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalDetail;
