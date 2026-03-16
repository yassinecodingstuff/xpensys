import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Car,
  Hotel,
  Utensils,
  Gauge,
  Train,
  Plane,
  ParkingSquare,
  Receipt,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  HelpCircle,
  FileEdit,
} from 'lucide-react';
import { depenses, missions, categoriesDepense, getFlagLabel } from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

type TabKey = 'all' | 'missing_receipt' | 'draft' | 'pending' | 'approved' | 'rejected' | 'info_requested';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const categoryIconMap: Record<string, FC<{ className?: string }>> = {
  Transport: Car,
  Hôtel: Hotel,
  Hotel: Hotel,
  Hébergement: Hotel,
  Restaurant: Utensils,
  Repas: Utensils,
  'Frais kilométriques': Gauge,
  Train: Train,
  Vol: Plane,
  Taxi: Car,
  Parking: ParkingSquare,
  'Indemnité journalière': CalendarIcon,
};

const statusConfig = {
  brouillon: { label: 'Brouillon', variant: 'neutral' as const, Icon: FileEdit },
  en_attente: { label: 'En attente', variant: 'warning' as const, Icon: Clock },
  valide: { label: 'Approuvée', variant: 'success' as const, Icon: CheckCircle2 },
  refuse: { label: 'Rejetée', variant: 'danger' as const, Icon: XCircle },
  demande_info: { label: "Demande d'info", variant: 'neutral' as const, Icon: HelpCircle },
  paye: { label: 'Remboursée', variant: 'success' as const, Icon: CheckCircle2 },
};

const ExpensesList: FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const today = useMemo(() => new Date(), []);

  const { filtered, totalCount, totalAmountMonth } = useMemo(() => {
    const month = today.getMonth();
    const year = today.getFullYear();

    const isSameMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === month && d.getFullYear() === year;
    };

    let base = depenses;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      base = base.filter(
        (d) =>
          d.description?.toLowerCase().includes(query) ||
          d.categorie.toLowerCase().includes(query)
      );
    }

    const withTab = base.filter((d) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'missing_receipt') return d.statutJustificatif === 'non_fournis';
      if (activeTab === 'draft') return d.statutRemboursement === 'brouillon';
      if (activeTab === 'pending') return d.statutRemboursement === 'en_attente';
      if (activeTab === 'approved') return d.statutRemboursement === 'valide';
      if (activeTab === 'rejected') return d.statutRemboursement === 'refuse';
      if (activeTab === 'info_requested') return d.statutRemboursement === 'demande_info';
      return true;
    });

    const totalAmountMonthValue = depenses
      .filter((d) => isSameMonth(d.date))
      .reduce((sum, d) => sum + d.montant, 0);

    // Trier par date décroissante
    const sorted = [...withTab].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return {
      filtered: sorted,
      totalCount: depenses.length,
      totalAmountMonth: totalAmountMonthValue,
    };
  }, [activeTab, searchQuery, today]);

  const missionsMap = useMemo(
    () => new Map(missions.map((m) => [m.id, m])),
    []
  );

  const tabCounts = useMemo(() => {
    let missing = 0;
    let draft = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let infoRequested = 0;
    depenses.forEach((d) => {
      if (d.statutJustificatif === 'non_fournis') missing += 1;
      if (d.statutRemboursement === 'brouillon') draft += 1;
      if (d.statutRemboursement === 'en_attente') pending += 1;
      if (d.statutRemboursement === 'valide') approved += 1;
      if (d.statutRemboursement === 'refuse') rejected += 1;
      if (d.statutRemboursement === 'demande_info') infoRequested += 1;
    });
    return { missing, draft, pending, approved, rejected, infoRequested };
  }, []);

  const statsLabel = useMemo(() => {
    const label = `${totalCount} dépense${totalCount > 1 ? 's' : ''}`;
    const amount = formatCurrency(totalAmountMonth);
    return `${label} · ${amount} ce mois`;
  }, [totalCount, totalAmountMonth]);

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Mes dépenses
          </h1>
          <p className="mt-1 text-xs text-slate-500">{statsLabel}</p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => navigate('/expenses/new')}
        >
          Nouvelle dépense
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-full bg-slate-50 p-1 text-[11px]">
        <button
          type="button"
          className={`rounded-full px-3 py-1 ${
            activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setActiveTab('all')}
        >
          Toutes
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 flex items-center gap-1 ${
            activeTab === 'missing_receipt'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500'
          }`}
          onClick={() => setActiveTab('missing_receipt')}
        >
          Justificatif manquant
          {tabCounts.missing > 0 && (
            <span className="inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-medium text-amber-700">
              {tabCounts.missing}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 flex items-center gap-1 ${
            activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          En attente
          {tabCounts.pending > 0 && (
            <span className="inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-medium text-amber-700">
              {tabCounts.pending}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 ${
            activeTab === 'approved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setActiveTab('approved')}
        >
          Approuvées
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 ${
            activeTab === 'rejected' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejetées
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 flex items-center gap-1 ${
            activeTab === 'info_requested' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
          onClick={() => setActiveTab('info_requested')}
        >
          Demande d'info
          {tabCounts.infoRequested > 0 && (
            <span className="inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full bg-purple-100 px-1 text-[10px] font-medium text-purple-700">
              {tabCounts.infoRequested}
            </span>
          )}
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
              <p className="font-medium text-slate-600">Recherche</p>
              <Input
                type="search"
                placeholder="Description, catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-3.5 w-3.5 text-slate-400" />}
                className="text-[11px]"
              />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-600">Période</p>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700">
                <option>Ce mois</option>
                <option>Mois dernier</option>
                <option>Ce trimestre</option>
                <option>Cette année</option>
              </select>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-600">Catégorie</p>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700">
                <option value="">Toutes</option>
                {categoriesDepense.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-600">Mission</p>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700">
                <option value="">Toutes</option>
                {missions.slice(0, 10).map((m) => (
                  <option key={m.id} value={m.id}>{m.titre}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table des dépenses */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5">Dépense</th>
                <th className="px-4 py-2.5">Catégorie</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Mission</th>
                <th className="px-4 py-2.5 text-right">Montant</th>
                <th className="px-4 py-2.5">Statut</th>
                <th className="px-4 py-2.5">Alertes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((d) => {
                const mission = d.missionId ? missionsMap.get(d.missionId) : undefined;
                const CatIcon = categoryIconMap[d.categorie] ?? Receipt;
                const status = statusConfig[d.statutRemboursement] ?? statusConfig.en_attente;
                const StatusIcon = status.Icon;
                const createdAt = new Date(d.date);
                const missingReceipt = d.statutJustificatif === 'non_fournis';
                const hasFlags = d.flags && d.flags.length > 0;

                return (
                  <tr
                    key={d.id}
                    className="group transition-colors hover:bg-slate-50/80 cursor-pointer"
                    onClick={() => navigate(`/expenses/${d.id}`)}
                  >
                    {/* Dépense */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 truncate max-w-[200px]">
                        {d.description || d.categorie}
                      </p>
                    </td>

                    {/* Catégorie */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <CatIcon className="h-3 w-3 text-slate-600" />
                        </div>
                        <span className="text-slate-600">{d.categorie}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {format(createdAt, 'dd MMM yyyy', { locale: fr })}
                    </td>

                    {/* Mission */}
                    <td className="px-4 py-3">
                      {mission ? (
                        <span className="font-medium text-primary-600 truncate max-w-[150px] block">
                          {mission.titre}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Montant */}
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(d.montant)}
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3">
                      <Badge size="sm" variant={status.variant}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </td>

                    {/* Alertes */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {missingReceipt && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Justificatif
                          </span>
                        )}
                        {hasFlags && d.flags.slice(0, 1).map((flag) => (
                          <span
                            key={flag}
                            className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700"
                          >
                            {getFlagLabel(flag)}
                          </span>
                        ))}
                        {!missingReceipt && !hasFlags && (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-[11px] text-slate-500">
              Aucune dépense ne correspond à vos critères.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ExpensesList;
