import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  XCircle,
} from 'lucide-react';
import {
  demandesApprobation,
  mockUsers,
  missions,
  depenses,
  type DemandeApprobation,
  type Mission,
  type Depense,
} from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

type TabKey = 'pending' | 'recent' | 'all';

interface EnrichedRequest {
  demande: DemandeApprobation;
  demandeurName: string;
  mission?: Mission;
  depense?: Depense;
  montant?: number;
  ageHours: number;
  summary: string;
  flags: string[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const ApprovalQueue: FC = () => {
  const navigate = useNavigate();
  const approbateurId = 'user-006'; // Jean Martin (manager) – simulé
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mission' | 'avance' | 'depense'>('all');
  const [ageFilter, setAgeFilter] = useState<'all' | '24h' | '48h' | '1w'>('all');
  const [amountFilter, setAmountFilter] = useState<'all' | '<100' | '100-500' | '>500'>('all');
  const [requesterFilter, setRequesterFilter] = useState<string>('all');

  const [quickApproveOpen, setQuickApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EnrichedRequest | null>(null);
  const [approveComment, setApproveComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const usersMap = useMemo(
    () =>
      new Map(
        mockUsers.map((u) => [
          u.id,
          u,
        ]),
      ),
    [],
  );

  const missionsMap = useMemo(
    () =>
      new Map(
        missions.map((m) => [
          m.id,
          m,
        ]),
      ),
    [],
  );

  const depensesMap = useMemo(
    () =>
      new Map(
        depenses.map((d) => [
          d.id,
          d,
        ]),
      ),
    [],
  );

  const depensesByMission = useMemo(() => {
    const map = new Map<string, number>();
    depenses.forEach((d) => {
      if (!d.missionId) return;
      map.set(d.missionId, (map.get(d.missionId) ?? 0) + d.montant);
    });
    return map;
  }, []);

  const enriched = useMemo<EnrichedRequest[]>(() => {
    const now = new Date();

    return demandesApprobation
      .filter((d) => d.approbateurId === approbateurId)
      .map((demande) => {
        const user = usersMap.get(demande.demandeurId);
        const demandeurName = user ? `${user.prenom} ${user.nom}` : 'Collaborateur';

        const createdAt = new Date(demande.dateCreation);
        const ageMs = now.getTime() - createdAt.getTime();
        const ageHours = ageMs / (1000 * 60 * 60);

        let mission: Mission | undefined;
        let montant: number | undefined;
        let summary = '';
        const flags: string[] = [];

        if (demande.type === 'mission') {
          mission = missionsMap.get(demande.entityId);
          if (mission) {
            montant = mission.budgetAlloue ?? depensesByMission.get(mission.id) ?? undefined;
            const days =
              (new Date(mission.dateFin).getTime() - new Date(mission.dateDebut).getTime()) /
                (1000 * 60 * 60 * 24) +
              1;
            summary = `${mission.destination.split(',')[0]}, ${Math.max(
              1,
              Math.round(days),
            )} jours, Budget ${montant ? formatCurrency(montant) : '—'}`;
          }
        } else if (demande.type === 'avance') {
          mission = missionsMap.get(demande.entityId);
          montant = 200; // Montant typique avance; en prod viendrait de data.amount
          const missionTitle = mission?.titre;
          summary = `${formatCurrency(montant)}${missionTitle ? ` pour ${missionTitle}` : ''}`;
        } else if (demande.type === 'depense') {
          const depense = depensesMap.get(demande.entityId);
          if (depense) {
            montant = depense.montant;
            summary = `${depense.categorie} · ${formatCurrency(depense.montant)}${depense.description ? ` · ${depense.description}` : ''}`;
          }
        }

        if (ageHours > 48 && demande.statut === 'en_attente') {
          flags.push('urgent');
        }

        let depense: Depense | undefined;
        if (demande.type === 'depense') {
          depense = depensesMap.get(demande.entityId);
        }

        return {
          demande,
          demandeurName,
          mission,
          depense,
          montant,
          ageHours,
          summary,
          flags,
        };
      });
  }, [approbateurId, demandesApprobation, usersMap, missionsMap, depensesMap, depensesByMission]);

  const { filtered, pendingCount, avgAgeDays } = useMemo(() => {
    const pending = enriched.filter((e) => e.demande.statut === 'en_attente');
    const pendingCount = pending.length;

    const avgAgeDays =
      pendingCount > 0
        ? pending.reduce((sum, e) => sum + e.ageHours / 24, 0) / pendingCount
        : 0;

    let base = enriched;
    if (activeTab === 'pending') {
      base = enriched.filter((e) => e.demande.statut === 'en_attente');
    } else if (activeTab === 'recent') {
      base = [...enriched]
        .filter((e) => e.demande.statut !== 'en_attente')
        .sort(
          (a, b) =>
            new Date(b.demande.dateCreation).getTime() -
            new Date(a.demande.dateCreation).getTime(),
        )
        .slice(0, 20);
    }

    // Filtres
    base = base.filter((e) => {
      if (typeFilter !== 'all' && e.demande.type !== typeFilter) return false;
      if (requesterFilter !== 'all' && e.demande.demandeurId !== requesterFilter) return false;

      if (ageFilter === '24h' && e.ageHours < 24) return false;
      if (ageFilter === '48h' && e.ageHours < 48) return false;
      if (ageFilter === '1w' && e.ageHours < 24 * 7) return false;

      if (amountFilter !== 'all' && e.montant != null) {
        if (amountFilter === '<100' && e.montant >= 100) return false;
        if (amountFilter === '100-500' && (e.montant < 100 || e.montant > 500)) return false;
        if (amountFilter === '>500' && e.montant <= 500) return false;
      }

      return true;
    });

    return { filtered: base, pendingCount, avgAgeDays };
  }, [enriched, activeTab, typeFilter, requesterFilter, ageFilter, amountFilter]);

  const teamRequesters = useMemo(
    () =>
      Array.from(
        new Set(
          enriched.map((e) => e.demande.demandeurId),
        ),
      )
        .map((id) => usersMap.get(id))
        .filter((u): u is NonNullable<typeof u> => Boolean(u)),
    [enriched, usersMap],
  );

  const openQuickApprove = (req: EnrichedRequest) => {
    setSelectedRequest(req);
    setApproveComment('');
    setQuickApproveOpen(true);
  };

  const openReject = (req: EnrichedRequest) => {
    setSelectedRequest(req);
    setRejectReason('');
    setRejectOpen(true);
  };

  const closeModals = () => {
    setQuickApproveOpen(false);
    setRejectOpen(false);
    setSelectedRequest(null);
  };

  const handleConfirmApprove = () => {
    // Ici on ferait un appel API pour approuver.
    closeModals();
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    // Ici on ferait un appel API pour rejeter.
    closeModals();
  };

  const pendingLabel =
    pendingCount === 0
      ? 'Aucune demande en attente'
      : `${pendingCount} demande${pendingCount > 1 ? 's' : ''} en attente`;

  const avgLabel =
    avgAgeDays > 0 ? `${avgAgeDays.toFixed(1)} jours` : '—';

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Approbations
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {pendingLabel} · Temps moyen : {avgLabel}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-full bg-slate-50 p-1 text-[11px]">
        <button
          type="button"
          className={`rounded-full px-3 py-1 ${
            activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          À traiter
          {pendingCount > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-100 px-1 text-[10px] font-medium text-rose-700">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 ${
            activeTab === 'recent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setActiveTab('recent')}
        >
          Traitées récemment
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 ${
            activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setActiveTab('all')}
        >
          Toutes
        </button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-2">
          <CardTitle className="text-sm">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-[11px]">
            <div className="space-y-1">
              <p className="font-medium text-slate-600">Type</p>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              >
                <option value="all">Tous</option>
                <option value="mission">Missions</option>
                <option value="depense">Dépenses</option>
                <option value="avance">Avances</option>
              </select>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-600">Demandeur</p>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700"
                value={requesterFilter}
                onChange={(e) => setRequesterFilter(e.target.value)}
              >
                <option value="all">Toute l&apos;équipe</option>
                {teamRequesters.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-600">Ancienneté</p>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700"
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value as typeof ageFilter)}
              >
                <option value="all">Toutes</option>
                <option value="24h">&gt; 24h</option>
                <option value="48h">&gt; 48h</option>
                <option value="1w">&gt; 1 semaine</option>
              </select>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-600">Montant</p>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700"
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value as typeof amountFilter)}
              >
                <option value="all">Toutes tranches</option>
                <option value="<100">&lt; 100 €</option>
                <option value="100-500">100–500 €</option>
                <option value=">500">&gt; 500 €</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table des demandes */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5">Demandeur</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Objet</th>
                <th className="px-4 py-2.5">Résumé</th>
                <th className="px-4 py-2.5 text-right">Montant</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Alerte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((r) => {
                const { demande, demandeurName, mission, depense, summary, montant } = r;
                const urgent = r.flags.includes('urgent');

                const typeLabel =
                  demande.type === 'mission'
                    ? 'Mission'
                    : demande.type === 'depense'
                    ? 'Dépense'
                    : 'Avance';

                const typeBadgeVariant =
                  demande.type === 'mission'
                    ? ('info' as const)
                    : demande.type === 'depense'
                    ? ('neutral' as const)
                    : ('success' as const);

                const objet =
                  demande.type === 'mission'
                    ? mission?.titre ?? 'Mission'
                    : demande.type === 'depense'
                    ? depense
                      ? `${depense.categorie} – ${depense.description}`
                      : 'Dépense'
                    : "Demande d'avance";

                const createdAt = demande.dateCreation ? new Date(demande.dateCreation) : null;
                const anciennete =
                  createdAt && !Number.isNaN(createdAt.getTime())
                    ? formatDistanceToNow(createdAt, { addSuffix: true, locale: fr })
                    : '—';

                return (
                  <tr
                    key={demande.id}
                    className="group transition-colors hover:bg-slate-50/80 cursor-pointer"
                    onClick={() => navigate(`/approvals/${demande.id}`)}
                  >
                    {/* Demandeur */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={demandeurName} id={demande.demandeurId} size="sm" />
                        <span className="font-medium text-slate-900 whitespace-nowrap">{demandeurName}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <Badge size="sm" variant={typeBadgeVariant}>
                        {typeLabel}
                      </Badge>
                    </td>

                    {/* Objet */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800 truncate max-w-[180px] block">{objet}</span>
                    </td>

                    {/* Résumé */}
                    <td className="px-4 py-3">
                      <span className="text-slate-600 truncate max-w-[200px] block">{summary}</span>
                    </td>

                    {/* Montant */}
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {montant != null ? formatCurrency(montant) : '—'}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <div>
                        {createdAt && !Number.isNaN(createdAt.getTime())
                          ? format(createdAt, 'dd MMM yyyy', { locale: fr })
                          : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400">{anciennete}</div>
                    </td>

                    {/* Alerte */}
                    <td className="px-4 py-3">
                      {urgent ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Urgent
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-[11px] text-slate-500">
              Aucune demande ne correspond à vos filtres.
            </div>
          )}
        </div>
      </Card>

      {/* Modal approbation rapide */}
      {quickApproveOpen && selectedRequest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 text-xs text-slate-700 shadow-lg">
            <h2 className="text-sm font-semibold text-slate-900">Approbation rapide</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Vous êtes sur le point d&apos;approuver la demande suivante :
            </p>
            <div className="mt-3 space-y-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px]">
              <p className="font-medium text-slate-900">{selectedRequest.demandeurName}</p>
              <p className="text-slate-600">{selectedRequest.summary}</p>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-[11px] font-medium text-slate-600">Commentaire (optionnel)</p>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                placeholder="Ajoutez un message pour le demandeur..."
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
              />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={closeModals}>
                Annuler
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleConfirmApprove}
              >
                Confirmer l&apos;approbation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal rejet */}
      {rejectOpen && selectedRequest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 text-xs text-slate-700 shadow-lg">
            <h2 className="text-sm font-semibold text-slate-900">Rejeter la demande</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Veuillez préciser le motif du rejet. Ce champ est obligatoire.
            </p>
            <div className="mt-3 space-y-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px]">
              <p className="font-medium text-slate-900">{selectedRequest.demandeurName}</p>
              <p className="text-slate-600">{selectedRequest.summary}</p>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-[11px] font-medium text-slate-600">Motif du rejet</p>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              >
                <option value="">Sélectionner un motif...</option>
                <option value="justificatif_manquant">Justificatif manquant ou illisible</option>
                <option value="hors_politique">Dépense hors politique de remboursement</option>
                <option value="montant_incorrect">Montant incorrect ou incohérent</option>
                <option value="autre">Autre (détailler dans le commentaire)</option>
              </select>
              {rejectReason === 'autre' && (
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                  placeholder="Détaillez le motif du rejet..."
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                />
              )}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={closeModals}>
                Annuler
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={!rejectReason}
                onClick={handleConfirmReject}
              >
                Confirmer le rejet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;

