import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MoreHorizontal, Plus, MapPin, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { missions } from '../../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';

type ViewMode = 'cards' | 'table';

type SortKey = 'titre' | 'destination' | 'date' | 'budgetAlloue' | 'depense' | 'statut';
type SortDirection = 'asc' | 'desc';

const STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  en_attente: 'En attente',
  approuvee: 'Approuvée',
  rejetee: 'Rejetée',
  remboursee: 'Remboursée',
};

const getStatusVariant = (statut: string) => {
  switch (statut) {
    case 'brouillon':
      return 'neutral' as const;
    case 'en_attente':
      return 'warning' as const;
    case 'approuvee':
      return 'info' as const;
    case 'remboursee':
      return 'success' as const;
    case 'rejetee':
      return 'danger' as const;
    default:
      return 'neutral' as const;
  }
};

const formatDateRange = (start: string, end: string) =>
  `${format(new Date(start), 'dd MMM', { locale: fr })} – ${format(
    new Date(end),
    'dd MMM',
    { locale: fr },
  )}`;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const MissionsList: FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | keyof typeof STATUS_LABELS>('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filteredMissions = useMemo(() => {
    let list = [...missions];

    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.titre.toLowerCase().includes(query) ||
          m.destination.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((m) => m.statut === statusFilter);
    }

    if (dateStart) {
      const start = new Date(dateStart);
      list = list.filter((m) => new Date(m.dateFin) >= start);
    }

    if (dateEnd) {
      const end = new Date(dateEnd);
      list = list.filter((m) => new Date(m.dateDebut) <= end);
    }

    list.sort((a, b) => {
      const factor = sortDirection === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'titre':
          return factor * a.titre.localeCompare(b.titre);
        case 'destination':
          return factor * a.destination.localeCompare(b.destination);
        case 'budgetAlloue':
          return factor * ((a.budgetAlloue ?? 0) - (b.budgetAlloue ?? 0));
        case 'depense':
          return factor * (a.depense - b.depense);
        case 'statut':
          return factor * a.statut.localeCompare(b.statut);
        case 'date':
        default:
          return (
            factor *
            (new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
          );
      }
    });

    return list;
  }, [search, statusFilter, dateStart, dateEnd, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredMissions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedMissions =
    view === 'table'
      ? filteredMissions.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : filteredMissions;

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateStart('');
    setDateEnd('');
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Mes missions
          </h1>
          <p className="text-xs text-slate-500">
            Suivez vos missions, leur budget et leur avancement.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('/missions/new')}
        >
          Nouvelle mission
        </Button>
      </div>

      {/* Filtres */}
      <Card className="flex flex-col gap-3 border-slate-100 bg-white/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une mission (titre, destination...)"
              leftIcon={
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.16667 14.1667C11.744 14.1667 13.8333 12.0774 13.8333 9.50004C13.8333 6.92271 11.744 4.83337 9.16667 4.83337C6.58934 4.83337 4.5 6.92271 4.5 9.50004C4.5 12.0774 6.58934 14.1667 9.16667 14.1667Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.5 15.5L12.875 12.875"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-3 md:justify-end">
            <div className="w-full min-w-[160px] md:w-auto">
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | keyof typeof STATUS_LABELS)
                }
                label="Statut"
              >
                <option value="all">Tous</option>
                <option value="brouillon">Brouillon</option>
                <option value="en_attente">En attente</option>
                <option value="approuvee">Approuvée</option>
                <option value="remboursee">Remboursée</option>
                <option value="rejetee">Rejetée</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32">
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  label="Début"
                />
              </div>
              <div className="w-32">
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  label="Fin"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-600"
              onClick={resetFilters}
            >
              Réinitialiser
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 text-xs text-slate-500">
          <p>
            {filteredMissions.length} mission
            {filteredMissions.length > 1 ? 's' : ''} trouvée
            {filteredMissions.length > 1 ? 's' : ''}.
          </p>
          <div className="inline-flex items-center rounded-full bg-slate-100 p-0.5">
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                view === 'cards'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
              onClick={() => setView('cards')}
            >
              Cards
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                view === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
              onClick={() => setView('table')}
            >
              Table
            </button>
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {filteredMissions.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">
              Aucune mission pour le moment
            </p>
            <p className="text-xs text-slate-500 max-w-md">
              Créez votre première mission pour suivre facilement vos déplacements, votre
              budget et vos dépenses associées.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/missions/new')}
          >
            Créer ma première mission
          </Button>
        </Card>
      )}

      {/* Vue cards */}
      {filteredMissions.length > 0 && view === 'cards' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMissions.map((mission) => {
            const ratio =
              mission.budgetAlloue && mission.budgetAlloue > 0
                ? mission.depense / mission.budgetAlloue
                : 0;
            const pct = Math.round(Math.min(ratio * 100, 120));
            const color =
              !mission.budgetAlloue || ratio === 0
                ? 'bg-slate-300'
                : ratio < 0.8
                ? 'bg-emerald-500'
                : ratio <= 1
                ? 'bg-amber-500'
                : 'bg-rose-500';

            return (
              <Link
                key={mission.id}
                to={`/missions/${mission.id}`}
                className="block"
              >
                <Card
                  variant="interactive"
                  className="relative cursor-pointer"
                >
                  <div className="absolute right-4 top-4 flex items-center gap-2">
                    <Badge variant={getStatusVariant(mission.statut)} size="sm">
                      {STATUS_LABELS[mission.statut] ?? mission.statut}
                    </Badge>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      aria-label="Plus d'options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                <div className="space-y-2 pr-16">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {mission.titre}
                  </h2>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {mission.destination}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {formatDateRange(mission.dateDebut, mission.dateFin)}
                  </p>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{formatCurrency(mission.depense)} dépensés</span>
                    <span>
                      Budget{' '}
                      {mission.budgetAlloue != null
                        ? formatCurrency(mission.budgetAlloue)
                        : 'en attente'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200">
                    <div
                      className={`h-1.5 rounded-full transition-all ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {mission.categoriesDemandees?.map((cat) => (
                    <Badge key={cat} variant="neutral" size="sm">
                      {cat}
                    </Badge>
                  ))}
                </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Vue table */}
      {filteredMissions.length > 0 && view === 'table' && (
        <Card>
          <CardContent className="pt-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('titre')}
                  >
                    Mission{sortIndicator('titre')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('destination')}
                  >
                    Destination{sortIndicator('destination')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    Dates{sortIndicator('date')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort('budgetAlloue')}
                  >
                    Budget alloué{sortIndicator('budgetAlloue')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort('depense')}
                  >
                    Dépensé{sortIndicator('depense')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('statut')}
                  >
                    Statut{sortIndicator('statut')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMissions.map((mission) => (
                    <TableRow
                      key={mission.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/missions/${mission.id}`)}
                    >
                    <TableCell className="max-w-xs truncate">
                      <span className="text-sm font-medium text-slate-900">
                        {mission.titre}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {mission.destination}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDateRange(mission.dateDebut, mission.dateFin)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-slate-900">
                      {mission.budgetAlloue != null
                        ? formatCurrency(mission.budgetAlloue)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-800">
                      {formatCurrency(mission.depense)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(mission.statut)} size="sm">
                        {STATUS_LABELS[mission.statut] ?? mission.statut}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination */}
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
              <p>
                Page {currentPage} sur {totalPages}
              </p>
              <div className="inline-flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2"
                >
                  Précédent
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2"
                >
                  Suivant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MissionsList;

