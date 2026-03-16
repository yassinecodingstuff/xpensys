import type { FC } from 'react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Download,
  ChevronDown,
  FileSpreadsheet,
  Search,
  Wallet,
  ClipboardCheck,
  FileBarChart,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import {
  financeItems,
  financeHistory,
  demandesApprobation,
  type FinanceItem,
  type FinanceConformite,
  type TypeDemande,
} from '../../data/mockData';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtCur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) => format(new Date(d), 'dd MMM yyyy', { locale: fr });
const fmtDateShort = (d: string) => format(new Date(d), 'dd MMM', { locale: fr });

const maskIban = (iban?: string) => {
  if (!iban) return '—';
  const parts = iban.split(' ');
  if (parts.length <= 2) return iban;
  return `${parts[0]} ${parts[1]} ${'••••'} ${parts[parts.length - 1]}`;
};

const typeBadge = (t: TypeDemande) => {
  const map: Record<TypeDemande, { label: string; variant: 'info' | 'neutral' | 'success' }> = {
    mission: { label: 'Mission', variant: 'info' },
    depense: { label: 'Dépense', variant: 'neutral' },
    avance: { label: 'Avance', variant: 'success' },
  };
  return map[t];
};

const conformiteBadge = (c: FinanceConformite) => {
  const map: Record<FinanceConformite, { label: string; cls: string }> = {
    conforme: { label: 'Conforme', cls: 'bg-green-50 text-green-700' },
    depassement: { label: 'Dépassement', cls: 'bg-yellow-50 text-yellow-700' },
    anomalie: { label: 'Anomalie', cls: 'bg-red-50 text-red-700' },
  };
  return map[c];
};

const daysSince = (d: string) => {
  const diff = new Date('2026-01-27').getTime() - new Date(d).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

type AgeFilter = 'all' | 'lt24h' | '1_3' | 'gt3';
const matchAge = (dateSoumission: string, filter: AgeFilter) => {
  if (filter === 'all') return true;
  const days = daysSince(dateSoumission);
  if (filter === 'lt24h') return days < 1;
  if (filter === '1_3') return days >= 1 && days <= 3;
  return days > 3;
};

// ─── Component ──────────────────────────────────────────────────────────────
const FinanceDashboard: FC = () => {
  const navigate = useNavigate();

  // ── Tab state ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('approuver');

  // ── Selection ───────────────────────────────────────────────────────────
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // ── Filters ─────────────────────────────────────────────────────────────
  const [filterType, setFilterType] = useState<TypeDemande | 'all'>('all');
  const [filterConf, setFilterConf] = useState<FinanceConformite | 'all'>('all');
  const [filterAge, setFilterAge] = useState<AgeFilter>('all');
  const [search, setSearch] = useState('');

  // Tab 2 filters
  const [filterTypeRemb, setFilterTypeRemb] = useState<TypeDemande | 'all'>('all');
  const [searchRemb, setSearchRemb] = useState('');

  // Tab 4 filters
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [filterTypeHist, setFilterTypeHist] = useState<TypeDemande | 'all'>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchHist, setSearchHist] = useState('');

  // ── Modals ──────────────────────────────────────────────────────────────
  const [reimbModal, setReimbModal] = useState<FinanceItem | null>(null);
  const [batchReimbModal, setBatchReimbModal] = useState(false);
  const [reimbDate, setReimbDate] = useState('2026-01-27');
  const [reimbRef, setReimbRef] = useState('');
  const [reimbComment, setReimbComment] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // ── Derived data ────────────────────────────────────────────────────────
  const aApprouver = useMemo(() => financeItems.filter((i) => i.statutFinance === 'a_approuver'), []);
  const aRembourser = useMemo(() => financeItems.filter((i) => i.statutFinance === 'a_rembourser'), []);
  const rembourses = useMemo(() => financeItems.filter((i) => i.statutFinance === 'rembourse'), []);
  const exportes = useMemo(() => financeItems.filter((i) => i.statutFinance === 'exporte'), []);
  const anomalies = useMemo(() => aApprouver.filter((i) => i.conformite === 'anomalie'), [aApprouver]);

  // ── KPI values ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    approuverCount: aApprouver.length,
    approuverMontant: aApprouver.reduce((s, i) => s + i.montant, 0),
    rembourserCount: aRembourser.length,
    rembourserMontant: aRembourser.reduce((s, i) => s + i.montant, 0),
    exporterCount: rembourses.length,
    exporterMontant: rembourses.reduce((s, i) => s + i.montant, 0),
    anomaliesCount: anomalies.length,
  }), [aApprouver, aRembourser, rembourses, anomalies]);

  // ── Tab 1 filtered ─────────────────────────────────────────────────────
  const filteredApprouver = useMemo(() => {
    return aApprouver.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterConf !== 'all' && item.conformite !== filterConf) return false;
      if (!matchAge(item.dateSoumission, filterAge)) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.demandeurNom.toLowerCase().includes(q) || item.objet.toLowerCase().includes(q);
      }
      return true;
    });
  }, [aApprouver, filterType, filterConf, filterAge, search]);

  // ── Tab 2 filtered ─────────────────────────────────────────────────────
  const filteredRembourser = useMemo(() => {
    return aRembourser.filter((item) => {
      if (filterTypeRemb !== 'all' && item.type !== filterTypeRemb) return false;
      if (searchRemb) {
        const q = searchRemb.toLowerCase();
        return item.demandeurNom.toLowerCase().includes(q) || item.objet.toLowerCase().includes(q);
      }
      return true;
    });
  }, [aRembourser, filterTypeRemb, searchRemb]);

  // ── Tab 3: group by month ──────────────────────────────────────────────
  const exportByMonth = useMemo(() => {
    const allExportable = [...rembourses, ...exportes];
    const groups: Record<string, { items: FinanceItem[]; exported: boolean; exportDate?: string }> = {};
    allExportable.forEach((item) => {
      const monthKey = item.dateRemboursement ? item.dateRemboursement.slice(0, 7) : 'unknown';
      if (!groups[monthKey]) groups[monthKey] = { items: [], exported: !!item.dateExport, exportDate: item.dateExport };
      groups[monthKey].items.push(item);
      if (item.dateExport) groups[monthKey].exported = true;
      if (item.dateExport && !groups[monthKey].exportDate) groups[monthKey].exportDate = item.dateExport;
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [rembourses, exportes]);

  // ── Tab 4 filtered ─────────────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    return financeHistory.filter((entry) => {
      if (filterTypeHist !== 'all' && entry.type !== filterTypeHist) return false;
      if (filterAction !== 'all' && entry.action !== filterAction) return false;
      if (searchHist) {
        const q = searchHist.toLowerCase();
        return entry.employeNom.toLowerCase().includes(q) || entry.objet.toLowerCase().includes(q);
      }
      // Period filter
      const d = new Date(entry.date);
      const now = new Date('2026-01-27');
      if (filterPeriod === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (filterPeriod === 'last_month') {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
      }
      if (filterPeriod === 'quarter') {
        const q = Math.floor(now.getMonth() / 3);
        const dq = Math.floor(d.getMonth() / 3);
        return dq === q && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [filterTypeHist, filterAction, searchHist, filterPeriod]);

  // ── Selection helpers ──────────────────────────────────────────────────
  const toggleItem = (id: string) => setSelectedItems((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleAll = (items: FinanceItem[]) => {
    const ids = items.map((i) => i.id);
    const allSelected = ids.every((id) => selectedItems.includes(id));
    setSelectedItems(allSelected ? selectedItems.filter((id) => !ids.includes(id)) : [...new Set([...selectedItems, ...ids])]);
  };
  const selectedTotal = (items: FinanceItem[]) =>
    items.filter((i) => selectedItems.includes(i.id)).reduce((s, i) => s + i.montant, 0);
  const selectedCount = (items: FinanceItem[]) =>
    items.filter((i) => selectedItems.includes(i.id)).length;

  // Clear selection on tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedItems([]);
  };

  // ── Navigation helper for detail pages ────────────────────────────────
  const goToDetail = (item: FinanceItem) => {
    // Find matching approval by entityId to reuse the same detail UI as manager
    const approval = demandesApprobation.find((a) => a.entityId === item.entityId);
    if (approval) {
      navigate(`/approvals/${approval.id}`);
    } else {
      // Fallback to entity-specific pages
      if (item.type === 'mission') navigate(`/missions/${item.entityId}`);
      else if (item.type === 'depense') navigate(`/expenses/${item.entityId}`);
      else navigate(`/finance`);
    }
  };

  // ── Month label ────────────────────────────────────────────────────────
  const monthLabel = (key: string) => {
    const [year, month] = key.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(d, 'MMMM yyyy', { locale: fr });
  };

  // ── Action icon config for history ────────────────────────────────────
  const actionConfig: Record<string, { label: string; cls: string }> = {
    approuve: { label: 'Approuvé', cls: 'text-green-600' },
    rejete: { label: 'Rejeté', cls: 'text-red-600' },
    rembourse: { label: 'Remboursé', cls: 'text-blue-600' },
    exporte: { label: 'Exporté', cls: 'text-purple-600' },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB CONTENTS
  // ══════════════════════════════════════════════════════════════════════════

  // ── TAB 1: À approuver ────────────────────────────────────────────────
  const tabApprouver = (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as TypeDemande | 'all')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">Tous les types</option>
          <option value="mission">Mission</option>
          <option value="depense">Dépense</option>
          <option value="avance">Avance</option>
        </select>
        <select value={filterConf} onChange={(e) => setFilterConf(e.target.value as FinanceConformite | 'all')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">Toute conformité</option>
          <option value="conforme">Conforme</option>
          <option value="depassement">Dépassement</option>
          <option value="anomalie">Anomalie</option>
        </select>
        <select value={filterAge} onChange={(e) => setFilterAge(e.target.value as AgeFilter)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">Toute ancienneté</option>
          <option value="lt24h">{'< 24h'}</option>
          <option value="1_3">1-3 jours</option>
          <option value="gt3">{'> 3 jours'}</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={filteredApprouver.length > 0 && filteredApprouver.every((i) => selectedItems.includes(i.id))} onChange={() => toggleAll(filteredApprouver)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                </th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Demandeur</th>
                <th className="px-4 py-3 text-left font-medium">Département</th>
                <th className="px-4 py-3 text-left font-medium">Objet</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th>
                <th className="px-4 py-3 text-left font-medium">Soumis</th>
                <th className="px-4 py-3 text-left font-medium">Conformité</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApprouver.map((item) => {
                const tb = typeBadge(item.type);
                const cb = conformiteBadge(item.conformite);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItem(item.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                    </td>
                    <td className="px-4 py-3"><Badge variant={tb.variant} size="sm">{tb.label}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={item.demandeurNom} size="sm" />
                        <span className="font-medium text-slate-900">{item.demandeurNom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.departement}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{item.objet}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtCur(item.montant)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDateShort(item.dateSoumission)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-medium ${cb.cls}`}>{cb.label}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => goToDetail(item)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50">
                        Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredApprouver.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Aucun élément à approuver</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky batch actions */}
      {selectedCount(filteredApprouver) > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-6 py-4 shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {selectedCount(filteredApprouver)} sélectionné{selectedCount(filteredApprouver) > 1 ? 's' : ''} · {fmtCur(selectedTotal(filteredApprouver))}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setSelectedItems([])}>
                Rejeter
              </Button>
              <Button variant="primary" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setSelectedItems([])}>
                Approuver la sélection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── TAB 2: À rembourser ───────────────────────────────────────────────
  const tabRembourser = (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterTypeRemb} onChange={(e) => setFilterTypeRemb(e.target.value as TypeDemande | 'all')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">Tous les types</option>
          <option value="mission">Mission</option>
          <option value="depense">Dépense</option>
          <option value="avance">Avance</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchRemb} onChange={(e) => setSearchRemb(e.target.value)} placeholder="Rechercher..." className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={filteredRembourser.length > 0 && filteredRembourser.every((i) => selectedItems.includes(i.id))} onChange={() => toggleAll(filteredRembourser)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                </th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Employé</th>
                <th className="px-4 py-3 text-left font-medium">Objet</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th>
                <th className="px-4 py-3 text-left font-medium">IBAN</th>
                <th className="px-4 py-3 text-left font-medium">Approuvé le</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRembourser.map((item) => {
                const tb = typeBadge(item.type);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItem(item.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                    </td>
                    <td className="px-4 py-3"><Badge variant={tb.variant} size="sm">{tb.label}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={item.demandeurNom} size="sm" />
                        <span className="font-medium text-slate-900">{item.demandeurNom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.objet}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtCur(item.montant)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{maskIban(item.iban)}</td>
                    <td className="px-4 py-3 text-slate-600">{item.dateApprobationFinance ? fmtDateShort(item.dateApprobationFinance) : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => goToDetail(item)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50">
                          Voir
                        </button>
                        <button type="button" onClick={() => { setReimbModal(item); setReimbRef(`VIR-2026-0127-${item.id.split('-').pop()}`); }} className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100">
                          Rembourser
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRembourser.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Aucun élément à rembourser</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky batch actions */}
      {selectedCount(filteredRembourser) > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-6 py-4 shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {selectedCount(filteredRembourser)} sélectionné{selectedCount(filteredRembourser) > 1 ? 's' : ''} · {fmtCur(selectedTotal(filteredRembourser))}
            </span>
            <Button variant="primary" size="sm" onClick={() => setBatchReimbModal(true)}>
              Marquer remboursés
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // ── TAB 3: À exporter ─────────────────────────────────────────────────
  const tabExporter = (
    <div className="space-y-6">
      {exportByMonth.map(([monthKey, group]) => {
        const total = group.items.reduce((s, i) => s + i.montant, 0);
        const label = monthLabel(monthKey);
        const isExported = group.exported;
        return (
          <div key={monthKey} className={`overflow-hidden rounded-xl border shadow-sm ${isExported ? 'border-slate-200 bg-slate-50/50 opacity-80' : 'border-slate-100 bg-white'}`}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold capitalize text-slate-900">{label}</h3>
                <span className="text-xs text-slate-500">{group.items.length} éléments · {fmtCur(total)}</span>
                {isExported && group.exportDate && (
                  <Badge variant="success" size="sm">Exporté le {fmtDateShort(group.exportDate)}</Badge>
                )}
              </div>
              <div className="relative">
                <Button variant={isExported ? 'secondary' : 'primary'} size="sm" leftIcon={<FileBarChart className="h-4 w-4" />}>
                  {isExported ? 'Ré-exporter' : `Exporter ${label}`}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Employé</th>
                    <th className="px-4 py-3 text-left font-medium">Objet</th>
                    <th className="px-4 py-3 text-right font-medium">Montant</th>
                    <th className="px-4 py-3 text-left font-medium">Remboursé le</th>
                    <th className="px-4 py-3 text-left font-medium">Réf. virement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.items.map((item) => {
                    const tb = typeBadge(item.type);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3"><Badge variant={tb.variant} size="sm">{tb.label}</Badge></td>
                        <td className="px-4 py-3 text-slate-700">{item.demandeurNom}</td>
                        <td className="px-4 py-3 text-slate-700">{item.objet}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtCur(item.montant)}</td>
                        <td className="px-4 py-3 text-slate-600">{item.dateRemboursement ? fmtDateShort(item.dateRemboursement) : '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.refVirement || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {exportByMonth.length === 0 && (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <FileBarChart className="h-8 w-8 mb-2" />
          <p className="text-sm">Rien à exporter pour le moment</p>
        </div>
      )}
    </div>
  );

  // ── TAB 4: Historique ─────────────────────────────────────────────────
  const tabHistorique = (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="month">Ce mois</option>
          <option value="last_month">Mois dernier</option>
          <option value="quarter">Ce trimestre</option>
          <option value="all">Tout</option>
        </select>
        <select value={filterTypeHist} onChange={(e) => setFilterTypeHist(e.target.value as TypeDemande | 'all')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">Tous les types</option>
          <option value="mission">Mission</option>
          <option value="depense">Dépense</option>
          <option value="avance">Avance</option>
        </select>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">Toutes les actions</option>
          <option value="approuve">Approuvé</option>
          <option value="rejete">Rejeté</option>
          <option value="rembourse">Remboursé</option>
          <option value="exporte">Exporté</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchHist} onChange={(e) => setSearchHist(e.target.value)} placeholder="Rechercher..." className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Employé</th>
                <th className="px-4 py-3 text-left font-medium">Objet</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th>
                <th className="px-4 py-3 text-left font-medium">Par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((entry) => {
                const ac = actionConfig[entry.action];
                const tb = typeBadge(entry.type);
                return (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{fmtDate(entry.date)}</td>
                    <td className="px-4 py-3"><span className={`font-medium ${ac.cls}`}>{ac.label}</span></td>
                    <td className="px-4 py-3"><Badge variant={tb.variant} size="sm">{tb.label}</Badge></td>
                    <td className="px-4 py-3 text-slate-700">{entry.employeNom}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{entry.objet}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtCur(entry.montant)}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.par}</td>
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Aucun historique trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Finance</h1>
        <div className="relative">
          <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />} rightIcon={<ChevronDown className="h-4 w-4" />} onClick={() => setExportMenuOpen(!exportMenuOpen)}>
            Exporter
          </Button>
          {exportMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><FileSpreadsheet className="h-4 w-4" /> CSV</button>
                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* À approuver */}
        <button type="button" onClick={() => handleTabChange('approuver')} className={`flex flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${activeTab === 'approuver' ? 'ring-2 ring-primary-500 border-primary-200' : 'border-gray-100 hover:border-primary-200'}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <ClipboardCheck className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{kpis.approuverCount}</p>
          <p className="text-sm text-slate-500">À approuver · {fmtCur(kpis.approuverMontant)}</p>
        </button>

        {/* À rembourser */}
        <button type="button" onClick={() => handleTabChange('rembourser')} className={`flex flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${activeTab === 'rembourser' ? 'ring-2 ring-primary-500 border-primary-200' : 'border-gray-100 hover:border-primary-200'}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Wallet className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{kpis.rembourserCount}</p>
          <p className="text-sm text-slate-500">À rembourser · {fmtCur(kpis.rembourserMontant)}</p>
        </button>

        {/* À exporter */}
        <button type="button" onClick={() => handleTabChange('exporter')} className={`flex flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${activeTab === 'exporter' ? 'ring-2 ring-primary-500 border-primary-200' : 'border-gray-100 hover:border-primary-200'}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <FileBarChart className="h-5 w-5 text-purple-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{kpis.exporterCount}</p>
          <p className="text-sm text-slate-500">À exporter · {fmtCur(kpis.exporterMontant)}</p>
        </button>

        {/* Anomalies */}
        <button type="button" onClick={() => { handleTabChange('approuver'); setFilterConf('anomalie'); }} className={`flex flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${filterConf === 'anomalie' && activeTab === 'approuver' ? 'ring-2 ring-red-400 border-red-200' : 'border-gray-100 hover:border-red-200'}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{kpis.anomaliesCount}</p>
          <p className="text-sm text-slate-500">Anomalies</p>
        </button>
      </div>

      {/* ── TABS ───────────────────────────────────────────────────────── */}
      <Tabs
        variant="underline"
        value={activeTab}
        onChange={handleTabChange}
        items={[
          { id: 'approuver', label: 'À approuver', content: tabApprouver },
          { id: 'rembourser', label: 'À rembourser', content: tabRembourser },
          { id: 'exporter', label: 'À exporter', content: tabExporter },
          { id: 'historique', label: 'Historique', content: tabHistorique },
        ]}
      />

      {/* ── MODAL: single reimbursement ────────────────────────────────── */}
      <Modal
        open={!!reimbModal}
        title="Marquer remboursé"
        onClose={() => { setReimbModal(null); setReimbComment(''); }}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setReimbModal(null)}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={() => { setReimbModal(null); setReimbComment(''); }}>Confirmer</Button>
          </>
        }
      >
        {reimbModal && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 grid gap-3 sm:grid-cols-2">
              <div><p className="text-xs text-slate-500">Employé</p><p className="font-medium text-slate-900">{reimbModal.demandeurNom}</p></div>
              <div><p className="text-xs text-slate-500">Montant</p><p className="text-lg font-bold text-slate-900">{fmtCur(reimbModal.montant)}</p></div>
              <div><p className="text-xs text-slate-500">Objet</p><p className="text-slate-900">{reimbModal.objet}</p></div>
              <div><p className="text-xs text-slate-500">IBAN</p><p className="font-mono text-xs text-slate-900">{maskIban(reimbModal.iban)}</p></div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date du virement</label>
              <input type="date" value={reimbDate} onChange={(e) => setReimbDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Référence virement</label>
              <input type="text" value={reimbRef} onChange={(e) => setReimbRef(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Commentaire (optionnel)</label>
              <textarea rows={2} value={reimbComment} onChange={(e) => setReimbComment(e.target.value)} placeholder="Ajouter un commentaire..." className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: batch reimbursement ─────────────────────────────────── */}
      <Modal
        open={batchReimbModal}
        title="Marquer remboursés"
        onClose={() => setBatchReimbModal(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setBatchReimbModal(false)}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={() => { setBatchReimbModal(false); setSelectedItems([]); }}>Confirmer tout</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="font-medium text-slate-900">{selectedCount(aRembourser)} éléments · {fmtCur(selectedTotal(aRembourser))}</p>
            <div className="mt-2 space-y-1">
              {aRembourser.filter((i) => selectedItems.includes(i.id)).map((item) => (
                <p key={item.id} className="text-xs text-slate-600">{item.demandeurNom} — {item.objet} — {fmtCur(item.montant)}</p>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date du virement</label>
            <input type="date" value={reimbDate} onChange={(e) => setReimbDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Référence virement (suffixé automatiquement)</label>
            <input type="text" value={reimbRef} onChange={(e) => setReimbRef(e.target.value)} placeholder="VIR-2026-0127" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FinanceDashboard;
