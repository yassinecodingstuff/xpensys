import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  Train,
  Plane,
  Hotel,
  Utensils,
  Car,
  MapPin,
  ExternalLink,
  FlagTriangleRight,
  Upload,
  CreditCard,
  BadgeInfo,
  X,
  Eye,
  Copy,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  depenses,
  missions,
  transactionsCarte,
  categoriesDepense,
  modeRemboursementLabel,
  getFlagLabel,
  type Depense,
  type Mission,
  type TransactionCarte,
  type MissionEventType,

} from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
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

const formatCurrency = (value: number, currency: string = 'EUR') =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
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

const statutBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  brouillon: 'default',
  en_attente: 'warning',
  valide: 'success',
  paye: 'success',
  refuse: 'danger',
  demande_info: 'default',
};

const statutLabel: Record<string, string> = {
  brouillon: 'Brouillon',
  en_attente: 'En attente',
  valide: 'Validée',
  paye: 'Remboursée',
  refuse: 'Refusée',
  demande_info: "Demande d'information",
};

const ExpenseDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [justificatifModalOpen, setJustificatifModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reponseDemandeInfo, setReponseDemandeInfo] = useState('');
  const [showEnvoyerForm, setShowEnvoyerForm] = useState(false);
  const [commentaireEnvoi, setCommentaireEnvoi] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; type: string } | null>(null);

  // Données dépense
  const depense = depenses.find((d) => d.id === id);
  const mission = depense?.missionId ? missions.find((m) => m.id === depense.missionId) : undefined;
  const transaction = depense?.transactionCarteId
    ? transactionsCarte.find((t) => t.id === depense.transactionCarteId)
    : transactionsCarte.find((t) => t.depenseId === depense?.id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedFile({ url, name: file.name, type: file.type });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedFile({ url, name: file.name, type: file.type });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };


  /** Timeline de la mission liée à la dépense. */
  const missionTimeline = useMemo(() => {
    if (!mission?.events?.length) return [];
    return mission.events
      .map((e) => ({ ...e, timestamp: new Date(e.timestamp) }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [mission?.events]);

  /** Données budget + tableaux de la mission liée. */
  const missionDetailData = useMemo(() => {
    if (!mission) return null;
    const m = mission;
    const missionDepenses = depenses.filter((d) => d.missionId === m.id);
    const depenseTotal = missionDepenses.reduce((sum, d) => sum + d.montant, 0);
    const depensesPrevues = m.depensesPrevues ?? [];
    const montantTotalPrevu = depensesPrevues.reduce((s, p) => s + p.montantEstime, 0);
    const budgetAlloue = m.budgetAlloue;
    const budgetRestant =
      budgetAlloue != null ? Math.max(budgetAlloue - depenseTotal, 0) : 0;
    const totalAvances = (m.events ?? [])
      .filter((e) => e.type === 'advance_paid')
      .reduce((s, e) => s + ((e.data as { amount?: number })?.amount ?? 0), 0);
    const couvertParAvance = Math.min(depenseTotal, totalAvances);
    const depenseAuDelaAvance = Math.max(0, depenseTotal - totalAvances);
    const totalForPct = budgetAlloue ?? depenseTotal + budgetRestant;
    const pctCouvert = totalForPct > 0 ? (couvertParAvance / totalForPct) * 100 : 0;
    const pctAuDela = totalForPct > 0 ? (depenseAuDelaAvance / totalForPct) * 100 : 0;
    const pctReste = totalForPct > 0 ? (budgetRestant / totalForPct) * 100 : 0;
    return {
      missionDepenses,
      depenseTotal,
      depensesPrevues,
      montantTotalPrevu,
      budgetAlloue,
      budgetRestant,
      totalAvances,
      couvertParAvance,
      depenseAuDelaAvance,
      totalForPct,
      pctCouvert,
      pctAuDela,
      pctReste,
    };
  }, [mission]);

  if (!depense) {
    return (
      <div className="space-y-4">
        <Link
          to="/expenses"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour à mes dépenses
        </Link>
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-600">
            Dépense introuvable.
          </CardContent>
        </Card>
      </div>
    );
  }

  const reference = `${depense.categorie} – ${depense.description}`;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Retour */}
        <Link
          to="/expenses"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour à mes dépenses
        </Link>

        {/* Dépense : carte bleue prenant toute la hauteur */}
        <Card className="border border-blue-200 bg-blue-50/80 shadow-sm min-h-[calc(100vh-10rem)]">
          <CardContent className="px-4 pt-0 pb-4 space-y-4 h-full flex flex-col">
              {/* Statut + badges tout en haut */}
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <Badge
                  variant={statutBadgeVariant[depense.statutRemboursement] ?? 'default'}
                  className="text-[10px] font-semibold"
                >
                  {statutLabel[depense.statutRemboursement] ?? depense.statutRemboursement}
                </Badge>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="neutral" className="text-[10px] font-medium">
                    {modeRemboursementLabel[depense.modeRemboursement]}
                  </Badge>
                  {depense.flags.length > 0 &&
                    depense.flags.map((f) => (
                      <Badge key={f} variant="warning" className="text-[10px]">
                        {getFlagLabel(f)}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Gauche : icône + montant + date — Droite : description */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const cat = categoriesDepense.find((c) => c.nom === depense.categorie || c.id === depense.categorie);
                      const IconCat = cat ? categorieIconMap[cat.icone] : Receipt;
                      return (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 border border-blue-200 text-blue-700" title={depense.categorie}>
                          <IconCat className="h-5 w-5" />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">Montant</p>
                      <p className="text-xl font-bold text-blue-900 tabular-nums">{formatCurrency(depense.montant, depense.devise)}</p>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700">
                    Dépensé le {format(new Date(depense.date), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
                {depense.description?.trim() ? (
                  <div className="min-w-0 pl-4 pr-0 border-l border-blue-200/50 flex items-center justify-end">
                    <p className="text-base font-semibold text-slate-700 leading-snug text-right max-w-full">
                      {depense.description}
                    </p>
                  </div>
                ) : (
                  <div />
                )}
              </div>

          {/* Justificatif + Commentaires IA */}
          <div className="flex-1 grid grid-cols-2 gap-4 pt-3 border-t border-blue-200/50">
            {/* Gauche : Visualisation du justificatif */}
            <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <p className="text-[11px] font-semibold text-slate-700">Justificatif</p>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${justificatifColor[depense.statutJustificatif]}`}>
                  {depense.statutJustificatif === 'valide' && <CheckCircle2 className="h-3 w-3" />}
                  {depense.statutJustificatif === 'rejete' && <XCircle className="h-3 w-3" />}
                  {depense.statutJustificatif === 'en_attente' && <Clock3 className="h-3 w-3" />}
                  {depense.statutJustificatif === 'non_fournis' && <FileText className="h-3 w-3" />}
                  <span className="capitalize">{depense.statutJustificatif.replace('_', ' ')}</span>
                </span>
              </div>
              {uploadedFile ? (
                <div className="flex-1 flex flex-col bg-slate-50 rounded-b-xl overflow-hidden">
                  <div className="flex-1 flex items-center justify-center p-2 min-h-0">
                    {uploadedFile.type.startsWith('image/') ? (
                      <img
                        src={uploadedFile.url}
                        alt={uploadedFile.name}
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    ) : (
                      <iframe
                        src={uploadedFile.url}
                        title={uploadedFile.name}
                        className="h-full w-full rounded-lg border border-slate-200"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2">
                    <p className="text-[11px] text-slate-600 truncate max-w-[60%]">{uploadedFile.name}</p>
                    <div className="flex items-center gap-2">
                      <a
                        href={uploadedFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ouvrir
                      </a>
                      <button
                        type="button"
                        className="text-[11px] text-rose-600 hover:underline"
                        onClick={() => setUploadedFile(null)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  className="flex-1 flex cursor-pointer flex-col items-center justify-center gap-3 bg-slate-50 p-4 rounded-b-xl transition hover:bg-blue-50/40"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <Upload className="h-8 w-8 text-slate-400" />
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-600">Glissez ou cliquez pour ajouter</p>
                    <p className="text-[10px] text-slate-400">Image ou PDF</p>
                  </div>
                  <input type="file" accept="image/*,.pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {/* Droite : Commentaires de l'IA */}
            <div className="flex flex-col rounded-xl border border-violet-200 bg-white overflow-hidden">
              <div className="flex items-center gap-2 border-b border-violet-100 bg-violet-50/50 px-3 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-violet-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                </span>
                <p className="text-[11px] font-semibold text-violet-900">Analyse IA</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Insights */}
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vérifications</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-[11px] text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>Montant dans les limites du plafond autorisé</span>
                  </li>
                  <li className="flex items-start gap-2 text-[11px] text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>Date cohérente avec la mission</span>
                  </li>
                  <li className="flex items-start gap-2 text-[11px] text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>Catégorie correctement identifiée</span>
                  </li>
                  {depense.flags.length > 0 && depense.flags.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[11px] text-slate-600">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span>{getFlagLabel(f)}</span>
                    </li>
                  ))}
                  {depense.statutJustificatif === 'non_fournis' && (
                    <li className="flex items-start gap-2 text-[11px] text-slate-600">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span>Justificatif manquant — à fournir avant soumission</span>
                    </li>
                  )}
                </ul>

                {/* Données extraites */}
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Données extraites (OCR)</p>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Fournisseur</span>
                    <span className="font-medium text-slate-900">{transaction?.marchand ?? 'Non détecté'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Montant TTC</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(depense.montant, depense.devise)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">TVA (approx.)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(depense.montant * 0.2, depense.devise)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer : date */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-blue-200/50">
            <p className="text-[11px] text-slate-500">Créée le {format(new Date(depense.date), "dd MMM yyyy", { locale: fr })}</p>
            <p className="text-[11px] text-slate-500">{formatDistanceToNow(new Date(depense.date), { addSuffix: true, locale: fr })}</p>
          </div>
          </CardContent>
        </Card>

      </div>

      {/* Sidebar (sticky) */}
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-6 lg:w-80">
        {/* Actions */}
        <Card className="gap-0 space-y-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-2">
            {/* --- brouillon --- */}
            {depense.statutRemboursement === 'brouillon' && (
              <>
                {!showEnvoyerForm ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => setShowEnvoyerForm(true)}
                  >
                    Envoyer pour approbation
                  </Button>
                ) : (
                  <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                    <p className="text-xs font-medium text-emerald-800">Commentaire (optionnel)</p>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                      rows={3}
                      placeholder="Ajoutez un commentaire pour l'approbateur..."
                      value={commentaireEnvoi}
                      onChange={(e) => setCommentaireEnvoi(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="flex-1 border border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                        onClick={() => {
                          depense.statutRemboursement = 'en_attente';
                          setCommentaireEnvoi('');
                          setShowEnvoyerForm(false);
                          navigate(`/expenses/${depense.id}`);
                        }}
                      >
                        Confirmer l'envoi
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-slate-500"
                        onClick={() => {
                          setShowEnvoyerForm(false);
                          setCommentaireEnvoi('');
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => navigate(`/expenses/new?editId=${depense.id}`)}
                >
                  Modifier
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start border border-rose-300 text-rose-700 hover:bg-rose-50"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Supprimer
                </Button>
              </>
            )}

            {/* --- en_attente --- */}
            {depense.statutRemboursement === 'en_attente' && (
              <>
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                  <p className="text-xs text-amber-700 font-medium">En attente de validation</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start border border-rose-300 text-rose-700 hover:bg-rose-50"
                  onClick={() => {
                    depense.statutRemboursement = 'brouillon';
                    navigate(`/expenses/${depense.id}`);
                  }}
                >
                  Annuler l'envoi
                </Button>
              </>
            )}

            {/* --- demande_info --- */}
            {depense.statutRemboursement === 'demande_info' && (
              <>
                {/* Message de l'approbateur */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200">
                      <HelpCircle className="h-3 w-3 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-900">
                        {depense.approbateurNom ?? 'Approbateur'}
                      </p>
                      {depense.dateDemandeInfo && (
                        <p className="text-[10px] text-amber-600">
                          {format(new Date(depense.dateDemandeInfo), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                          {' · '}
                          {formatDistanceToNow(new Date(depense.dateDemandeInfo), { addSuffix: true, locale: fr })}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-800">
                    {depense.commentaireApprobateur ?? "Informations complémentaires demandées."}
                  </p>
                </div>

                {/* Zone de réponse */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Votre réponse</p>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-200"
                    rows={3}
                    placeholder="Saisissez votre réponse ici..."
                    value={reponseDemandeInfo}
                    onChange={(e) => setReponseDemandeInfo(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-full border border-blue-300 text-blue-700 hover:bg-blue-50"
                    disabled={!reponseDemandeInfo.trim()}
                    onClick={() => {
                      depense.statutRemboursement = 'en_attente';
                      setReponseDemandeInfo('');
                      navigate(`/expenses/${depense.id}`);
                    }}
                  >
                    Envoyer la réponse
                  </Button>
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => navigate(`/expenses/new?editId=${depense.id}`)}
                  >
                    Modifier la dépense
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start border border-rose-300 text-rose-700 hover:bg-rose-50"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Supprimer
                  </Button>
                </div>
              </>
            )}

            {/* --- valide --- */}
            {depense.statutRemboursement === 'valide' && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start border border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    if (depense.justificatifUrl) window.open(depense.justificatifUrl, '_blank');
                  }}
                >
                  Voir le justificatif
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start border border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    if (depense.justificatifUrl) {
                      const a = document.createElement('a');
                      a.href = depense.justificatifUrl;
                      a.download = `justificatif-${depense.id}.pdf`;
                      a.click();
                    }
                  }}
                >
                  Télécharger le justificatif
                </Button>
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                  <CheckCircle2 className="mr-1 inline h-3 w-3" />
                  Dépense approuvée — en attente de paiement.
                </div>
              </>
            )}

            {/* --- refuse --- */}
            {depense.statutRemboursement === 'refuse' && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start border border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => {
                    depense.statutRemboursement = 'en_attente';
                    depense.flags = [];
                    navigate(`/expenses/${depense.id}?edit=true`);
                  }}
                >
                  Contester / Resoumettre
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start border border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    navigator.clipboard.writeText(depense.id);
                  }}
                >
                  Copier la référence
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start border border-rose-300 text-rose-700 hover:bg-rose-50"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Supprimer
                </Button>
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                  <XCircle className="mr-1 inline h-3 w-3" />
                  Cette dépense a été refusée.
                </div>
              </>
            )}

            {/* --- paye --- */}
            {depense.statutRemboursement === 'paye' && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start border border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    if (depense.justificatifUrl) window.open(depense.justificatifUrl, '_blank');
                  }}
                >
                  Voir le justificatif
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start border border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    if (depense.justificatifUrl) {
                      const a = document.createElement('a');
                      a.href = depense.justificatifUrl;
                      a.download = `justificatif-${depense.id}.pdf`;
                      a.click();
                    }
                  }}
                >
                  Télécharger le justificatif
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start border border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    navigator.clipboard.writeText(depense.id);
                  }}
                >
                  Copier la référence
                </Button>
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                  <Banknote className="mr-1 inline h-3 w-3" />
                  Remboursement effectué.
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Modale confirmation suppression */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-900">Supprimer cette dépense ?</h3>
              <p className="mt-2 text-xs text-slate-500">
                Cette action est irréversible. La dépense « {depense.description} » sera définitivement supprimée.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="border border-rose-300 text-rose-700 hover:bg-rose-50"
                  onClick={() => {
                    // En prod : appel API pour supprimer
                    const idx = depenses.indexOf(depense);
                    if (idx !== -1) depenses.splice(idx, 1);
                    navigate('/expenses');
                  }}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Confirmer la suppression
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Statut & validation */}
        <Card className="gap-0 space-y-0">
          <CardHeader className="border-b border-slate-100 pb-2">
            <CardTitle className="text-sm">Statut & validation</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <ol className="relative space-y-3 max-h-80 overflow-y-auto pr-2">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
              {[
                {
                  id: 'created',
                  label: 'Dépense créée',
                  date: depense.date,
                  icon: BadgeInfo,
                  active: true,
                  actor: 'Vous',
                  role: 'Employé',
                },
                {
                  id: 'submitted',
                  label: 'Soumise pour validation',
                  date: depense.date,
                  icon: Send,
                  active: true,
                  actor: 'Vous',
                  role: 'Employé',
                },
                ...(depense.statutRemboursement === 'demande_info'
                  ? [
                      {
                        id: 'info_requested',
                        label: "Demande d'information",
                        date: depense.date,
                        icon: HelpCircle,
                        active: true,
                        actor: 'Marie Dupont',
                        role: 'Manager',
                      },
                    ]
                  : []),
                {
                  id: 'approved',
                  label: depense.statutRemboursement === 'refuse' ? 'Dépense rejetée' : 'Dépense approuvée',
                  date:
                    depense.statutRemboursement === 'valide' || depense.statutRemboursement === 'paye'
                      ? depense.date
                      : depense.statutRemboursement === 'refuse'
                      ? depense.date
                      : undefined,
                  icon: depense.statutRemboursement === 'refuse' ? XCircle : CheckCircle2,
                  active:
                    depense.statutRemboursement === 'valide' ||
                    depense.statutRemboursement === 'paye' ||
                    depense.statutRemboursement === 'refuse',
                  actor: 'Marie Dupont',
                  role: 'Manager',
                },
                {
                  id: 'paid',
                  label: 'Remboursement effectué',
                  date: depense.statutRemboursement === 'paye' ? depense.date : undefined,
                  icon: Banknote,
                  active: depense.statutRemboursement === 'paye',
                  actor: 'Service Finance',
                  role: 'Finance',
                },
              ].map((step, index, arr) => {
                const IconStep = step.icon;
                const stepDate = step.date ? new Date(step.date) : null;
                const timeLabel = stepDate
                  ? isToday(stepDate)
                    ? `Aujourd'hui · ${format(stepDate, 'HH:mm', { locale: fr })}`
                    : isYesterday(stepDate)
                    ? `Hier · ${format(stepDate, 'HH:mm', { locale: fr })}`
                    : format(stepDate, "dd MMM yyyy", { locale: fr })
                  : null;
                const relativeLabel = stepDate
                  ? formatDistanceToNow(stepDate, { locale: fr, addSuffix: true })
                  : null;
                return (
                  <li key={step.id} className="relative flex gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50/80">
                    <div className="relative flex flex-col items-center">
                      <span
                        className={`flex h-3 w-3 shrink-0 rounded-full border-2 ${
                          step.active
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-300 bg-slate-50'
                        }`}
                      />
                      {index < arr.length - 1 && (
                        <span className="mt-1 flex-1 border-l border-slate-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5 pb-2">
                      {step.active && timeLabel ? (
                        <div className="flex items-center gap-2">
                          <IconStep className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                          <p className="text-[11px] text-slate-500">
                            {timeLabel}
                            {relativeLabel && <span className="ml-1 text-[10px] text-slate-400">({relativeLabel})</span>}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <IconStep className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <p className="text-[11px] text-slate-400">En attente</p>
                        </div>
                      )}
                      <p className={`text-xs font-medium ${step.active ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                      {step.active && (
                        <p className="text-[11px] text-slate-600">
                          {step.actor} <span className="text-slate-400">({step.role})</span>
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* Transaction carte */}
        {transaction && (
          <Card className="gap-0 space-y-0">
            <CardHeader className="border-b border-slate-100 pb-2">
              <CardTitle className="text-sm">Transaction carte</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Montant</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(transaction.montant, 'EUR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-900">
                  {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Marchand</span>
                <span className="font-medium text-slate-900">{transaction.marchand}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Statut rapprochement</span>
                <Badge size="sm" variant="outline">
                  {transaction.statut === 'rapprochee'
                    ? 'Rapprochée'
                    : transaction.statut === 'en_attente_justificatif'
                    ? 'En attente justificatif'
                    : 'Non rapprochée'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

      </aside>
    </div>
  );
};

export default ExpenseDetail;
