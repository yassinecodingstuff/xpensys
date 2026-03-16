import type { FC } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Copy, Trash2, FileText, Building2, Users, Plus } from 'lucide-react';
import { politiques, type Politique } from '../../../data/mockData';
import { Button } from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';

const PolicyList: FC = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<Politique[]>(politiques);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Politique | null>(null);

  const scopeDepartements = (p: Politique) =>
    p.departements.includes('*') || p.departements.length === 0
      ? 'Tous les départements'
      : p.departements.slice(0, 3).join(', ') + (p.departements.length > 3 ? '…' : '');

  const modifiedLabel = (p: Politique) => {
    if (!p.dateModification) return null;
    return formatDistanceToNow(new Date(p.dateModification), { addSuffix: true, locale: fr });
  };

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    navigate(`/admin/policies/${id}`);
  };

  const openDeleteModal = (e: React.MouseEvent, p: Politique) => {
    e.stopPropagation();
    setPolicyToDelete(p);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (policyToDelete) {
      setList((prev) => prev.filter((x) => x.id !== policyToDelete.id));
      setPolicyToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setPolicyToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Politiques de dépenses</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez les règles de remboursement par groupe d&apos;employés
          </p>
        </div>
        <Link to="/admin/policies/new">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="bg-[#009ddc] hover:bg-[#008bc4]"
            leftIcon={<Plus className="h-4 w-4 shrink-0" />}
          >
            Nouvelle politique
          </Button>
        </Link>
      </div>

      {/* Contenu : grid de cards */}
      {list.length === 0 ? (
        /* État vide */
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-12 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FileText className="h-8 w-8" />
          </div>
          <p className="mt-4 text-lg font-medium text-slate-700">Aucune politique configurée</p>
          <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
            Créez votre première politique pour définir les règles de remboursement
          </p>
          <Link to="/admin/policies/new" className="mt-6">
            <Button type="button" variant="primary" size="sm" className="bg-[#009ddc] hover:bg-[#008bc4]">
              Créer une politique
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((policy) => (
            <article
              key={policy.id}
              role="button"
              tabIndex={0}
              onClick={(e) => handleCardClick(e, policy.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/admin/policies/${policy.id}`);
                }
              }}
              className="flex cursor-pointer flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md hover:border-primary-200"
            >
              {/* Nom */}
              <h2 className="font-semibold text-lg text-slate-900">{policy.nom}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">{policy.description}</p>

              {/* Scope résumé */}
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Building2 className="h-[18px] w-[18px] shrink-0 text-gray-400" />
                  <span>{scopeDepartements(policy)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-[18px] w-[18px] shrink-0 text-gray-400" />
                  <span>{policy.employesConcernes ?? 0} employé{(policy.employesConcernes ?? 0) !== 1 ? 's' : ''}</span>
                </p>
              </div>

              {/* Badge statut */}
              <div className="mt-3">
                {policy.actif !== false ? (
                  <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                    Actif
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                    Inactif
                  </span>
                )}
              </div>

              {/* Footer card */}
              <div className="mt-auto flex items-center justify-between gap-2 pt-4 mt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {modifiedLabel(policy) ? `Modifié ${modifiedLabel(policy)}` : '—'}
                </span>
                <div className="flex items-center gap-1" data-action>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/policies/${policy.id}`);
                    }}
                    className="rounded p-1.5 text-gray-400 transition-colors hover:text-primary-600"
                    aria-label="Voir"
                  >
                    <Eye className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded p-1.5 text-gray-400 transition-colors hover:text-primary-600"
                    aria-label="Dupliquer"
                  >
                    <Copy className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openDeleteModal(e, policy)}
                    className="rounded p-1.5 text-gray-400 transition-colors hover:text-rose-600"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal confirmation suppression */}
      <Modal
        open={deleteModalOpen}
        title="Supprimer la politique"
        onClose={closeDeleteModal}
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={closeDeleteModal}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={confirmDelete}
            >
              Supprimer
            </Button>
          </>
        }
      >
        {policyToDelete && (
          <p className="text-sm text-slate-600">
            Êtes-vous sûr de vouloir supprimer la politique &quot;{policyToDelete.nom}&quot; ? Cette action est irréversible.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default PolicyList;
