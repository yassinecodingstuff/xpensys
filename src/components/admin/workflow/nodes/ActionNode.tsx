import type { FC } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Zap } from 'lucide-react';

export interface ActionNodeData {
  label: string;
  actionType?: string;
  actionConfig?: Record<string, unknown>;
}

export const ActionNode: FC<NodeProps<ActionNodeData>> = ({ data, selected }) => {
  return (
    <div
      className={`
        min-w-[220px] rounded-xl border-2 border-purple-500 bg-white p-4 shadow-sm
        ${selected ? 'ring-2 ring-primary-500 ring-offset-2' : 'hover:shadow-md'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-purple-500"
      />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
          <Zap className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-purple-600">Action</div>
          <div className="text-sm font-semibold text-gray-900">{data.label}</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-purple-500"
      />
    </div>
  );
};

export default ActionNode;
