import type { FC } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Play } from 'lucide-react';

export interface TriggerNodeData {
  label: string;
  triggerType?: string;
}

export const TriggerNode: FC<NodeProps<TriggerNodeData>> = ({ data, selected }) => {
  return (
    <div
      className={`
        min-w-[220px] rounded-xl border-2 border-green-500 bg-white p-4 shadow-sm
        ${selected ? 'ring-2 ring-primary-500 ring-offset-2' : 'hover:shadow-md'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
          <Play className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-green-600">Déclencheur</div>
          <div className="text-sm font-semibold text-gray-900">{data.label}</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-green-500"
      />
    </div>
  );
};

export default TriggerNode;
