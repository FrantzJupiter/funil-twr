"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Megaphone, FileText, ClipboardList, ShoppingCart, CheckCircle,
  LayoutTemplate, ArrowDownToLine, Trash2, ChevronLeft, Menu, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import {
  ReactFlow, Background, Controls, MiniMap,
  applyNodeChanges, applyEdgeChanges, addEdge,
  Edge, OnNodesChange, OnEdgesChange, OnConnect, OnConnectStart,
  ReactFlowInstance, useReactFlow, ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import FunnelNode from './FunnelNode';
import { loadFunnel, saveFunnel } from '@/lib/storage';
import { FunnelNodeType, FunnelStepType } from '@/types/funnel';

const nodeTypes = { customFunnelNode: FunnelNode };

type PredefinedStep = {
  label: string; icon: React.ElementType; color: string; bg: string; border: string; dot: string;
  data: { label: string; stepType: FunnelStepType; visitors: number; conversions: number; };
};

const PREDEFINED_STEPS: PredefinedStep[] = [
  { label: 'Anúncio', icon: Megaphone, color: 'text-orange-400', bg: 'bg-orange-950/40 dark:hover:bg-orange-900/60 hover:bg-orange-100', border: 'border-orange-800/50', dot: 'bg-orange-400', data: { label: 'Anúncio', stepType: 'Anúncio', visitors: 5000, conversions: 400 } },
  { label: 'Landing Page', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-950/40 dark:hover:bg-sky-900/60 hover:bg-sky-100', border: 'border-sky-800/50', dot: 'bg-sky-400', data: { label: 'Landing Page', stepType: 'Landing Page', visitors: 400, conversions: 120 } },
  { label: 'Formulário', icon: ClipboardList, color: 'text-pink-400', bg: 'bg-pink-950/40 dark:hover:bg-pink-900/60 hover:bg-pink-100', border: 'border-pink-800/50', dot: 'bg-pink-400', data: { label: 'Formulário', stepType: 'Formulário', visitors: 120, conversions: 60 } },
  { label: 'Checkout', icon: ShoppingCart, color: 'text-amber-400', bg: 'bg-amber-950/40 dark:hover:bg-amber-900/60 hover:bg-amber-100', border: 'border-amber-800/50', dot: 'bg-amber-400', data: { label: 'Checkout', stepType: 'Checkout', visitors: 60, conversions: 25 } },
  { label: 'Confirmação', icon: CheckCircle, color: 'text-teal-400', bg: 'bg-teal-950/40 dark:hover:bg-teal-900/60 hover:bg-teal-100', border: 'border-teal-800/50', dot: 'bg-teal-400', data: { label: 'Confirmação', stepType: 'Confirmação', visitors: 25, conversions: 25 } },
  { label: 'Topo de Funil', icon: LayoutTemplate, color: 'text-blue-400', bg: 'bg-blue-950/40 dark:hover:bg-blue-900/60 hover:bg-blue-100', border: 'border-blue-800/50', dot: 'bg-blue-400', data: { label: 'Nova Etapa', stepType: 'Topo de Funil', visitors: 0, conversions: 0 } },
];

const defaultNodes: FunnelNodeType[] = [
  { id: '1', type: 'customFunnelNode', position: { x: 240, y: 60 }, data: { label: 'Anúncio Instagram', stepType: 'Anúncio', visitors: 5000, conversions: 400 } },
];
const defaultEdges: Edge[] = [];

function FunnelBuilderInner() {
  const [nodes, setNodes] = useState<FunnelNodeType[]>(defaultNodes);
  const [edges, setEdges] = useState<Edge[]>(defaultEdges);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { setCenter, screenToFlowPosition, getNode } = useReactFlow();
  const rfInstance = useRef<ReactFlowInstance<FunnelNodeType, Edge> | null>(null);
  
  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleType = useRef<'source' | 'target' | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = loadFunnel();
    if (saved && saved.nodes.length > 0) {
      setNodes(saved.nodes as FunnelNodeType[]);
      setEdges(saved.edges);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => {
      saveFunnel(nodes, edges);
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 1500);
    }, 600);
    return () => clearTimeout(timer);
  }, [nodes, edges, mounted]);

  const onNodesChange: OnNodesChange<FunnelNodeType> = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds) as FunnelNodeType[]), []
  );
  
  const onEdgesChange: OnEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)), []
  );
  
  const onConnect: OnConnect = useCallback(params => {
    setEdges(eds => addEdge({ ...params, animated: true }, eds));
  }, []);

  const onConnectStart: OnConnectStart = useCallback((_, params) => {
    connectingNodeId.current = params.nodeId;
    connectingHandleType.current = params.handleType;
  }, []);

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    if (!connectingNodeId.current) return;
    const target = event.target as HTMLElement;
    if (!target.classList.contains('react-flow__pane')) return;

    const originNodeId = connectingNodeId.current;
    const handleType = connectingHandleType.current;
    connectingNodeId.current = null;
    connectingHandleType.current = null;

    const originNode = getNode(originNodeId) as FunnelNodeType;
    if (!originNode) return;

    const clientX = 'clientX' in event ? event.clientX : event.changedTouches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : event.changedTouches[0].clientY;
    let position = screenToFlowPosition({ x: clientX, y: clientY });

    position.x = Math.round(position.x / 20) * 20;
    position.y = Math.round(position.y / 20) * 20;

    if (handleType === 'source') {
      position.y = Math.max(position.y, originNode.position.y + 260);
    } else {
      position.y = Math.min(position.y, originNode.position.y - 260);
    }

    if (Math.abs(position.x - originNode.position.x) <= 40) {
      position.x = originNode.position.x;
    }

    const newNodeId = uuidv4();
    const newNode: FunnelNodeType = {
      id: newNodeId, type: 'customFunnelNode', position,
      data: { label: 'Nova Etapa', stepType: handleType === 'target' ? 'Topo de Funil' : 'Meio de Funil', visitors: 0, conversions: 0 },
    };
    
    setNodes(nds => nds.concat(newNode));
    setEdges(eds => eds.concat({ id: uuidv4(), source: handleType === 'target' ? newNodeId : originNodeId, target: handleType === 'target' ? originNodeId : newNodeId, animated: true }));
  }, [screenToFlowPosition, getNode]);

  // Lógica Avançada: Drop on Edge dinâmico e Alinhamento Suave (40px)
  const onNodeDragStop = useCallback((_: React.MouseEvent, draggedNode: FunnelNodeType) => {
    setNodes(nds => {
      let finalX = draggedNode.position.x;
      let finalY = draggedNode.position.y;
      let snappedToNeighbor = false;
      
      // 1. Alinhamento Magnético com vizinhos
      const connectedEdges = edges.filter(e => e.source === draggedNode.id || e.target === draggedNode.id);
      connectedEdges.forEach(e => {
        const otherNodeId = e.source === draggedNode.id ? e.target : e.source;
        const otherNode = nds.find(n => n.id === otherNodeId);
        // Margem de 2 pontos (40px)
        if (otherNode && Math.abs(draggedNode.position.x - otherNode.position.x) <= 40) {
          finalX = otherNode.position.x;
          snappedToNeighbor = true;
        }
      });

      // 2. Drop on Edge (Se não fez snap lateral, tenta inserir numa linha)
      if (!snappedToNeighbor) {
        const nodeCenter = { x: draggedNode.position.x + 140, y: draggedNode.position.y + 90 };
        
        const edgeToSplit = edges.find(e => {
          if (e.source === draggedNode.id || e.target === draggedNode.id) return false;
          const sourceNode = nds.find(n => n.id === e.source);
          const targetNode = nds.find(n => n.id === e.target);
          if (!sourceNode || !targetNode) return false;

          const minX = Math.min(sourceNode.position.x, targetNode.position.x) - 40;
          const maxX = Math.max(sourceNode.position.x, targetNode.position.x) + 320;
          const minY = sourceNode.position.y + 180;
          const maxY = targetNode.position.y;

          return nodeCenter.x > minX && nodeCenter.x < maxX && nodeCenter.y > minY && nodeCenter.y < maxY;
        });

        if (edgeToSplit) {
          const sourceNode = nds.find(n => n.id === edgeToSplit.source);
          if (sourceNode) {
            finalX = sourceNode.position.x; // Alinha perfeitamente à linha interrompida
          }
          
          setEdges(eds => [
            ...eds.filter(e => e.id !== edgeToSplit.id),
            { id: uuidv4(), source: edgeToSplit.source, target: draggedNode.id, animated: true },
            { id: uuidv4(), source: draggedNode.id, target: edgeToSplit.target, animated: true }
          ]);
        }
      }

      if (finalX !== draggedNode.position.x || finalY !== draggedNode.position.y) {
        return nds.map(n => n.id === draggedNode.id ? { ...n, position: { x: finalX, y: finalY } } : n);
      }
      return nds;
    });
  }, [edges]);

  const handleSidebarStep = useCallback((step: PredefinedStep) => {
    setNodes(currentNodes => {
      const existing = currentNodes.find(n => n.data?.stepType === step.data.stepType);
      if (existing) {
        setTimeout(() => setCenter(existing.position.x + 140, existing.position.y + 90, { zoom: 1.15, duration: 800 }), 30);
        return currentNodes.map(n => ({ ...n, selected: n.id === existing.id })) as FunnelNodeType[];
      }

      const lowestNode = currentNodes.length > 0 ? currentNodes.reduce((lowest, node) => node.position.y > lowest.position.y ? node : lowest, currentNodes[0]) : null;

      let newX = 240;
      let newY = 100;

      if (lowestNode) {
        newX = lowestNode.position.x;
        newY = lowestNode.position.y + 260; 
      } else if (rfInstance.current) {
        const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        newX = Math.round(pos.x / 20) * 20; 
        newY = Math.round(pos.y / 20) * 20;
      }

      const newNodeId = uuidv4();
      const newNode: FunnelNodeType = { id: newNodeId, type: 'customFunnelNode', position: { x: newX, y: newY }, selected: true, data: { ...step.data } };
      
      if (lowestNode) {
        setEdges(eds => [...eds, { id: uuidv4(), source: lowestNode.id, target: newNodeId, animated: true }]);
      }

      setTimeout(() => setCenter(newX + 140, newY + 90, { zoom: 1, duration: 800 }), 50);
      return [...(currentNodes.map(n => ({ ...n, selected: false })) as FunnelNodeType[]), newNode];
    });
  }, [screenToFlowPosition, setCenter]);

  const handleAddFreeNode = () => {
    const pos = rfInstance.current ? screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }) : { x: 240, y: 100 };
    pos.x = Math.round(pos.x / 20) * 20;
    pos.y = Math.round(pos.y / 20) * 20;

    const newNode: FunnelNodeType = {
      id: uuidv4(), type: 'customFunnelNode', position: pos,
      data: { label: 'Etapa Solta', stepType: 'Topo de Funil', visitors: 0, conversions: 0 },
    };
    setNodes(nds => [...nds, newNode]);
    setTimeout(() => setCenter(pos.x + 140, pos.y + 90, { zoom: 1, duration: 800 }), 50);
  };

  const clearCanvas = () => { if (confirm('Limpar todo o funil?')) { setNodes([]); setEdges([]); saveFunnel([], []); } };

  if (!mounted) return <div className="w-full h-screen bg-slate-50 dark:bg-slate-950" />;

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* INJEÇÃO DE CSS: Alinhamento suave ao soltar (Drag Stop) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .react-flow__node:not(.dragging) {
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
      `}} />

      <header className="h-14 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-5 shadow-sm z-30 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">TWR — Criador de Funil</h1>
          {savedIndicator && <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium animate-pulse">Salvo ✓</span>}
        </div>
        <div className="flex items-center gap-2">
          {/* Botão Renomeado para Nova Etapa */}
          <Button onClick={handleAddFreeNode} size="sm" className="gap-1.5 rounded-full text-xs cursor-pointer dark:bg-blue-600 dark:hover:bg-blue-700 shadow-sm">
            <Plus size={13} /> Nova Etapa
          </Button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          <button onClick={clearCanvas} title="Limpar canvas" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all">
            <Trash2 size={16} />
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 relative w-full h-full">
        {/* SIDEBAR RETRÁTIL PERFEITA: position absolute com translate-x */}
        <div className={`absolute top-0 left-0 h-full z-20 flex transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="w-56 h-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 overflow-y-auto px-3 py-4 flex flex-col gap-1 shadow-[4px_0_24px_rgba(0,0,0,0.05)] relative">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-1 whitespace-nowrap">Etapas Rápidas</p>
            {PREDEFINED_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.label} onClick={() => handleSidebarStep(step)}
                  className={`group relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer ${step.bg} ${step.border}`}
                >
                  <Icon size={14} className={`shrink-0 ${step.color}`} />
                  <span className={`text-xs font-medium ${step.color}`}>{step.label}</span>
                  <Plus size={14} className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400" />
                </button>
              );
            })}
          </div>
          
          {/* O BOTÃO PRESO À BORDA DA SIDEBAR */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="absolute top-4 -right-7 w-7 h-10 flex items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-y border-r border-slate-200 dark:border-slate-800 rounded-r-lg shadow-md text-slate-500 hover:text-blue-500 transition-colors cursor-pointer"
            title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* MAPA: Margem empurra o mapa apenas se a barra estiver aberta para não cobrir o grid */}
        <div className={`flex-1 h-full w-full transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-0'}`}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange as OnNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd as (event: MouseEvent | TouchEvent) => void}
            onNodeDragStop={onNodeDragStop as any}
            onInit={inst => { rfInstance.current = inst; }}
            nodeTypes={nodeTypes}
            fitView fitViewOptions={{ padding: 0.3 }}
            deleteKeyCode={['Backspace', 'Delete']}
            snapToGrid={true} snapGrid={[20, 20]}
          >
            {/* Opacidade aumentada de 0.25 para 0.45 */}
            <Background color="#94a3b8" gap={20} size={1} style={{ opacity: 0.45 }} />
            <Controls className="[&_.react-flow__controls-button]:!bg-white dark:[&_.react-flow__controls-button]:!bg-slate-900 [&_.react-flow__controls-button]:!border-slate-200 dark:[&_.react-flow__controls-button]:!border-slate-800 [&_.react-flow__controls-button_svg]:!fill-slate-600 dark:[&_.react-flow__controls-button_svg]:!fill-blue-400" />            
            <MiniMap zoomable pannable nodeColor="#64748b" maskColor="rgba(2,6,23,0.65)" style={{ backgroundColor: 'rgb(15 23 42)', border: '1px solid rgb(51 65 85)', borderRadius: 12 }} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export default function FunnelBuilder() {
  return (
    <ReactFlowProvider>
      <FunnelBuilderInner />
    </ReactFlowProvider>
  );
}