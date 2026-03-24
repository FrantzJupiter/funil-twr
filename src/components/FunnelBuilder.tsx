"use client";

import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );


  const handleAddNode = () => {
    const newNode: Node = {
      id: uuidv4(),
      type: 'customFunnelNode',
      position: { 
        x: Math.random() * 200 + 100, 
        y: Math.random() * 200 + 100 
      },
      data: { 
        label: 'Nova Etapa', 
        stepType: 'Meio de Funil',
        visitors: 0, 
        conversions: 0 
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
        <h1 className="text-xl font-bold text-slate-800">TWR - Funil</h1>
        
        <Button onClick={handleAddNode} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Etapa
        </Button>
      </header>

      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls />
          <MiniMap zoomable pannable nodeClassName={() => 'bg-blue-500'} />
        </ReactFlow>
      </div>
    </div>
  );
}