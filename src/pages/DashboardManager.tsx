import type { FC } from 'react';
import { useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  PieChart,
  Wallet2,
  ShieldCheck,
  ClipboardList,
  Users,
  XCircle,
  Send,
  HelpCircle,
  Banknote,
  Clock,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  mockUsers,
  depenses,
  missions,
  demandesApprobation,
  categoriesDepense,
} from '../data/mockData';
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

const manager = mockUsers.find((u) => u.id === 'user-006')!; // Jean Martin (Manager)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const DashboardManager: FC = () => {
  const navigate = useNavigate();
  // Date fixée pour correspondre aux données mock (janvier 2026)
  const today = useMemo(() => new Date('2026-01-27'), []);

  const {
    demandesEnAttente,
    budgetConsomme,
    budgetAlloue,
    depensesEquipeMois,
    tauxConformite,
    approUrgentes,
    chartData,
    activitesManager,
  } = useMemo(() => {
    const teamMembersValue = mockUsers.filter(
      (u) => u.id === manager.id || u.managerId === manager.id,
    );
    const teamIds = teamMembersValue.map((m) => m.id);

    const demandesEnAttenteValue = demandesApprobation.filter(
      (d) => d.approbateurId === manager.id && d.statut === 'en_attente',
    );

    const missionsEquipe = missions.filter((m) => teamIds.includes(m.userId));
    const budgetAlloueValue = missionsEquipe.reduce(
      (sum, m) => sum + (m.budgetAlloue ?? 0),
      0,
    );

    const depensesEquipe = depenses.filter((d) => teamIds.includes(d.userId));
    const budgetConsommeValue = depensesEquipe.reduce(
      (sum, d) => sum + d.montant,
      0,
    );

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const isSameMonth = (dateStr: string, month: number, year: number) => {
      const d = new Date(dateStr);
      return d.getMonth() === month && d.getFullYear() === year;
    };

    const depensesEquipeMoisValue = depensesEquipe.filter((d) =>
      isSameMonth(d.date, currentMonth, currentYear),
    );
    const totalMoisEquipe = depensesEquipeMoisValue.reduce(
      (sum, d) => sum + d.montant,
      0,
    );

    const depensesSansFlags = depensesEquipeMoisValue.filter(
      (d) => d.flags.length === 0,
    );
    const tauxConformiteValue =
      depensesEquipeMoisValue.length > 0
        ? (depensesSansFlags.length / depensesEquipeMoisValue.length) * 100
        : undefined;

    const now = new Date();
    const delaiMoyenAttenteValue =
      demandesEnAttenteValue.length > 0
        ? (() => {
            const totalMs = demandesEnAttenteValue.reduce((sum, d) => {
              const created = new Date(d.dateCreation);
              return sum + (now.getTime() - created.getTime());
            }, 0);
            const avgMs = totalMs / demandesEnAttenteValue.length;
            return avgMs / (1000 * 60 * 60 * 24);
          })()
        : undefined;

    const approUrgentesValue = [...demandesEnAttenteValue]
      .sort(
        (a, b) =>
          new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime(),
      );

    const getMontantDemande = (demandeId: string) => {
      const demande = demandesEnAttenteValue.find((d) => d.id === demandeId);
      if (!demande) return 0;
      if (demande.type === 'mission') {
        const mission = missions.find((m) => m.id === demande.entityId);
        return mission?.budgetAlloue ?? 0;
      }
      if (demande.type === 'depense') {
        const dep = depenses.find((d) => d.id === demande.entityId);
        return dep?.montant ?? 0;
      }
      // avance
      return 500;
    };

    const categories = categoriesDepense.map((c) => c.nom);

    const sumByCategory = (
      deps: typeof depensesEquipe,
      month: number,
      year: number,
    ) => {
      const map = new Map<string, number>();
      deps.forEach((d) => {
        if (!isSameMonth(d.date, month, year)) return;
        map.set(d.categorie, (map.get(d.categorie) ?? 0) + d.montant);
      });
      return map;
    };

    const currentMap = sumByCategory(depensesEquipe, currentMonth, currentYear);
    const prevMap = sumByCategory(depensesEquipe, prevMonth, prevYear);

    const chartDataValue = categories.map((cat) => ({
      categorie: cat,
      courant: currentMap.get(cat) ?? 0,
      precedent: prevMap.get(cat) ?? 0,
    }));

    // Timeline activités manager
    type Activity = {
      id: string;
      type: 'approved' | 'info_request' | 'rejected' | 'submitted' | 'reimbursed';
      message: string;
      date: Date;
      link?: string;
    };
    const activitesValue: Activity[] = [];

    // Activités basées sur les dépenses de l'équipe
    depensesEquipe.forEach((d) => {
      const member = teamMembersValue.find((m) => m.id === d.userId);
      const memberName = member ? `${member.prenom} ${member.nom}` : 'Inconnu';
      if (d.statutRemboursement === 'valide') {
        activitesValue.push({
          id: `act-mgr-${d.id}-approved`,
          type: 'approved',
          message: `Dépense « ${d.description} » de ${memberName} approuvée (${formatCurrency(d.montant)})`,
          date: new Date(d.date),
          link: `/approvals`,
        });
      }
      if (d.statutRemboursement === 'refuse') {
        activitesValue.push({
          id: `act-mgr-${d.id}-rejected`,
          type: 'rejected',
          message: `Dépense « ${d.description} » de ${memberName} refusée`,
          date: new Date(d.date),
          link: `/approvals`,
        });
      }
      if (d.statutRemboursement === 'demande_info') {
        activitesValue.push({
          id: `act-mgr-${d.id}-info`,
          type: 'info_request',
          message: `Demande d'information envoyée à ${memberName} pour « ${d.description} »`,
          date: new Date(d.dateDemandeInfo ?? d.date),
          link: `/approvals`,
        });
      }
      if (d.statutRemboursement === 'paye') {
        activitesValue.push({
          id: `act-mgr-${d.id}-paid`,
          type: 'reimbursed',
          message: `Remboursement effectué pour « ${d.description} » de ${memberName} (${formatCurrency(d.montant)})`,
          date: new Date(d.date),
          link: `/approvals`,
        });
      }
      if (d.statutRemboursement === 'en_attente') {
        activitesValue.push({
          id: `act-mgr-${d.id}-submitted`,
          type: 'submitted',
          message: `${memberName} a soumis « ${d.description} » (${formatCurrency(d.montant)})`,
          date: new Date(d.date),
          link: `/approvals`,
        });
      }
    });

    activitesValue.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      teamMembers: teamMembersValue,
      demandesEnAttente: demandesEnAttenteValue,
      budgetConsomme: budgetConsommeValue,
      budgetAlloue: budgetAlloueValue,
      depensesEquipeMois: totalMoisEquipe,
      tauxConformite: tauxConformiteValue,
      delaiMoyenAttente: delaiMoyenAttenteValue,
      approUrgentes: approUrgentesValue.map((d) => ({
        ...d,
        montant: getMontantDemande(d.id),
      })),
      chartData: chartDataValue,
      activitesManager: activitesValue.slice(0, 15),
    };
  }, [today]);

  const pendingCount = demandesEnAttente.length;
  const budgetRatio =
    budgetAlloue > 0 ? Math.min(budgetConsomme / budgetAlloue, 1) : 0;

  const formatShortDate = (dateStr: string) =>
    format(new Date(dateStr), 'dd MMM', { locale: fr });

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

  return (
    <div className="space-y-6">

      {/* 1. Stats (4 cartes) */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">À approuver</p>
                <p className="text-2xl font-semibold tracking-tight text-slate-900">
                  {pendingCount}
                </p>
              </div>
            </div>
            {pendingCount > 0 && (
              <Badge variant="danger" size="sm">
                Urgent
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Demandes en attente de votre décision.
          </p>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Budget équipe</p>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                {formatCurrency(budgetConsomme)}
              </p>
            </div>
          </div>
          <div className="mt-1">
            <div className="h-1.5 w-full rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full bg-primary-500"
                style={{ width: `${Math.round(budgetRatio * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Sur {formatCurrency(budgetAlloue)} alloués ({Math.round(budgetRatio * 100)}% consommés).
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Wallet2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Dépenses équipe (mois)
              </p>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                {formatCurrency(depensesEquipeMois)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Toutes les dépenses déclarées ce mois-ci.
          </p>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Taux de conformité
              </p>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                {tauxConformite !== undefined
                  ? `${tauxConformite.toFixed(0)} %`
                  : '—'}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Proportion de dépenses sans anomalies détectées.
          </p>
        </Card>
      </section>

      {/* 2. Actions rapides */}
      <section className="flex flex-wrap gap-3">
        <Button
          size="md"
          variant="primary"
          leftIcon={<ClipboardList className="h-4 w-4" />}
          onClick={() => navigate('/approvals')}
        >
          Voir les approbations
        </Button>
        <Button
          size="md"
          variant="secondary"
          leftIcon={<Users className="h-4 w-4" />}
          onClick={() => navigate('/missions')}
        >
          Voir les missions
        </Button>
        <Button
          size="md"
          variant="secondary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('/missions/new?team=true')}
        >
          Créer une mission
        </Button>
      </section>

      {/* Deux colonnes : Tableaux + Graphique sticky */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Colonne gauche (2/3) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Approbations en attente */}
          <Card>
            <CardHeader className="border-b-0 pb-0">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Approbations en attente</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary-700 px-0"
                  onClick={() => navigate('/approvals')}
                >
                  Voir tout →
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {approUrgentes.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Aucune demande en attente.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Demandeur</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approUrgentes.map((demande) => {
                      const demandeur = mockUsers.find(
                        (u) => u.id === demande.demandeurId,
                      );
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

                      return (
                        <TableRow
                          key={demande.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/approvals/${demande.id}`)}
                        >
                          <TableCell>
                            <Badge variant={typeBadgeVariant} size="sm">
                              {typeLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-[10px] font-semibold text-white">
                                {demandeur
                                  ? `${demandeur.prenom[0]}${demandeur.nom[0]}`
                                  : '??'}
                              </div>
                              <span className="text-xs text-slate-800">
                                {demandeur
                                  ? `${demandeur.prenom} ${demandeur.nom}`
                                  : '—'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900">
                            {formatCurrency(demande.montant)}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {formatShortDate(demande.dateCreation)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="primary"
                                className="text-[11px] px-2 py-1"
                              >
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                className="text-[11px] px-2 py-1"
                              >
                                Rejeter
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dépenses par catégorie */}
          <Card>
            <CardHeader className="border-b-0 pb-1">
              <CardTitle>Dépenses par catégorie</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="categorie"
                      tick={{ fontSize: 11 }}
                      tickMargin={8}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        new Intl.NumberFormat('fr-FR', {
                          maximumFractionDigits: 0,
                        }).format(v as number)
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Catégorie : ${label}`}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value) =>
                        value === 'courant'
                          ? 'Mois courant'
                          : 'Mois précédent'
                      }
                    />
                    <Bar
                      dataKey="courant"
                      name="Mois courant"
                      fill="#009ddc"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="precedent"
                      name="Mois précédent"
                      fill="#cbd5f5"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite (1/3, sticky) — Dernières activités */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
            <CardHeader className="border-b-0 pb-1">
              <CardTitle>Dernières activités</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 overflow-y-auto flex-1">
              {activitesManager.length === 0 ? (
                <p className="text-xs text-slate-500">Aucune activité récente.</p>
              ) : (
                <ol className="relative space-y-3">
                  <div className="absolute left-[11px] top-1 bottom-1 w-px bg-slate-200" />
                  {activitesManager.map((act) => (
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
    </div>
  );
};

export default DashboardManager;

