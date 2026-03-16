import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Wallet2,
  Clock,
  Briefcase,
  CalendarDays,
  Plus,
  FileText,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Banknote,
  Upload,
  ArrowRight,
  MessageCircle,
  XCircle,
  Send,
  MapPin,
  Users,
  User,
} from 'lucide-react';
import DashboardManager from './DashboardManager';
import { mockUsers, depenses, missions } from '../data/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

const currentUser = mockUsers[1]; // Thomas Leroy (collaborateur)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const Dashboard: FC = () => {
  const navigate = useNavigate();
  // Date fixée pour correspondre aux données mock (janvier 2026)
  const today = useMemo(() => new Date('2026-01-27'), []);
  const [viewMode, setViewMode] = useState<'collaborateur' | 'manager'>('collaborateur');

  const {
    // Stats
    totalMoisCourant,
    variationMois,
    missionsActives,
    // À faire
    demandesInfo,
    brouillons,
    justificatifsManquants,
    // Suivi remboursements
    montantValide,
    // Données
    demandesEnCours,
    missionsEnCours,
    // Timeline
    activites,
  } = useMemo(() => {
    const userDepenses = depenses.filter((d) => d.userId === currentUser.id);
    const userMissions = missions.filter((m) => m.userId === currentUser.id);

    // Stats mois
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const isSameMonth = (dateStr: string, month: number, year: number) => {
      const d = new Date(dateStr);
      return d.getMonth() === month && d.getFullYear() === year;
    };
    const totalMoisCourantValue = userDepenses
      .filter((d) => isSameMonth(d.date, currentMonth, currentYear))
      .reduce((sum, d) => sum + d.montant, 0);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const totalMoisPrecedent = userDepenses
      .filter((d) => isSameMonth(d.date, prevMonth, prevYear))
      .reduce((sum, d) => sum + d.montant, 0);
    const variation =
      totalMoisPrecedent > 0
        ? ((totalMoisCourantValue - totalMoisPrecedent) / totalMoisPrecedent) * 100
        : undefined;

    const missionsActivesValue = userMissions.filter((m) =>
      ['approuvee', 'en_attente'].includes(m.statut),
    ).length;

    // À faire
    const demandesInfoValue = userDepenses.filter((d) => d.statutRemboursement === 'demande_info');
    const brouillonsValue = userDepenses.filter((d) => d.statutRemboursement === 'brouillon');
    const justificatifsManquantsValue = userDepenses.filter(
      (d) => d.statutJustificatif === 'non_fournis' || d.statutJustificatif === 'en_attente',
    ).filter((d) => !d.justificatifUrl);

    // Suivi remboursements
    const montantValideValue = userDepenses
      .filter((d) => d.statutRemboursement === 'valide')
      .reduce((sum, d) => sum + d.montant, 0);

    // Demandes en cours (en_attente uniquement)
    const demandesEnCoursValue = [...userDepenses]
      .filter((d) => d.statutRemboursement === 'en_attente')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Missions en cours
    const missionsEnCoursValue = userMissions.filter((m) =>
      ['approuvee', 'en_attente'].includes(m.statut),
    );

    // Timeline d'activités (mock basé sur les données réelles)
    type Activity = {
      id: string;
      type: 'approved' | 'info_request' | 'rejected' | 'submitted' | 'reimbursed';
      message: string;
      date: Date;
      link?: string;
    };
    const activitesValue: Activity[] = [];

    userDepenses.forEach((d) => {
      if (d.statutRemboursement === 'valide') {
        activitesValue.push({
          id: `act-${d.id}-approved`,
          type: 'approved',
          message: `Dépense « ${d.description} » approuvée (${formatCurrency(d.montant)})`,
          date: new Date(d.date),
          link: `/expenses/${d.id}`,
        });
      }
      if (d.statutRemboursement === 'demande_info') {
        activitesValue.push({
          id: `act-${d.id}-info`,
          type: 'info_request',
          message: `Demande d'information sur « ${d.description} »`,
          date: new Date(d.dateDemandeInfo ?? d.date),
          link: `/expenses/${d.id}`,
        });
      }
      if (d.statutRemboursement === 'refuse') {
        activitesValue.push({
          id: `act-${d.id}-rejected`,
          type: 'rejected',
          message: `Dépense « ${d.description} » refusée`,
          date: new Date(d.date),
          link: `/expenses/${d.id}`,
        });
      }
      if (d.statutRemboursement === 'paye') {
        activitesValue.push({
          id: `act-${d.id}-paid`,
          type: 'reimbursed',
          message: `Remboursement reçu pour « ${d.description} » (${formatCurrency(d.montant)})`,
          date: new Date(d.date),
          link: `/expenses/${d.id}`,
        });
      }
      if (d.statutRemboursement === 'en_attente') {
        activitesValue.push({
          id: `act-${d.id}-submitted`,
          type: 'submitted',
          message: `Dépense « ${d.description} » soumise pour approbation`,
          date: new Date(d.date),
          link: `/expenses/${d.id}`,
        });
      }
    });

    // Activités supplémentaires mock
    const now = new Date();
    activitesValue.push(
      {
        id: 'act-mock-mission-approved',
        type: 'approved',
        message: 'Mission « Salon Tech Berlin » approuvée par Sophie Martin',
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        link: '/missions',
      },
      {
        id: 'act-mock-reimbursed-hotel',
        type: 'reimbursed',
        message: 'Remboursement reçu pour « Hôtel Marriott Paris » (320,00 €)',
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        link: '/expenses',
      },
      {
        id: 'act-mock-submitted-repas',
        type: 'submitted',
        message: 'Dépense « Déjeuner client » soumise pour approbation',
        date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        link: '/expenses',
      },
      {
        id: 'act-mock-approved-taxi',
        type: 'approved',
        message: 'Dépense « Taxi Gare de Lyon » approuvée (45,00 €)',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        link: '/expenses',
      },
      {
        id: 'act-mock-info-parking',
        type: 'info_request',
        message: 'Demande d\'information sur « Parking aéroport CDG »',
        date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        link: '/expenses',
      },
      {
        id: 'act-mock-reimbursed-train',
        type: 'reimbursed',
        message: 'Remboursement reçu pour « TGV Paris-Lyon » (89,00 €)',
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        link: '/expenses',
      },
      {
        id: 'act-mock-rejected-extra',
        type: 'rejected',
        message: 'Dépense « Minibar hôtel » refusée — hors politique',
        date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        link: '/expenses',
      },
      {
        id: 'act-mock-submitted-fournitures',
        type: 'submitted',
        message: 'Dépense « Fournitures bureau » soumise pour approbation',
        date: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
        link: '/expenses',
      },
      {
        id: 'act-mock-mission-created',
        type: 'submitted',
        message: 'Mission « Formation React Avancé » créée et soumise',
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        link: '/missions',
      },
      {
        id: 'act-mock-approved-repas2',
        type: 'approved',
        message: 'Dépense « Dîner équipe projet » approuvée (185,00 €)',
        date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        link: '/expenses',
      },
    );

    activitesValue.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      totalMoisCourant: totalMoisCourantValue,
      variationMois: variation,
      missionsActives: missionsActivesValue,
      demandesInfo: demandesInfoValue,
      brouillons: brouillonsValue,
      justificatifsManquants: justificatifsManquantsValue,
      montantValide: montantValideValue,
      demandesEnCours: demandesEnCoursValue,
      missionsEnCours: missionsEnCoursValue,
      activites: activitesValue.slice(0, 15),
    };
  }, [today]);

  const formatShortDate = (dateStr: string) =>
    format(new Date(dateStr), 'dd MMM', { locale: fr });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return { label: 'Brouillon', variant: 'neutral' as const };
      case 'en_attente':
        return { label: 'En attente', variant: 'warning' as const };
      case 'valide':
        return { label: 'Approuvée', variant: 'success' as const };
      case 'paye':
        return { label: 'Remboursée', variant: 'success' as const };
      case 'refuse':
        return { label: 'Refusée', variant: 'danger' as const };
      case 'demande_info':
        return { label: "Demande d'info", variant: 'info' as const };
      default:
        return { label: statut, variant: 'neutral' as const };
    }
  };

  const activityIcon = (type: string) => {
    switch (type) {
      case 'approved': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'info_request': return <HelpCircle className="h-3.5 w-3.5 text-amber-500" />;
      case 'rejected': return <XCircle className="h-3.5 w-3.5 text-rose-500" />;
      case 'submitted': return <Send className="h-3.5 w-3.5 text-blue-500" />;
      case 'reimbursed': return <Banknote className="h-3.5 w-3.5 text-emerald-600" />;
      default: return <Clock className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const totalAFaire = demandesInfo.length + brouillons.length + justificatifsManquants.length;

  const variationLabel =
    variationMois === undefined
      ? 'Nouveau ce mois-ci'
      : `${variationMois >= 0 ? '+' : ''}${variationMois.toFixed(0)} % vs mois précédent`;

  return (
    <div className="space-y-6">

      {/* Toggle Collaborateur / Manager */}
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        <button
          type="button"
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            viewMode === 'collaborateur'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setViewMode('collaborateur')}
        >
          <User className="h-4 w-4" />
          Mon dashboard
        </button>
        <button
          type="button"
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            viewMode === 'manager'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setViewMode('manager')}
        >
          <Users className="h-4 w-4" />
          Dashboard équipe
        </button>
      </div>

      {viewMode === 'manager' ? (
        <DashboardManager />
      ) : (
      <>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <Wallet2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">À rembourser</p>
                <p className="text-2xl font-semibold tracking-tight text-slate-900">
                  {formatCurrency(montantValide || 0)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">{variationLabel}</p>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Dépenses en attente
              </p>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                {depenses.filter((d) => d.userId === currentUser.id && d.statutRemboursement === 'en_attente').length}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            En attente d&apos;approbation par votre manager.
          </p>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Missions actives</p>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                {missionsActives}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Missions approuvées ou en attente à venir.
          </p>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Dépensé ce mois</p>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                {formatCurrency(totalMoisCourant || 0)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Inclut vos dépenses rattachées à une mission.
          </p>
        </Card>
      </section>

      {/* Actions rapides */}
      <section className="flex flex-wrap gap-3">
        <Button
          size="md"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('/expenses/new')}
        >
          Nouvelle dépense
        </Button>
        <Button
          size="md"
          variant="secondary"
          leftIcon={<Briefcase className="h-4 w-4" />}
          onClick={() => navigate('/missions/new')}
        >
          Créer une mission
        </Button>
        <Button
          size="md"
          variant="secondary"
          leftIcon={<Upload className="h-4 w-4" />}
          onClick={() => navigate('/expenses/new')}
        >
          Scanner un justificatif
        </Button>
      </section>

      {/* Section "À faire" */}
      {totalAFaire > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-900">
              À faire ({totalAFaire})
            </h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {demandesInfo.length > 0 && (
              <button
                type="button"
                className="flex items-center gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-amber-300 hover:bg-amber-50"
                onClick={() => navigate('/expenses')}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <HelpCircle className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {demandesInfo.length} demande{demandesInfo.length > 1 ? 's' : ''} d'information
                  </p>
                  <p className="text-[10px] text-slate-500">L'approbateur attend votre réponse</p>
                </div>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
              </button>
            )}
            {brouillons.length > 0 && (
              <button
                type="button"
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
                onClick={() => navigate('/expenses')}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <FileText className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {brouillons.length} brouillon{brouillons.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-slate-500">Non encore soumis</p>
                </div>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
              </button>
            )}
            {justificatifsManquants.length > 0 && (
              <button
                type="button"
                className="flex items-center gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-amber-300 hover:bg-amber-50"
                onClick={() => navigate('/expenses')}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Upload className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {justificatifsManquants.length} justificatif{justificatifsManquants.length > 1 ? 's' : ''} manquant{justificatifsManquants.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-slate-500">À ajouter à vos dépenses</p>
                </div>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </section>
      )}

      {/* Deux colonnes : Demandes en cours + Timeline */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Colonne gauche : Demandes en cours */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="border-b-0 pb-0">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Mes demandes en cours</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary-700 px-0"
                  onClick={() => navigate('/expenses')}
                >
                  Voir tout →
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {demandesEnCours.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Aucune demande en cours.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demandesEnCours.map((depense) => {
                      const statutInfo = getStatutBadge(depense.statutRemboursement);
                      return (
                        <TableRow
                          key={depense.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/expenses/${depense.id}`)}
                        >
                          <TableCell>{formatShortDate(depense.date)}</TableCell>
                          <TableCell className="max-w-xs truncate text-slate-800">
                            {depense.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="neutral" size="sm">
                              {depense.categorie}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900">
                            {formatCurrency(depense.montant)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statutInfo.variant} size="sm">
                              {statutInfo.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Missions en cours */}
          {missionsEnCours.length > 0 && (
            <Card>
              <CardHeader className="border-b-0 pb-0">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Missions en cours</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary-700 px-0"
                    onClick={() => navigate('/missions')}
                  >
                    Voir tout →
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mission</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Dépensé / Budget</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missionsEnCours.map((mission) => {
                      const statutMission = mission.statut === 'approuvee'
                        ? { label: 'Approuvée', variant: 'success' as const }
                        : { label: 'En attente', variant: 'warning' as const };
                      return (
                        <TableRow
                          key={mission.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/missions/${mission.id}`)}
                        >
                          <TableCell className="font-medium text-slate-900">
                            {mission.titre}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-slate-600">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {mission.destination.split(',')[0]}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {formatShortDate(mission.dateDebut)} – {formatShortDate(mission.dateFin)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statutMission.variant} size="sm">
                              {statutMission.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900">
                            {mission.budgetAlloue != null ? (
                              <>
                                {formatCurrency(mission.depense)}
                                <span className="font-normal text-slate-400"> / {formatCurrency(mission.budgetAlloue)}</span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne droite : Timeline activités (sticky) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
            <CardHeader className="border-b-0 pb-1">
              <CardTitle>Dernières activités</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 overflow-y-auto flex-1">
              {activites.length === 0 ? (
                <p className="text-xs text-slate-500">Aucune activité récente.</p>
              ) : (
                <ol className="relative space-y-3">
                  <div className="absolute left-[11px] top-1 bottom-1 w-px bg-slate-200" />
                  {activites.map((act) => (
                    <li key={act.id} className="relative pl-8">
                      <div className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200">
                        {activityIcon(act.type)}
                      </div>
                      <button
                        type="button"
                        className="text-left w-full"
                        onClick={() => act.link && navigate(act.link)}
                      >
                        <p className="text-[11px] text-slate-700 leading-relaxed">{act.message}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatDistanceToNow(act.date, { addSuffix: true, locale: fr })}
                        </p>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      </>
      )}
    </div>
  );
};

export default Dashboard;
