import type { FC } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { CheckCircle2, XCircle, Ban } from 'lucide-react';

export interface EndNodeData {
  label: string;
  status?: 'approved' | 'rejected' | 'cancelled';
}

const STATUS_CONFIG = {
  approved: {
    borderColor: 'border-green-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    handleColor: '!bg-green-500',
    Icon: CheckCircle2,
  },
  rejected: {
    borderColor: 'border-red-500',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    handleColor: '!bg-red-500',
    Icon: XCircle,
  },
  cancelled: {
    borderColor: 'border-gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    handleColor: '!bg-gray-400',
    Icon: Ban,
  },
};

export const EndNode: FC<NodeProps<EndNodeData>> = ({ data, selected }) => {
  const status = data.status || 'approved';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.approved;
  const Icon = config.Icon;

  return (
    <div
      className={`
        min-w-[200px] rounded-xl border-2 bg-white p-4 shadow-sm
        ${config.borderColor}
        ${selected ? 'ring-2 ring-primary-500 ring-offset-2' : 'hover:shadow-md'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`!h-3 !w-3 !border-2 !border-white ${config.handleColor}`}
      />

      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.textColor}`} />
        </div>
        <div>
          <div className={`text-xs font-medium uppercase tracking-wide ${config.textColor}`}>Fin</div>
          <div className="text-sm font-semibold text-gray-900">{data.label}</div>
        </div>
      </div>
    </div>
  );
};

export default EndNode;
