import type { FC } from 'react';
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import { financeItems, missions } from '../../data/mockData';

const fmtCur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => format(new Date(d), 'dd MMMM yyyy', { locale: fr });
const fmtDateShort = (d: string) => format(new Date(d), 'dd MMM yyyy', { locale: fr });

const FinanceMissionDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const item = financeItems.find((i) => i.id === id);
  const mission = item ? missions.find((m) => m.id === item.entityId) : undefined;

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectMotif, setRejectMotif] = useState('');
  const [comment, setComment] = useState('');

  if (!item) {
    return (
      <div className="flex flex-col items-center py-20 text-slate-400">
        <p className="text-lg font-medium">Élément introuvable</p>
        <Link to="/finance" className="mt-2 text-primary-600 hover:underline text-sm">Retour Finance</Link>
      </div>
    );
  }

  // Conformity checks (mock)
  const checks = [
    { label: 'Budget dans les limites', ok: item.conformite !== 'anomalie' },
    { label: 'Catégories autorisées', ok: true },
    { label: 'Durée conforme à la politique', ok: true },
    { label: 'Plafond par nuit respecté', ok: item.conformite === 'conforme' },
  ];

  // Timeline (mock)
  const timeline = [
    { date: item.dateSoumission, label: 'Soumis par ' + item.demandeurNom, icon: 'submit' },
    { date: item.dateApprobationManager, label: 'Approuvé par Manager', icon: 'approve' },
    { date: '—', label: 'En attente approbation Finance', icon: 'pending' },
  ];

  const handleApprove = () => {
    navigate('/finance');
  };

  const handleReject = () => {
    setRejectModal(false);
    setRejectMotif('');
    navigate('/finance');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/finance" className="hover:text-primary-600">Finance</Link>
        <span>/</span>
        <span>À approuver</span>
        <span>/</span>
        <span className="text-slate-700">Mission</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/finance')} className="rounded-lg p-2 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{item.objet}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={item.conformite === 'conforme' ? 'success' : item.conformite === 'depassement' ? 'warning' : 'danger'}>
                {item.conformite === 'conforme' ? 'Conforme' : item.conformite === 'depassement' ? 'Dépassement' : 'Anomalie'}
              </Badge>
              <Badge variant="info">Mission</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setRejectModal(true)}>
            Rejeter
          </Button>
          <Button variant="primary" size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
            Approuver
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left column (2/3) ─────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Informations demandeur */}
          <Card>
            <CardHeader><CardTitle>Informations demandeur</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar name={item.demandeurNom} size="lg" />
                <div>
                  <p className="font-semibold text-slate-900">{item.demandeurNom}</p>
                  <p className="text-sm text-slate-500">{item.departement}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Manager approbateur : Jean Martin</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Approuvé le {fmtDateShort(item.dateApprobationManager)}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">8 missions cette année · 0 rejet · Budget respecté à 95%</p>
            </CardContent>
          </Card>

          {/* Détail mission */}
          <Card>
            <CardHeader><CardTitle>Détail mission</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Destination</p>
                    <p className="font-medium text-slate-900">{mission?.destination || 'Paris'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Dates</p>
                    <p className="font-medium text-slate-900">
                      {mission ? `${fmtDateShort(mission.dateDebut)} — ${fmtDateShort(mission.dateFin)}` : '—'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Budget demandé</p>
                  <p className="text-lg font-bold text-slate-900">{fmtCur(item.montant)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Budget alloué par manager</p>
                  <p className="text-lg font-bold text-slate-900">{mission?.budgetAlloue ? fmtCur(mission.budgetAlloue) : fmtCur(item.montant)}</p>
                </div>
              </div>
              {mission?.projetAssocie && (
                <p className="mt-3 text-xs text-slate-500">Projet : {mission.projetAssocie}</p>
              )}
            </CardContent>
          </Card>

          {/* Dépenses prévues */}
          {mission?.depensesPrevues && mission.depensesPrevues.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Dépenses prévues</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Description</th>
                        <th className="px-4 py-2 text-left font-medium">Catégorie</th>
                        <th className="px-4 py-2 text-right font-medium">Montant</th>
                        <th className="px-4 py-2 text-center font-medium">Conforme</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mission.depensesPrevues.map((dp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2 text-slate-700">{dp.description}</td>
                          <td className="px-4 py-2 text-slate-600">{dp.categorie}</td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-900">{fmtCur(dp.montantEstime)}</td>
                          <td className="px-4 py-2 text-center">
                            <CheckCircle className="inline h-4 w-4 text-green-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right column (1/3) ────────────────────────────────────── */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Vérification conformité */}
          <Card>
            <CardHeader><CardTitle>Vérification conformité</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checks.map((check, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    {check.ok ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className={check.ok ? 'text-slate-700' : 'text-amber-700 font-medium'}>{check.label}</span>
                  </div>
                ))}
              </div>
              {item.anomalieDetail && (
                <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                  {item.anomalieDetail}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-slate-200">
                {timeline.map((t, idx) => (
                  <div key={idx} className="relative">
                    <span className={`absolute -left-4 top-1 flex h-4 w-4 items-center justify-center rounded-full ${
                      t.icon === 'approve' ? 'bg-green-500' : t.icon === 'pending' ? 'bg-amber-400' : 'bg-blue-500'
                    }`}>
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                    <p className="text-sm text-slate-900">{t.label}</p>
                    <p className="text-xs text-slate-500">{t.date !== '—' ? fmtDateShort(t.date) : 'En cours'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Footer sticky ─────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-20 -mx-6 border-t border-slate-200 bg-white px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire pour le demandeur..."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <Button variant="secondary" size="sm" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setRejectModal(true)}>
            Rejeter
          </Button>
          <Button variant="primary" size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
            Approuver
          </Button>
        </div>
      </div>

      {/* ── Modal Rejet ───────────────────────────────────────────── */}
      <Modal
        open={rejectModal}
        title="Confirmer le rejet"
        onClose={() => setRejectModal(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setRejectModal(false)}>Annuler</Button>
            <Button variant="danger" size="sm" disabled={!rejectMotif.trim()} onClick={handleReject}>Confirmer le rejet</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Vous êtes sur le point de rejeter la mission <span className="font-medium text-slate-900">{item.objet}</span> de {item.demandeurNom}.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Motif du rejet (obligatoire)</label>
            <textarea rows={3} value={rejectMotif} onChange={(e) => setRejectMotif(e.target.value)} placeholder="Expliquez la raison du rejet..." className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FinanceMissionDetail;
