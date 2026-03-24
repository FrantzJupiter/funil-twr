"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Megaphone, FileText, ClipboardList, ShoppingCart, CheckCircle,
  LayoutTemplate, ArrowDownToLine, Trash2, ChevronLeft, Menu, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from 'next-themes';
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
  { label: 'Anúncio', icon: Megaphone, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100', border: 'border-orange-200 dark:border-orange-800/50', dot: 'bg-orange-400', data: { label: 'Anúncio', stepType: 'Anúncio', visitors: 5000, conversions: 400 } },
  { label: 'Landing Page', icon: FileText, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60', border: 'border-sky-200 dark:border-sky-800/50', dot: 'bg-sky-400', data: { label: 'Landing Page', stepType: 'Landing Page', visitors: 400, conversions: 120 } },
  { label: 'Formulário', icon: ClipboardList, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/60', border: 'border-pink-200 dark:border-pink-800/50', dot: 'bg-pink-400', data: { label: 'Formulário', stepType: 'Formulário', visitors: 120, conversions: 60 } },
  { label: 'Checkout', icon: ShoppingCart, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60', border: 'border-amber-200 dark:border-amber-800/50', dot: 'bg-amber-400', data: { label: 'Checkout', stepType: 'Checkout', visitors: 60, conversions: 25 } },
  { label: 'Confirmação', icon: CheckCircle, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60', border: 'border-teal-200 dark:border-teal-800/50', dot: 'bg-teal-400', data: { label: 'Confirmação', stepType: 'Confirmação', visitors: 25, conversions: 25 } },
  { label: 'Topo de Funil', icon: LayoutTemplate, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60', border: 'border-blue-200 dark:border-blue-800/50', dot: 'bg-blue-400', data: { label: 'Nova Etapa', stepType: 'Topo de Funil', visitors: 0, conversions: 0 } },
];

const defaultNodes: FunnelNodeType[] = [
  { id: '1', type: 'customFunnelNode', position: { x: 240, y: 60 }, data: { label: 'Anúncio Instagram', stepType: 'Anúncio', visitors: 5000, conversions: 400 } },
];
const defaultEdges: Edge[] = [];

function FunnelBuilderInner() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;

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
    setEdges(eds => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: currentTheme === 'dark' ? '#475569' : '#334155', strokeWidth: 2 } 
    }, eds));
  }, [currentTheme]);

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
      position.y = Math.max(position.y, originNode.position.y + 240);
    } else {
      position.y = Math.min(position.y, originNode.position.y - 240);
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
    setEdges(eds => eds.concat({ 
      id: uuidv4(), 
      source: handleType === 'target' ? newNodeId : originNodeId, 
      target: handleType === 'target' ? originNodeId : newNodeId, 
      animated: true,
      style: { stroke: currentTheme === 'dark' ? '#475569' : '#334155', strokeWidth: 2 }
    }));
  }, [screenToFlowPosition, getNode, currentTheme]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, draggedNode: FunnelNodeType) => {
    setNodes(nds => {
      let finalX = draggedNode.position.x;
      let finalY = draggedNode.position.y;
      let snappedToNeighbor = false;
      let shiftY = 0;
      let shiftFromY = 0;
      
      const connectedEdges = edges.filter(e => e.source === draggedNode.id || e.target === draggedNode.id);
      connectedEdges.forEach(e => {
        const otherNodeId = e.source === draggedNode.id ? e.target : e.source;
        const otherNode = nds.find(n => n.id === otherNodeId);
        if (otherNode && Math.abs(draggedNode.position.x - otherNode.position.x) <= 40) {
          finalX = otherNode.position.x;
          snappedToNeighbor = true;
        }
      });

      if (!snappedToNeighbor) {
        const edgeToSplit = edges.find(e => {
          if (e.source === draggedNode.id || e.target === draggedNode.id) return false;
          const sourceNode = nds.find(n => n.id === e.source);
          const targetNode = nds.find(n => n.id === e.target);
          if (!sourceNode || !targetNode) return false;
          const nodeY = draggedNode.position.y;
          const nodeX = draggedNode.position.x;
          const isBetweenY = nodeY > sourceNode.position.y && nodeY < targetNode.position.y;
          const midX = (sourceNode.position.x + targetNode.position.x) / 2;
          const isAlignedX = Math.abs(nodeX - midX) <= 120;
          return isBetweenY && isAlignedX;
        });

        if (edgeToSplit) {
          const sourceNode = nds.find(n => n.id === edgeToSplit.source);
          const targetNode = nds.find(n => n.id === edgeToSplit.target);
          if (sourceNode && targetNode) {
            finalX = sourceNode.position.x; 
            finalY = sourceNode.position.y + 240; 
            const expectedTargetY = finalY + 240; 
            if (targetNode.position.y < expectedTargetY) {
               shiftY = expectedTargetY - targetNode.position.y;
               shiftFromY = targetNode.position.y;
            }
          }
          setEdges(eds => [
            ...eds.filter(e => e.id !== edgeToSplit.id),
            { id: uuidv4(), source: edgeToSplit.source, target: draggedNode.id, animated: true, style: { stroke: currentTheme === 'dark' ? '#475569' : '#334155', strokeWidth: 2 } },
            { id: uuidv4(), source: draggedNode.id, target: edgeToSplit.target, animated: true, style: { stroke: currentTheme === 'dark' ? '#475569' : '#334155', strokeWidth: 2 } }
          ]);
        }
      }

      let hasOverlap = true;
      let escapeHatch = 0; 
      while (hasOverlap && escapeHatch < 10) {
        hasOverlap = false;
        for (const other of nds) {
          if (other.id === draggedNode.id) continue;
          const rect1 = { x: finalX, y: finalY, w: 280, h: 180 };
          const rect2 = { x: other.position.x, y: other.position.y, w: 280, h: 180 };
          const expanded = { x: rect2.x - 40, y: rect2.y - 40, w: rect2.w + 80, h: rect2.h + 80 };
          const isOverlapping = rect1.x < expanded.x + expanded.w && rect1.x + rect1.w > expanded.x && rect1.y < expanded.y + expanded.h && rect1.y + rect1.h > expanded.y;
          if (isOverlapping) {
            hasOverlap = true;
            const dy = finalY - other.position.y;
            finalY = dy >= 0 ? other.position.y + 220 : other.position.y - 220;
          }
        }
        escapeHatch++;
      }

      return nds.map(n => {
        if (n.id === draggedNode.id) return { ...n, position: { x: finalX, y: finalY } };
        if (shiftY > 0 && n.position.y >= shiftFromY && n.id !== draggedNode.id) return { ...n, position: { x: n.position.x, y: n.position.y + shiftY } };
        return n;
      });
    });
  }, [edges, currentTheme]);

  const handleSidebarStep = useCallback((step: PredefinedStep) => {
    setNodes(currentNodes => {
      const existing = currentNodes.find(n => n.data?.stepType === step.data.stepType);
      if (existing) {
        setTimeout(() => setCenter(existing.position.x + 140, existing.position.y + 90, { zoom: 1.15, duration: 800 }), 30);
        return currentNodes.map(n => ({ ...n, selected: n.id === existing.id })) as FunnelNodeType[];
      }
      const lowestNode = currentNodes.length > 0 ? currentNodes.reduce((lowest, node) => node.position.y > lowest.position.y ? node : lowest, currentNodes[0]) : null;
      let newX = 240; let newY = 100;
      if (lowestNode) {
        newX = lowestNode.position.x;
        newY = lowestNode.position.y + 240; 
      } else if (rfInstance.current) {
        const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        newX = Math.round(pos.x / 20) * 20; newY = Math.round(pos.y / 20) * 20;
      }
      const newNodeId = uuidv4();
      const newNode: FunnelNodeType = { id: newNodeId, type: 'customFunnelNode', position: { x: newX, y: newY }, selected: true, data: { ...step.data } };
      if (lowestNode) setEdges(eds => [...eds, { id: uuidv4(), source: lowestNode.id, target: newNodeId, animated: true, style: { stroke: currentTheme === 'dark' ? '#475569' : '#334155', strokeWidth: 2 } }]);
      setTimeout(() => setCenter(newX + 140, newY + 90, { zoom: 1, duration: 800 }), 50);
      return [...(currentNodes.map(n => ({ ...n, selected: false })) as FunnelNodeType[]), newNode];
    });
  }, [screenToFlowPosition, setCenter, currentTheme]);

  const handleAddFreeNode = () => {
    const pos = rfInstance.current ? screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }) : { x: 240, y: 100 };
    pos.x = Math.round(pos.x / 20) * 20; pos.y = Math.round(pos.y / 20) * 20;
    const newNode: FunnelNodeType = { id: uuidv4(), type: 'customFunnelNode', position: pos, data: { label: 'Etapa Solta', stepType: 'Topo de Funil', visitors: 0, conversions: 0 } };
    setNodes(nds => [...nds, newNode]);
    setTimeout(() => setCenter(pos.x + 140, pos.y + 90, { zoom: 1, duration: 800 }), 50);
  };

  const clearCanvas = () => { if (confirm('Limpar todo o funil?')) { setNodes([]); setEdges([]); saveFunnel([], []); } };

  if (!mounted) return <div className="w-full h-screen bg-slate-50 dark:bg-slate-950" />;

  return (
    <div 
      className="w-full h-screen flex flex-col font-sans overflow-hidden transition-colors duration-500"
      style={{
        background: currentTheme === 'dark' 
          ? 'linear-gradient(to bottom right, #000000, #0a192f)' 
          : 'linear-gradient(to bottom right, #e2e8f0, #94a3b8)'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .react-flow__node:not(.dragging) { transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .react-flow__controls-button {
          background-color: ${currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)'} !important;
          border-bottom: 1px solid rgba(0,0,0,0.1) !important;
          fill: ${currentTheme === 'dark' ? '#f8fafc' : '#1e293b'} !important;
          backdrop-filter: blur(4px);
        }
        .react-flow__edge-path {
          stroke: ${currentTheme === 'dark' ? '#475569' : '#334155'} !important;
          stroke-width: 2px !important;
        }
      `}} />

      <header className="h-16 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-6 shadow-sm z-50 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">TWR — Criador de Funil</h1>
          {savedIndicator && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">Salvo ✓</span>}
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleAddFreeNode} size="sm" className="gap-2 rounded-full cursor-pointer dark:bg-blue-600 dark:hover:bg-blue-700 shadow-sm">
            <Plus size={14} /> Nova Etapa
          </Button>
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />
          <button onClick={clearCanvas} title="Limpar canvas" className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer">
            <Trash2 size={18} />
          </button>
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 relative w-full h-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full z-40 flex transition-transform duration-300 ease-in-out shadow-2xl"
          style={{ transform: sidebarOpen ? 'translateX(0px)' : 'translateX(-170px)' }}
        >
          {/* BARRA LATERAL SINCRONIZADA COM A COR DOS CARDS */}
          <aside 
            style={{
               backgroundColor: currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.65)',
               backdropFilter: 'blur(6px)',
               WebkitBackdropFilter: 'blur(6px)'
            }}
            className="w-[170px] h-full border-r border-slate-300 dark:border-slate-800 px-3 py-5 overflow-y-auto"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 px-1 whitespace-nowrap">Etapas</p>
            <div className="flex flex-col gap-2">
              {PREDEFINED_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.label} onClick={() => handleSidebarStep(step)}
                    className={`group relative w-full flex items-center gap-2 px-2 py-2.5 rounded-lg border text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer ${step.bg} ${step.border}`}
                  >
                    <Icon size={14} className={`shrink-0 ${step.color}`} />
                    <span className={`text-xs font-semibold ${step.color}`}>{step.label}</span>
                    <Plus size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400" />
                  </button>
                );
              })}
            </div>
          </aside>
          <div className="relative h-full pt-6">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                 backgroundColor: currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                 backdropFilter: 'blur(4px)',
                 WebkitBackdropFilter: 'blur(4px)'
              }}
              className="absolute top-6 -right-9 w-9 h-12 flex items-center justify-center border border-slate-300 dark:border-slate-800 rounded-r-lg shadow-md text-slate-600 dark:text-blue-400 transition-colors cursor-pointer"
              title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <div 
          className="flex-1 h-full w-full transition-[margin] duration-300 ease-in-out"
          style={{ marginLeft: sidebarOpen ? '170px' : '0px' }}
        >
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
            <Background 
              color={currentTheme === 'dark' ? '#475569' : '#1e293b'} 
              gap={20} 
              size={1.5} 
              style={{ opacity: currentTheme === 'dark' ? 0.6 : 0.8 }} 
            />
            <Controls position="bottom-left" showInteractive={false} />            
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