import type { FC } from 'react';
import type { Node } from 'reactflow';
import { X, Play, GitBranch, UserCheck, Zap, Flag, Trash2 } from 'lucide-react';
import type { NodeType } from './nodes';

interface NodeConfigPanelProps {
  node: Node | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
}

// Options de configuration par type
const TRIGGER_OPTIONS = [
  { value: 'expense_submitted', label: 'Note de frais soumise' },
  { value: 'mission_submitted', label: 'Mission soumise' },
  { value: 'advance_requested', label: "Demande d'avance soumise" },
  { value: 'expense_added', label: 'Dépense ajoutée' },
];

const CONDITION_TYPES = [
  { value: 'amount_greater', label: 'Montant supérieur à' },
  { value: 'category_equals', label: 'Catégorie égale à' },
  { value: 'department_equals', label: 'Département égal à' },
  { value: 'role_equals', label: 'Poste égal à' },
];

const APPROVER_OPTIONS = [
  { value: 'manager', label: 'Manager direct (N+1)' },
  { value: 'n2', label: 'N+2' },
  { value: 'department_head', label: 'Directeur département' },
  { value: 'finance', label: 'Finance' },
  { value: 'specific', label: 'Personne spécifique' },
];

const TIMEOUT_ACTIONS = [
  { value: 'reminder', label: 'Relancer' },
  { value: 'escalate', label: 'Escalader' },
  { value: 'auto_approve', label: 'Approuver automatiquement' },
  { value: 'auto_reject', label: 'Rejeter automatiquement' },
];

const ACTION_TYPES = [
  { value: 'email', label: 'Envoyer email' },
  { value: 'notification', label: 'Notification in-app' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'mark_urgent', label: 'Marquer comme urgent' },
];

const END_STATUS = [
  { value: 'approved', label: 'Approuvé' },
  { value: 'rejected', label: 'Rejeté' },
  { value: 'cancelled', label: 'Annulé' },
];

const NODE_CONFIG: Record<NodeType, { label: string; Icon: FC<{ className?: string }>; color: string; bgColor: string }> = {
  trigger: { label: 'Déclencheur', Icon: Play, color: 'text-green-600', bgColor: 'bg-green-100' },
  condition: { label: 'Condition', Icon: GitBranch, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  approval: { label: 'Approbation', Icon: UserCheck, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  action: { label: 'Action', Icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  end: { label: 'Fin', Icon: Flag, color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export const NodeConfigPanel: FC<NodeConfigPanelProps> = ({ node, onClose, onUpdate, onDelete }) => {
  if (!node) return null;

  const nodeType = node.type as NodeType;
  const config = NODE_CONFIG[nodeType];
  const Icon = config.Icon;

  const handleChange = (key: string, value: unknown) => {
    onUpdate(node.id, { ...node.data, [key]: value });
  };

  const handleDelete = () => {
    onDelete(node.id);
    onClose();
  };

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor}`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 p-4">
        {/* Libellé (commun à tous) */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Libellé</label>
          <input
            type="text"
            value={(node.data.label as string) || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Config spécifique par type */}
        {nodeType === 'trigger' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Type de déclencheur</label>
            <select
              value={(node.data.triggerType as string) || 'expense_submitted'}
              onChange={(e) => handleChange('triggerType', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {TRIGGER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {nodeType === 'condition' && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Type de condition</label>
              <select
                value={(node.data.conditionType as string) || 'amount_greater'}
                onChange={(e) => handleChange('conditionType', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {CONDITION_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Valeur</label>
              <input
                type="text"
                value={(node.data.conditionValue as string) || ''}
                onChange={(e) => handleChange('conditionValue', e.target.value)}
                placeholder="ex: 500"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </>
        )}

        {nodeType === 'approval' && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Approbateur</label>
              <select
                value={(node.data.approver as string) || 'manager'}
                onChange={(e) => handleChange('approver', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {APPROVER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Timeout (heures)</label>
              <input
                type="number"
                value={(node.data.timeout as number) || 48}
                onChange={(e) => handleChange('timeout', parseInt(e.target.value, 10) || 48)}
                min={1}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Action si timeout</label>
              <select
                value={(node.data.timeoutAction as string) || 'reminder'}
                onChange={(e) => handleChange('timeoutAction', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {TIMEOUT_ACTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Numéro d&apos;étape <span className="font-normal text-slate-400">(optionnel)</span>
              </label>
              <input
                type="number"
                value={(node.data.step as number) || ''}
                onChange={(e) => handleChange('step', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                min={1}
                placeholder="Ex: 1, 2, 3..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Affiche un badge sur le nœud pour indiquer l&apos;ordre dans une chaîne d&apos;approbations.
              </p>
            </div>
          </>
        )}

        {nodeType === 'action' && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Type d&apos;action</label>
              <select
                value={(node.data.actionType as string) || 'notification'}
                onChange={(e) => handleChange('actionType', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {ACTION_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {(node.data.actionType === 'email' || node.data.actionType === 'notification') && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Message</label>
                <textarea
                  value={(node.data.message as string) || ''}
                  onChange={(e) => handleChange('message', e.target.value)}
                  rows={3}
                  placeholder="Contenu du message..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            )}
            {node.data.actionType === 'webhook' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">URL du webhook</label>
                <input
                  type="url"
                  value={(node.data.webhookUrl as string) || ''}
                  onChange={(e) => handleChange('webhookUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            )}
          </>
        )}

        {nodeType === 'end' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Statut final</label>
            <select
              value={(node.data.status as string) || 'approved'}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {END_STATUS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </aside>
  );
};

export default NodeConfigPanel;
