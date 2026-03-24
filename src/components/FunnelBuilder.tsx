"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Megaphone, FileText, ClipboardList, ShoppingCart, CheckCircle,
  LayoutTemplate, Trash2, ChevronLeft, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from 'next-themes';
import {
  ReactFlow, Background, Controls, MiniMap,
  applyNodeChanges, applyEdgeChanges, addEdge,
  Edge, OnNodesChange, OnEdgesChange, OnConnect,
  useReactFlow, ReactFlowProvider, Node, Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import FunnelNode from './FunnelNode';
import { loadFunnel, saveFunnel } from '@/lib/storage';
import { FunnelNodeType, FunnelStepType } from '@/types/funnel';
import { FUNNEL_METRICS } from '@/lib/constants';

const nodeTypes = { customFunnelNode: FunnelNode };

const PREDEFINED_STEPS = [
  { label: 'Anúncio', icon: Megaphone, color: 'text-orange-700 dark:text-orange-500', data: { label: 'Anúncio', stepType: 'Anúncio' as FunnelStepType, visitors: 5000, conversions: 400 } },
  { label: 'Landing Page', icon: FileText, color: 'text-sky-700 dark:text-sky-500', data: { label: 'Landing Page', stepType: 'Landing Page' as FunnelStepType, visitors: 400, conversions: 120 } },
  { label: 'Formulário', icon: ClipboardList, color: 'text-pink-700 dark:text-pink-500', data: { label: 'Formulário', stepType: 'Formulário' as FunnelStepType, visitors: 120, conversions: 60 } },
  { label: 'Checkout', icon: ShoppingCart, color: 'text-amber-700 dark:text-amber-500', data: { label: 'Checkout', stepType: 'Checkout' as FunnelStepType, visitors: 60, conversions: 25 } },
  { label: 'Confirmação', icon: CheckCircle, color: 'text-teal-700 dark:text-teal-500', data: { label: 'Confirmação', stepType: 'Confirmação' as FunnelStepType, visitors: 25, conversions: 25 } },
  { label: 'Topo de Funil', icon: LayoutTemplate, color: 'text-blue-700 dark:text-blue-500', data: { label: 'Nova Etapa', stepType: 'Topo de Funil' as FunnelStepType, visitors: 0, conversions: 0 } },
];

const getEdgeStyle = (currentTheme: string | undefined) => ({
  stroke: currentTheme === 'dark' ? '#94a3b8' : '#334155',
  strokeWidth: 2.5
});

const createEdge = (source: string, target: string, currentTheme: string | undefined): Edge => ({
  id: uuidv4(),
  source,
  target,
  animated: true,
  style: getEdgeStyle(currentTheme)
});

function FunnelBuilderInner() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const [nodes, setNodes] = useState<FunnelNodeType[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<{ id: string; x: number; y: number } | null>(null);

  const { setCenter, screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    setMounted(true);
    const saved = loadFunnel();
    if (saved) { 
      setNodes(saved.nodes as FunnelNodeType[]); 
      setEdges(saved.edges); 
    }
  }, []);

  useEffect(() => { if (mounted) saveFunnel(nodes, edges); }, [nodes, edges, mounted]);

  useEffect(() => {
    setEdges(eds => eds.map(e => ({ ...e, style: getEdgeStyle(currentTheme) })));
  }, [currentTheme]);

  const onNodesChange: OnNodesChange<FunnelNodeType> = useCallback(cs => setNodes(nds => applyNodeChanges(cs, nds) as FunnelNodeType[]), []);
  const onEdgesChange: OnEdgesChange = useCallback(cs => setEdges(eds => applyEdgeChanges(cs, eds)), []);
  
  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => {
      const isDuplicate = eds.some(e => 
        (e.source === params.source && e.target === params.target) ||
        (e.source === params.target && e.target === params.source)
      );
      if (isDuplicate || params.source === params.target) return eds;
      return addEdge(createEdge(params.source!, params.target!, currentTheme), eds);
    });
  }, [currentTheme]);

  const onConnectEnd = useCallback((event: any, connectionState: any) => {
    if (!connectionState.isValid) {
      const fromId = connectionState.fromNode?.id || connectionState.fromNodeId;
      if (fromId) {
        const id = uuidv4();
        const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
        const pos = screenToFlowPosition({ x: clientX, y: clientY });
        const newNode: FunnelNodeType = {
          id,
          type: 'customFunnelNode',
          position: { 
            x: Math.round(pos.x / FUNNEL_METRICS.GRID_SNAP) * FUNNEL_METRICS.GRID_SNAP, 
            y: Math.round(pos.y / FUNNEL_METRICS.GRID_SNAP) * FUNNEL_METRICS.GRID_SNAP 
          },
          data: { label: 'Nova Etapa', stepType: 'Topo de Funil', visitors: 0, conversions: 0 },
          selected: true
        };
        setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), newNode]);
        const isTarget = connectionState.fromHandle?.type === 'target';
        const sourceId = isTarget ? id : fromId;
        const targetId = isTarget ? fromId : id;
        setEdges(eds => [...eds, createEdge(sourceId, targetId, currentTheme)]);
      }
    }
  }, [screenToFlowPosition, currentTheme]);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    setHoveredEdge(null);
  }, []);

  const onEdgeMouseEnter = useCallback((event: React.MouseEvent, edge: Edge) => {
    setHoveredEdge({ id: edge.id, x: event.clientX, y: event.clientY });
  }, []);

  const onEdgeMouseMove = useCallback((event: React.MouseEvent) => {
    if (hoveredEdge) setHoveredEdge(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
  }, [hoveredEdge]);

  const onEdgeMouseLeave = useCallback(() => setHoveredEdge(null), []);

  const processInsertion = useCallback((draggedNode: Node, currentNodes: FunnelNodeType[], currentEdges: Edge[]) => {
    let finalX = Math.round(draggedNode.position.x / FUNNEL_METRICS.GRID_SNAP) * FUNNEL_METRICS.GRID_SNAP;
    let finalY = Math.round(draggedNode.position.y / FUNNEL_METRICS.GRID_SNAP) * FUNNEL_METRICS.GRID_SNAP;

    const edgeToSplit = currentEdges.find(e => {
      const source = currentNodes.find(n => n.id === e.source);
      const target = currentNodes.find(n => n.id === e.target);
      if (!source || !target) return false;
      const isBetweenY = finalY > source.position.y && finalY < target.position.y;
      const midX = (source.position.x + target.position.x) / 2;
      return isBetweenY && Math.abs(finalX - midX) <= FUNNEL_METRICS.SPLIT_TOLERANCE_X;
    });

    if (edgeToSplit) {
      const source = currentNodes.find(n => n.id === edgeToSplit.source);
      const target = currentNodes.find(n => n.id === edgeToSplit.target);
      if (source && target) {
        finalX = source.position.x;
        finalY = source.position.y + FUNNEL_METRICS.SPACING_Y;
        const expectedTargetY = finalY + FUNNEL_METRICS.SPACING_Y;
        const diff = expectedTargetY - target.position.y;

        setEdges(eds => [
          ...eds.filter(e => e.id !== edgeToSplit.id && e.source !== draggedNode.id && e.target !== draggedNode.id),
          createEdge(edgeToSplit.source, draggedNode.id, currentTheme),
          createEdge(draggedNode.id, edgeToSplit.target, currentTheme)
        ]);

        return currentNodes.map(n => {
          if (n.id === draggedNode.id) return { ...n, position: { x: finalX, y: finalY } };
          if (n.position.y >= target.position.y) return { ...n, position: { ...n.position, y: n.position.y + diff } };
          return n;
        });
      }
    }

    let safety = 0;
    let hasOverlap = true;
    while (hasOverlap && safety < FUNNEL_METRICS.MAX_SAFETY_LOOPS) {
      hasOverlap = false;
      for (const other of currentNodes) {
        if (other.id === draggedNode.id) continue;
        if (Math.abs(finalX - other.position.x) < FUNNEL_METRICS.SAFETY_X && Math.abs(finalY - other.position.y) < FUNNEL_METRICS.SAFETY_Y) {
          hasOverlap = true; 
          finalY = finalY >= other.position.y ? other.position.y + FUNNEL_METRICS.SAFETY_Y : other.position.y - FUNNEL_METRICS.SAFETY_Y;
        }
      }
      safety++;
    }
    return currentNodes.map(n => n.id === draggedNode.id ? { ...n, position: { x: finalX, y: finalY } } : n);
  }, [currentTheme]);

  const onNodeDragStop = useCallback((_: any, node: Node) => {
    setNodes(nds => {
      const selectedCount = nds.filter(n => n.selected).length;
      if (selectedCount > 1) return nds;
      
      return processInsertion(node, nds, edges);
    });
  }, [edges, processInsertion, setNodes]);

  const handleSidebarStep = useCallback((step: typeof PREDEFINED_STEPS[0]) => {
    const newNodeId = uuidv4();
    const rightmostNode = nodes.length > 0 ? nodes.reduce((prev, curr) => (curr.position.x > prev.position.x ? curr : prev)) : null;
    const lowestNode = nodes.length > 0 ? nodes.reduce((prev, curr) => (curr.position.y > prev.position.y ? curr : prev)) : null;
    const newX = rightmostNode ? rightmostNode.position.x + FUNNEL_METRICS.SAFETY_X : 240;
    const newY = lowestNode ? lowestNode.position.y : 60;
    const newNode: FunnelNodeType = {
      id: newNodeId, type: 'customFunnelNode', position: { x: newX, y: newY },
      data: { ...step.data }, selected: true
    };
    setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), newNode]);
    setTimeout(() => {
        setCenter(newX + FUNNEL_METRICS.CENTER_OFFSET_X, newY + FUNNEL_METRICS.CENTER_OFFSET_Y, { zoom: 1, duration: FUNNEL_METRICS.ANIMATION_DURATION });
    }, 50);
  }, [nodes, setCenter]);

  const handleAddFreeNode = () => {
    const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const newNode: FunnelNodeType = {
      id: uuidv4(), type: 'customFunnelNode',
      position: { 
        x: Math.round(pos.x / FUNNEL_METRICS.GRID_SNAP) * FUNNEL_METRICS.GRID_SNAP, 
        y: Math.round(pos.y / FUNNEL_METRICS.GRID_SNAP) * FUNNEL_METRICS.GRID_SNAP 
      },
      data: { label: 'Nova Etapa', stepType: 'Topo de Funil', visitors: 0, conversions: 0 },
      selected: true
    };
    setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), newNode]);
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col font-sans overflow-hidden transition-colors duration-500" style={{ background: currentTheme === 'dark' ? 'linear-gradient(to bottom right, #000000, #0a192f)' : 'linear-gradient(to bottom right, #e2e8f0, #94a3b8)', zIndex: 0 }}>
      <style>{`
        .react-flow__node:not(.dragging) { transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .react-flow__edge-path { transition: d 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        
        .react-flow__controls-button {
          background-color: ${currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)'} !important;
          border: 1px solid ${currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
        }
        .react-flow__controls-button svg { fill: ${currentTheme === 'dark' ? '#f8fafc' : '#1e293b'} !important; }
        .react-flow__edge:hover .react-flow__edge-path {
          stroke: #ef4444 !important;
          stroke-width: 4px !important;
          cursor: pointer !important;
        }
        .react-flow__selectionpane {
          background: rgba(59, 130, 246, 0.1) !important;
          border: 1px solid rgba(59, 130, 246, 0.5) !important;
        }
      `}</style>

      {hoveredEdge && (
        <div 
          className="fixed z-[9999] pointer-events-none px-2.5 py-1.5 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-[11px] font-bold rounded shadow-xl backdrop-blur-sm transition-opacity"
          style={{ left: hoveredEdge.x + 15, top: hoveredEdge.y - 15 }}
        >
          Clique com o botão direito para excluir linha
        </div>
      )}

      <header className="h-16 flex items-center justify-between px-6 z-50 bg-white/5 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">TWR — Criador de Funil</h1>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-1">Desafio Técnico Frontend</span>
        </div>
        <div className="flex items-center">
          <div className="mr-[15px]">
            <Button onClick={handleAddFreeNode} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 h-10 font-bold text-[13px] transition-all shadow-lg flex items-center justify-center gap-2">
              <Plus size={16} strokeWidth={3} /> Nova Etapa
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
            <button onClick={() => { if(confirm('Limpar funil?')){setNodes([]); setEdges([]);} }} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-all border border-white/10 cursor-pointer"><Trash2 size={18} /></button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <div className={`absolute top-0 left-0 h-full z-40 flex pointer-events-none transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-[170px]'}`}>
          <aside style={{ backgroundColor: currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.32)', backdropFilter: 'blur(6px)' }} className="w-[170px] h-full border-r border-slate-200 dark:border-slate-800 px-3 py-5 overflow-y-auto shadow-2xl pointer-events-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-4 px-1">ADICIONAR ETAPAS</p>
            <div className="flex flex-col gap-[4px]">
              {PREDEFINED_STEPS.map((step) => (
                <button key={step.label} onClick={() => handleSidebarStep(step)} className="group w-full h-10 flex items-center px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-left border-none cursor-pointer">
                  <div className={`w-5 flex items-center justify-center mr-3 ${step.color}`}><step.icon size={16} strokeWidth={2.5} /></div>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex-1">{step.label}</span>
                  <Plus size={14} className="opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" strokeWidth={2.5} />
                </button>
              ))}
            </div>
          </aside>
          <div className="pt-6 ml-[-1px] pointer-events-auto">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ backgroundColor: currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)' }} className="w-8 h-10 flex items-center justify-center border border-slate-300 dark:border-slate-800 rounded-r-lg shadow-md text-slate-600 dark:text-blue-400 transition-all cursor-pointer">
              <ChevronLeft size={16} className={`transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>

        <div className={`flex-1 transition-[margin] duration-300 ${sidebarOpen ? 'ml-[170px]' : 'ml-0'} relative`}>
          <ReactFlow 
            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onConnectEnd={onConnectEnd} onNodeDragStop={onNodeDragStop}
            onEdgeContextMenu={onEdgeContextMenu} onEdgeMouseEnter={onEdgeMouseEnter} onEdgeMouseMove={onEdgeMouseMove} onEdgeMouseLeave={onEdgeMouseLeave}
            snapToGrid snapGrid={[FUNNEL_METRICS.GRID_SNAP, FUNNEL_METRICS.GRID_SNAP]} fitView
            proOptions={{ hideAttribution: true }}
            connectionRadius={80}
            panOnDrag={[1, 2]}
            selectionOnDrag={false} 
          >
            <Background color={currentTheme === 'dark' ? '#94a3b8' : '#334155'} gap={FUNNEL_METRICS.GRID_SNAP} size={1} style={{ opacity: 0.35 }} />
            <Controls position="bottom-left" showInteractive={false} className="!mb-4 !ml-4" />
            <MiniMap position="top-right" nodeColor="#3b82f6" maskColor="rgba(0,0,0,0.1)" className="dark:bg-slate-900 !mt-2 !mr-2" pannable zoomable />
          </ReactFlow>
          <div className="absolute bottom-4 right-4 z-50 pointer-events-none opacity-40 hover:opacity-100 transition-opacity flex flex-col items-end">
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Luis Frantz Granado Junior</p>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-500 mt-0.5">Frontend Engineer • Juiz de Fora, MG</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FunnelBuilder() {
  return <ReactFlowProvider><FunnelBuilderInner /></ReactFlowProvider>;
}