import type { FC, DragEvent } from 'react';
import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useReactFlow,
  BackgroundVariant,
  MarkerType,
} from 'reactflow';
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeMouseHandler,
  EdgeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Trash2 } from 'lucide-react';
import { nodeTypes } from './nodes';
import type { NodeType } from './nodes';

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodeSelect: (node: Node | null) => void;
}

function getDefaultLabel(type: NodeType): string {
  switch (type) {
    case 'trigger':
      return 'Nouveau déclencheur';
    case 'condition':
      return 'Nouvelle condition';
    case 'approval':
      return 'Nouvelle approbation';
    case 'action':
      return 'Nouvelle action';
    case 'end':
      return 'Fin';
    default:
      return 'Nouveau nœud';
  }
}

function getDefaultData(type: NodeType): Record<string, unknown> {
  const base = { label: getDefaultLabel(type) };
  switch (type) {
    case 'trigger':
      return { ...base, triggerType: 'expense_submitted' };
    case 'condition':
      return { ...base, conditionType: 'amount_greater', conditionValue: '500' };
    case 'approval':
      return { ...base, approver: 'manager', timeout: 48, timeoutAction: 'reminder' };
    case 'action':
      return { ...base, actionType: 'notification', message: '' };
    case 'end':
      return { ...base, status: 'approved' };
    default:
      return base;
  }
}

export const WorkflowCanvas: FC<WorkflowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onNodeSelect,
}) => {
  const reactFlowInstance = useReactFlow();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { strokeWidth: 2, stroke: '#94a3b8' },
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: getDefaultData(type),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onNodeSelect(node);
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
    },
    [onNodeSelect]
  );

  const onEdgeClick: EdgeMouseHandler = useCallback((_event, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    onNodeSelect(null);
  }, [onNodeSelect]);

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
    setSelectedEdgeId(null);
    setSelectedNodeId(null);
  }, [onNodeSelect]);

  // Supprimer l'élément sélectionné
  const deleteSelected = useCallback(() => {
    if (selectedEdgeId) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
      // Supprimer aussi les edges connectés à ce nœud
      setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
      onNodeSelect(null);
    }
  }, [selectedEdgeId, selectedNodeId, setEdges, setNodes, onNodeSelect]);

  // Gestion du clavier pour supprimer
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelected();
      }
    },
    [deleteSelected]
  );

  // Style des edges sélectionnés
  const styledEdges = edges.map((edge) => ({
    ...edge,
    style: {
      ...edge.style,
      strokeWidth: edge.id === selectedEdgeId ? 3 : 2,
      stroke: edge.id === selectedEdgeId ? '#3b82f6' : (edge.style?.stroke || '#94a3b8'),
    },
  }));

  return (
    <div className="relative h-full w-full" onKeyDown={onKeyDown} tabIndex={0}>
      {/* Bouton supprimer pour edge sélectionné (en haut) */}
      {selectedEdgeId && !selectedNodeId && (
        <button
          type="button"
          onClick={deleteSelected}
          className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center justify-center rounded-lg border border-red-200 bg-white p-2 text-red-600 shadow-lg hover:bg-red-50"
          title="Supprimer"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      )}

      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={['Delete', 'Backspace']}
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: '#94a3b8' },
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <Controls className="rounded-lg border border-gray-200 bg-white shadow-sm" />
        <MiniMap
          className="rounded-lg border border-gray-200 bg-white shadow-sm"
          nodeColor={(node) => {
            switch (node.type) {
              case 'trigger':
                return '#22c55e';
              case 'condition':
                return '#eab308';
              case 'approval':
                return '#3b82f6';
              case 'action':
                return '#a855f7';
              case 'end':
                if (node.data?.status === 'rejected') return '#ef4444';
                if (node.data?.status === 'approved') return '#22c55e';
                return '#6b7280';
              default:
                return '#6b7280';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
