import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider, useNodesState, useEdgesState, MarkerType } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

import WorkflowHeader from '../../components/admin/workflow/WorkflowHeader';
import WorkflowSidebar from '../../components/admin/workflow/WorkflowSidebar';
import WorkflowCanvas from '../../components/admin/workflow/WorkflowCanvas';
import NodeConfigPanel from '../../components/admin/workflow/NodeConfigPanel';

// Mock workflow names mapping
const workflowNames: Record<string, string> = {
  'wf-001': 'Validation notes de frais',
  'wf-002': 'Approbation missions',
  'wf-003': 'Demande d\'avance',
  'wf-004': 'Remboursement automatique',
  'wf-005': 'Clôture de mission',
  'new': 'Nouveau workflow',
};

// Workflow de démo - circuit de validation normal
const defaultNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 300, y: 0 },
    data: { label: 'Note de frais soumise', triggerType: 'expense_submitted' },
  },
  {
    id: 'condition-1',
    type: 'condition',
    position: { x: 300, y: 150 },
    data: { label: 'Montant > 500€ ?', conditionType: 'amount_greater', conditionValue: '500' },
  },
  // Branche OUI : Approbations successives Manager → N+2
  {
    id: 'approval-manager-high',
    type: 'approval',
    position: { x: 80, y: 320 },
    data: { label: 'Validation Manager', approver: 'manager', timeout: 24, timeoutAction: 'reminder', step: 1 },
  },
  {
    id: 'approval-n2',
    type: 'approval',
    position: { x: 80, y: 480 },
    data: { label: 'Validation N+2', approver: 'n2', timeout: 48, timeoutAction: 'escalate', step: 2 },
  },
  // Branche NON : Une seule approbation Manager
  {
    id: 'approval-manager-low',
    type: 'approval',
    position: { x: 520, y: 320 },
    data: { label: 'Validation Manager', approver: 'manager', timeout: 24, timeoutAction: 'reminder' },
  },
  // Action commune
  {
    id: 'action-1',
    type: 'action',
    position: { x: 300, y: 640 },
    data: { label: 'Notifier Finance', actionType: 'notification', message: 'Note de frais validée.' },
  },
  // Fin
  {
    id: 'end-1',
    type: 'end',
    position: { x: 300, y: 780 },
    data: { label: 'Terminé', status: 'approved' },
  },
];

const defaultEdges: Edge[] = [
  // Trigger → Condition
  { id: 'e1', source: 'trigger-1', target: 'condition-1', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#94a3b8' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
  // Condition OUI → Manager (montant élevé)
  { id: 'e2', source: 'condition-1', sourceHandle: 'yes', target: 'approval-manager-high', label: 'Oui', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' } },
  // Manager → N+2 (approbations successives)
  { id: 'e3', source: 'approval-manager-high', target: 'approval-n2', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#3b82f6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } },
  // N+2 → Action
  { id: 'e4', source: 'approval-n2', target: 'action-1', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#94a3b8' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
  // Condition NON → Manager (montant faible)
  { id: 'e5', source: 'condition-1', sourceHandle: 'no', target: 'approval-manager-low', label: 'Non', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#ef4444' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' } },
  // Manager (low) → Action
  { id: 'e6', source: 'approval-manager-low', target: 'action-1', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#94a3b8' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
  // Action → End
  { id: 'e7', source: 'action-1', target: 'end-1', type: 'smoothstep', style: { strokeWidth: 2, stroke: '#94a3b8' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
];

const WorkflowBuilderInner: FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const initialName = isNew ? '' : (workflowNames[id] || 'Workflow sans nom');
  const initialStatus = isNew ? 'draft' : 'published';

  const [workflowName, setWorkflowName] = useState(initialName);
  const [status, setStatus] = useState<'draft' | 'published'>(initialStatus as 'draft' | 'published');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(isNew ? [] : defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(isNew ? [] : defaultEdges);

  const handleSave = useCallback(() => {
    console.log('Saving workflow...', { nodes, edges });
    // TODO: API call to save
  }, [nodes, edges]);

  const handlePublish = useCallback(() => {
    setStatus('published');
    console.log('Publishing workflow...');
    // TODO: API call to publish
  }, []);

  const handleNodeSelect = useCallback((node: Node | null) => {
    setSelectedNode(node);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data } : n))
      );
      // Update selected node too
      setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data } : prev));
    },
    [setNodes]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      // Supprimer aussi les edges connectés à ce nœud
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[57px] z-40 flex flex-col bg-white md:left-60">
      {/* Header */}
      <WorkflowHeader
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        status={status}
        onSave={handleSave}
        onPublish={handlePublish}
        autoEditName={isNew}
      />

      {/* Navbar des éléments */}
      <WorkflowSidebar />

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        {/* Canvas */}
        <main className="min-w-0 flex-1 bg-slate-50">
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setNodes={setNodes}
            setEdges={setEdges}
            onNodeSelect={handleNodeSelect}
          />
        </main>

        {/* Panel droit (config du nœud sélectionné) */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={handleClosePanel}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
          />
        )}
      </div>
    </div>
  );
};

const WorkflowBuilder: FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilder;
