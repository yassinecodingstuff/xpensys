import type { FC, DragEvent } from 'react';
import { Play, GitBranch, UserCheck, Zap, Flag } from 'lucide-react';
import type { NodeType } from './nodes';

interface NavbarNodeItem {
  type: NodeType;
  label: string;
  Icon: FC<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

const NODE_ITEMS: NavbarNodeItem[] = [
  {
    type: 'trigger',
    label: 'Déclencheur',
    Icon: Play,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
  {
    type: 'condition',
    label: 'Condition',
    Icon: GitBranch,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
  },
  {
    type: 'approval',
    label: 'Approbation',
    Icon: UserCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  {
    type: 'action',
    label: 'Action',
    Icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
  },
  {
    type: 'end',
    label: 'Fin',
    Icon: Flag,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
];

export const WorkflowSidebar: FC = () => {
  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <nav className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
      <span className="mr-2 text-sm font-medium text-slate-500">Éléments :</span>
      {NODE_ITEMS.map((item) => {
        const Icon = item.Icon;
        return (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            className={`flex cursor-grab items-center gap-2 rounded-lg border bg-white px-3 py-2 transition-all hover:shadow-md active:cursor-grabbing ${item.borderColor}`}
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-md ${item.bgColor}`}>
              <Icon className={`h-3.5 w-3.5 ${item.color}`} />
            </div>
            <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};

export default WorkflowSidebar;
