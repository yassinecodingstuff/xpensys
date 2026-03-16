import type { FC } from 'react';
import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Network,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { mockUsers } from '../../data/mockData';

interface Department {
  id: string;
  nom: string;
  responsableId: string;
  description: string;
  budgetAnnuel: number;
}

const initialDepartments: Department[] = [
  { id: 'dept-1', nom: 'Commercial', responsableId: 'user-006', description: 'Équipe commerciale et développement client', budgetAnnuel: 50000 },
  { id: 'dept-2', nom: 'Tech', responsableId: 'user-006', description: 'Développement produit et infrastructure', budgetAnnuel: 35000 },
  { id: 'dept-3', nom: 'Marketing', responsableId: 'user-006', description: 'Communication, événements et acquisition', budgetAnnuel: 25000 },
  { id: 'dept-4', nom: 'RH', responsableId: 'user-006', description: 'Ressources humaines et recrutement', budgetAnnuel: 10000 },
  { id: 'dept-5', nom: 'Finance', responsableId: 'user-006', description: 'Comptabilité et gestion financière', budgetAnnuel: 15000 },
  { id: 'dept-6', nom: 'Ops', responsableId: 'user-006', description: 'Opérations et logistique', budgetAnnuel: 20000 },
];

const fmtCur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const SettingsDepartments: FC = () => {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Department | null>(null);
  const [form, setForm] = useState({ nom: '', description: '', responsableId: '', budgetAnnuel: '' });

  const openCreate = () => {
    setEditingDept(null);
    setForm({ nom: '', description: '', responsableId: '', budgetAnnuel: '' });
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setForm({
      nom: dept.nom,
      description: dept.description,
      responsableId: dept.responsableId,
      budgetAnnuel: String(dept.budgetAnnuel),
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nom.trim()) return;
    if (editingDept) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editingDept.id
            ? { ...d, nom: form.nom.trim(), description: form.description.trim(), responsableId: form.responsableId, budgetAnnuel: Number(form.budgetAnnuel) || 0 }
            : d
        )
      );
    } else {
      setDepartments((prev) => [
        ...prev,
        {
          id: `dept-${Date.now()}`,
          nom: form.nom.trim(),
          description: form.description.trim(),
          responsableId: form.responsableId,
          budgetAnnuel: Number(form.budgetAnnuel) || 0,
        },
      ]);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setDepartments((prev) => prev.filter((d) => d.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const getMemberCount = (deptName: string) =>
    mockUsers.filter((u) => u.departement === deptName).length;

  const managers = mockUsers.filter((u) => u.role === 'manager' || u.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Départements</h2>
          <p className="text-sm text-slate-500">{departments.length} départements configurés</p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Ajouter
        </Button>
      </div>

      {/* Department list */}
      <div className="grid gap-4 sm:grid-cols-2">
        {departments.map((dept) => {
          const memberCount = getMemberCount(dept.nom);
          const responsable = mockUsers.find((u) => u.id === dept.responsableId);
          return (
            <Card key={dept.id}>
              <CardContent className="pt-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                      <Network className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{dept.nom}</p>
                      <p className="text-xs text-slate-500">{dept.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(dept)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(dept)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Membres</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-900">{memberCount}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Budget annuel</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{fmtCur(dept.budgetAnnuel)}</p>
                  </div>
                </div>

                {responsable && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Avatar name={`${responsable.prenom} ${responsable.nom}`} size="sm" />
                    <span>Responsable : <span className="font-medium text-slate-700">{responsable.prenom} {responsable.nom}</span></span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        title={editingDept ? 'Modifier le département' : 'Nouveau département'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button size="sm" disabled={!form.nom.trim()} onClick={handleSave}>
              {editingDept ? 'Enregistrer' : 'Créer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nom du département"
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
            placeholder="Ex. Commercial, Tech..."
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Description du département..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 shadow-sm hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Responsable
            </label>
            <select
              value={form.responsableId}
              onChange={(e) => setForm((f) => ({ ...f, responsableId: e.target.value }))}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              <option value="">Sélectionner un responsable</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>
              ))}
            </select>
          </div>
          <Input
            label="Budget annuel (EUR)"
            type="number"
            min={0}
            step={1000}
            value={form.budgetAnnuel}
            onChange={(e) => setForm((f) => ({ ...f, budgetAnnuel: e.target.value }))}
            placeholder="0"
          />
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteConfirm}
        title="Supprimer le département"
        onClose={() => setDeleteConfirm(null)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>Supprimer</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Voulez-vous vraiment supprimer le département <span className="font-medium text-slate-900">{deleteConfirm?.nom}</span> ?
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
};

export default SettingsDepartments;
