import type { FC } from 'react';
import { useState } from 'react';
import { Save, Upload, Check, Pencil } from 'lucide-react';
import { Button } from '../../ui/Button';

interface WorkflowHeaderProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  status: 'draft' | 'published';
  onSave: () => void;
  onPublish: () => void;
  autoEditName?: boolean;
}

export const WorkflowHeader: FC<WorkflowHeaderProps> = ({
  workflowName,
  onNameChange,
  status,
  onSave,
  onPublish,
  autoEditName = false,
}) => {
  const [isEditing, setIsEditing] = useState(autoEditName);
  const [editedName, setEditedName] = useState(workflowName);

  const handleSaveName = () => {
    const name = editedName.trim() || 'Sans titre';
    setEditedName(name);
    onNameChange(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditedName(workflowName);
      setIsEditing(false);
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center gap-4">
        {/* Nom du workflow */}
        {isEditing ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder="Nom du workflow..."
            className="w-64 rounded border border-primary-300 px-2 py-1 text-lg font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="group flex items-center gap-2 text-slate-900 hover:text-primary-600"
          >
            <span className="text-lg font-semibold">{workflowName}</span>
            <Pencil className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}

        {/* Badge statut */}
        {status === 'draft' ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            Brouillon
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <Check className="h-3 w-3" /> Publié
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" leftIcon={<Save className="h-4 w-4" />} onClick={onSave}>
          Sauvegarder
        </Button>
        <Button variant="primary" size="sm" leftIcon={<Upload className="h-4 w-4" />} onClick={onPublish}>
          Publier
        </Button>
      </div>
    </header>
  );
};

export default WorkflowHeader;
