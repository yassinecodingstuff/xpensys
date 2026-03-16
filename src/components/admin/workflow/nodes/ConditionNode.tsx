import type { FC } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';

export interface ConditionNodeData {
  label: string;
  conditionType?: string;
  conditionValue?: string | number;
}

export const ConditionNode: FC<NodeProps<ConditionNodeData>> = ({ data, selected }) => {
  return (
    <div
      className={`
        min-w-[220px] rounded-xl border-2 border-yellow-500 bg-white p-4 shadow-sm
        ${selected ? 'ring-2 ring-primary-500 ring-offset-2' : 'hover:shadow-md'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-yellow-500"
      />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
          <GitBranch className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-yellow-600">Condition</div>
          <div className="text-sm font-semibold text-gray-900">{data.label}</div>
        </div>
      </div>

      {/* Deux sorties : Oui et Non */}
      <div className="mt-4 flex justify-between px-4">
        <div className="relative text-xs text-gray-500">
          Oui
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            className="!-bottom-4 !left-1/2 !h-3 !w-3 !-translate-x-1/2 !border-2 !border-white !bg-green-500"
          />
        </div>
        <div className="relative text-xs text-gray-500">
          Non
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            className="!-bottom-4 !left-1/2 !h-3 !w-3 !-translate-x-1/2 !border-2 !border-white !bg-red-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ConditionNode;
