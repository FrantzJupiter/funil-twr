"use client";

import React, { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from "./ThemeToggle";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import FunnelNode from './FunnelNode';

const nodeTypes = {
  customFunnelNode: FunnelNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'customFunnelNode',
    position: { x: 250, y: 150 },
    data: { 
      label: 'Anúncio Instagram', 
      stepType: 'Topo de Funil',
      visitors: 5000, 
      conversions: 350 
    },
  },
];

const initialEdges: Edge[] = [];

export default function FunnelBuilder() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleType = useRef<'source' | 'target' | null>(null);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      connectingNodeId.current = null;
      connectingHandleType.current = null;
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    []
  );

  const onConnectStart = useCallback((_: any, params: any) => {
    connectingNodeId.current = params.nodeId;
    connectingHandleType.current = params.handleType;
  }, []);

  const onConnectEnd = useCallback(
    (event: any) => {
      if (!connectingNodeId.current || !reactFlowInstance) return;

      const targetIsPane = event.target.classList.contains('react-flow__pane');

      if (targetIsPane) {
        const originNodeId = connectingNodeId.current;
        const handleType = connectingHandleType.current;

        connectingNodeId.current = null;
        connectingHandleType.current = null;

        const clientX = 'clientX' in event ? event.clientX : event.changedTouches[0].clientX;
        const clientY = 'clientY' in event ? event.clientY : event.changedTouches[0].clientY;

        const position = reactFlowInstance.screenToFlowPosition({
          x: clientX,
          y: clientY,
        });

        const newNodeId = uuidv4();

        const newNode: Node = {
          id: newNodeId,
          type: 'customFunnelNode',
          position,
          data: { 
            label: 'Nova Etapa', 
            stepType: handleType === 'target' ? 'Topo de Funil' : 'Meio de Funil',
            visitors: 0, 
            conversions: 0 
          },
        };

        const newEdge: Edge = {
          id: uuidv4(),
          source: handleType === 'target' ? newNodeId : originNodeId,
          target: handleType === 'target' ? originNodeId : newNodeId,
          animated: true,
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) => eds.concat(newEdge));
      }
    },
    [reactFlowInstance]
  );

  const handleAddNode = () => {
    const newNode: Node = {
      id: uuidv4(),
      type: 'customFunnelNode',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: 'Nova Etapa', stepType: 'Fundo de Funil', visitors: 0, conversions: 0 },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50">
      <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shadow-sm z-10 transition-colors duration-300">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">TWR - Criador de Funil</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle /> 
          <Button onClick={handleAddNode} className="gap-2 cursor-pointer rounded-full dark:bg-blue-600 dark:hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Adicionar Etapa
          </Button>
        </div>
      </header>

      <div className="flex-1 w-full h-full relative outline-none">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          selectionKeyCode="Shift"
          multiSelectionKeyCode="Shift"
        >
          <Background color="#333b46" gap={16} />
          <Controls />
          <MiniMap zoomable pannable nodeClassName={() => 'bg-blue-500'} />
        </ReactFlow>
      </div>
    </div>
  );
}