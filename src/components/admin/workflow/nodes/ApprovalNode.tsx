import type { FC } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { UserCheck } from 'lucide-react';

export interface ApprovalNodeData {
  label: string;
  approver?: string;
  timeout?: number;
  timeoutAction?: string;
  step?: number;
}

export const ApprovalNode: FC<NodeProps<ApprovalNodeData>> = ({ data, selected }) => {
  return (
    <div
      className={`
        min-w-[220px] rounded-xl border-2 border-blue-500 bg-white p-4 shadow-sm
        ${selected ? 'ring-2 ring-primary-500 ring-offset-2' : 'hover:shadow-md'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-blue-500"
      />

      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <UserCheck className="h-5 w-5 text-blue-600" />
          {data.step && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {data.step}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-blue-600">Approbation</div>
          <div className="truncate text-sm font-semibold text-gray-900">{data.label}</div>
          {data.timeout && (
            <div className="text-xs text-gray-500">Timeout: {data.timeout}h</div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-blue-500"
      />
    </div>
  );
};

export default ApprovalNode;
