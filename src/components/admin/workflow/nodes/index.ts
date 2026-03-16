import { TriggerNode } from './TriggerNode';
import { ConditionNode } from './ConditionNode';
import { ApprovalNode } from './ApprovalNode';
import { ActionNode } from './ActionNode';
import { EndNode } from './EndNode';

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  approval: ApprovalNode,
  action: ActionNode,
  end: EndNode,
};

export type NodeType = keyof typeof nodeTypes;

export { TriggerNode, ConditionNode, ApprovalNode, ActionNode, EndNode };
