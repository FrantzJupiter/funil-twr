"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Megaphone, FileText, ClipboardList, ShoppingCart, CheckCircle,
  LayoutTemplate, Trash2, ChevronLeft, Menu, Plus
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

const nodeTypes = { customFunnelNode: FunnelNode };

const PREDEFINED_STEPS = [
  { label: 'Anúncio', icon: Megaphone, color: 'text-orange-500', data: { label: 'Anúncio', stepType: 'Anúncio' as FunnelStepType, visitors: 5000, conversions: 400 } },
  { label: 'Landing Page', icon: FileText, color: 'text-sky-500', data: { label: 'Landing Page', stepType: 'Landing Page' as FunnelStepType, visitors: 400, conversions: 120 } },
  { label: 'Formulário', icon: ClipboardList, color: 'text-pink-500', data: { label: 'Formulário', stepType: 'Formulário' as FunnelStepType, visitors: 120, conversions: 60 } },
  { label: 'Checkout', icon: ShoppingCart, color: 'text-amber-500', data: { label: 'Checkout', stepType: 'Checkout' as FunnelStepType, visitors: 60, conversions: 25 } },
  { label: 'Confirmação', icon: CheckCircle, color: 'text-teal-500', data: { label: 'Confirmação', stepType: 'Confirmação' as FunnelStepType, visitors: 25, conversions: 25 } },
  { label: 'Topo de Funil', icon: LayoutTemplate, color: 'text-blue-500', data: { label: 'Nova Etapa', stepType: 'Topo de Funil' as FunnelStepType, visitors: 0, conversions: 0 } },
];

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

  const onNodesChange: OnNodesChange<FunnelNodeType> = useCallback(cs => setNodes(nds => applyNodeChanges(cs, nds) as FunnelNodeType[]), []);
  const onEdgesChange: OnEdgesChange = useCallback(cs => setEdges(eds => applyEdgeChanges(cs, eds)), []);
  
  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => {
      const exists = eds.some(e => e.source === params.source && e.target === params.target);
      if (exists) return eds;
      const newEdge: Edge = { ...params, id: uuidv4(), animated: true, style: { stroke: currentTheme === 'dark' ? '#94a3b8' : '#334155', strokeWidth: 2.5 } } as Edge;
      return addEdge(newEdge, eds);
    });
  }, [currentTheme]);

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

  const onNodeDragStop = useCallback((_: any, draggedNode: Node) => {
    let finalX = Math.round(draggedNode.position.x / 20) * 20;
    let finalY = Math.round(draggedNode.position.y / 20) * 20;

    const edgeToSplit = edges.find(e => {
      if (e.source === draggedNode.id || e.target === draggedNode.id) return false;
      const sourceNode = nodes.find(n => n.id === e.source);
      const targetNode = nodes.find(n => n.id === e.target);
      if (!sourceNode || !targetNode) return false;
      const isBetweenY = finalY > sourceNode.position.y && finalY < targetNode.position.y;
      const midX = (sourceNode.position.x + targetNode.position.x) / 2;
      return isBetweenY && Math.abs(finalX - midX) <= 120;
    });

    if (edgeToSplit) {
      const sourceNode = nodes.find(n => n.id === edgeToSplit.source);
      const targetNode = nodes.find(n => n.id === edgeToSplit.target);
      
      if (sourceNode && targetNode) {
        const newFinalX = sourceNode.position.x;
        const newFinalY = sourceNode.position.y + 240;
        const diffY = (newFinalY + 240) - targetNode.position.y;

        setNodes(nds => nds.map(n => {
          if (n.id === draggedNode.id) return { ...n, position: { x: newFinalX, y: newFinalY } };
          if (n.position.y >= targetNode.position.y) return { ...n, position: { x: n.position.x, y: n.position.y + diffY } };
          return n;
        }));

        setEdges(eds => [
          ...eds.filter(e => e.id !== edgeToSplit.id),
          { id: uuidv4(), source: edgeToSplit.source, target: draggedNode.id, animated: true, style: { stroke: currentTheme === 'dark' ? '#94a3b8' : '#334155', strokeWidth: 2.5 } },
          { id: uuidv4(), source: draggedNode.id, target: edgeToSplit.target, animated: true, style: { stroke: currentTheme === 'dark' ? '#94a3b8' : '#334155', strokeWidth: 2.5 } }
        ]);
        return;
      }
    }

    setNodes(currentNodes => {
      let snapped = false;
      const connectedEdges = edges.filter(e => e.source === draggedNode.id || e.target === draggedNode.id);
      connectedEdges.forEach(edge => {
        const otherId = edge.source === draggedNode.id ? edge.target : edge.source;
        const otherNode = currentNodes.find(n => n.id === otherId);
        if (otherNode && Math.abs(finalX - otherNode.position.x) <= 40) {
          finalX = otherNode.position.x; snapped = true;
        }
      });

      let safety = 0;
      let hasOverlap = true;
      while (hasOverlap && safety < 10) {
        hasOverlap = false;
        for (const other of currentNodes) {
          if (other.id === draggedNode.id) continue;
          if (Math.abs(finalX - other.position.x) < 340 && Math.abs(finalY - other.position.y) < 240) {
            hasOverlap = true; finalY = finalY >= other.position.y ? other.position.y + 240 : other.position.y - 240;
          }
        }
        safety++;
      }
      return currentNodes.map(n => n.id === draggedNode.id ? { ...n, position: { x: finalX, y: finalY } } : n);
    });
  }, [edges, nodes, currentTheme]);

  const handleSidebarStep = useCallback((step: typeof PREDEFINED_STEPS[0]) => {
    const existing = nodes.find(n => n.data?.stepType === step.data.stepType);
    if (existing) {
      setTimeout(() => setCenter(existing.position.x + 140, existing.position.y + 90, { zoom: 1, duration: 800 }), 30);
      setNodes(nds => nds.map(n => ({ ...n, selected: n.id === existing.id })));
      return;
    }

    const lowestNode = nodes.length > 0 ? nodes.reduce((p, c) => (c.position.y > p.position.y ? c : p)) : null;
    const newX = lowestNode ? lowestNode.position.x : 240;
    const newY = lowestNode ? lowestNode.position.y + 240 : 60;
    const newNodeId = uuidv4();

    const newNode: FunnelNodeType = {
      id: newNodeId, type: 'customFunnelNode', position: { x: newX, y: newY },
      data: { ...step.data }, selected: true
    };

    setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), newNode]);
    if (lowestNode) {
      setEdges(eds => [...eds, { id: uuidv4(), source: lowestNode.id, target: newNodeId, animated: true, style: { stroke: currentTheme === 'dark' ? '#94a3b8' : '#334155', strokeWidth: 2.5 } }]);
    }
    setTimeout(() => setCenter(newX + 140, newY + 90, { zoom: 1, duration: 800 }), 50);
  }, [nodes, setCenter, currentTheme]);

  const handleAddFreeNode = () => {
    const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const newNode: FunnelNodeType = {
      id: uuidv4(), type: 'customFunnelNode',
      position: { x: Math.round(pos.x / 20) * 20, y: Math.round(pos.y / 20) * 20 },
      data: { label: 'Nova Etapa', stepType: 'Topo de Funil', visitors: 0, conversions: 0 },
      selected: true
    };
    setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), newNode]);
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-screen flex flex-col font-sans overflow-hidden transition-colors duration-500" style={{ background: currentTheme === 'dark' ? 'linear-gradient(to bottom right, #000000, #0a192f)' : 'linear-gradient(to bottom right, #e2e8f0, #94a3b8)' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .react-flow__node:not(.dragging) { transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .react-flow__controls-button {
          background-color: ${currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)'} !important;
          fill: ${currentTheme === 'dark' ? '#f8fafc' : '#1e293b'} !important;
          border: 1px solid ${currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
          backdrop-filter: blur(4px);
        }
        .react-flow__edge-path { stroke: ${currentTheme === 'dark' ? '#94a3b8' : '#334155'} !important; stroke-width: 2.5px !important; }
      `}} />

      {hoveredEdge && (
        <div className="fixed z-[9999] pointer-events-none px-2 py-1 bg-slate-900/90 text-white text-[10px] font-bold rounded shadow-xl backdrop-blur-sm border border-white/10" style={{ left: hoveredEdge.x + 15, top: hoveredEdge.y - 10 }}>
          Botão direito para apagar
        </div>
      )}

      <header className="h-16 flex items-center justify-between px-6 z-50 bg-white/5 backdrop-blur-md border-b border-white/10">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">TWR — Criador de Funil</h1>
        <div className="flex items-center">
          <div className="mr-[15px]"><Button onClick={handleAddFreeNode} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 h-9 font-semibold text-xs transition-all shadow-lg"><Plus size={14} className="mr-2" /> Nova Etapa</Button></div>
          <div className="flex items-center gap-3">
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
            <button onClick={() => { if(confirm('Limpar funil?')){setNodes([]); setEdges([]);} }} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-all border border-white/10 cursor-pointer"><Trash2 size={18} /></button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <div className={`absolute top-0 left-0 h-full z-40 flex transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-[170px]'}`}>
          <aside style={{ backgroundColor: currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.32)', backdropFilter: 'blur(6px)' }} className="w-[170px] h-full border-r border-slate-200 dark:border-slate-800 px-3 py-5 overflow-y-auto shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 px-1">Etapas</p>
            <div className="flex flex-col gap-[4px]">
              {PREDEFINED_STEPS.map((step) => (
                <button key={step.label} onClick={() => handleSidebarStep(step)} className="group w-full h-10 flex items-center px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-left border-none cursor-pointer">
                  <div className={`w-5 flex items-center justify-center mr-3 ${step.color}`}><step.icon size={16} /></div>
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 flex-1">{step.label}</span>
                  <Plus size={14} className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                </button>
              ))}
            </div>
          </aside>
          <div className="pt-6 ml-[-1px]">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ backgroundColor: currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)' }} className="w-8 h-10 flex items-center justify-center border border-slate-300 dark:border-slate-800 rounded-r-lg shadow-md text-slate-600 dark:text-blue-400 transition-all cursor-pointer">
              <ChevronLeft size={16} className={`transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>

        <div className={`flex-1 transition-[margin] duration-300 ${sidebarOpen ? 'ml-[170px]' : 'ml-0'}`}>
          <ReactFlow 
            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onNodeDragStop={onNodeDragStop}
            onEdgeContextMenu={onEdgeContextMenu} onEdgeMouseEnter={onEdgeMouseEnter} onEdgeMouseMove={onEdgeMouseMove} onEdgeMouseLeave={onEdgeMouseLeave}
            snapToGrid snapGrid={[20, 20]} fitView
          >
            <Background color={currentTheme === 'dark' ? '#94a3b8' : '#334155'} gap={20} size={1} style={{ opacity: 0.35 }} />
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap nodeColor="#3b82f6" maskColor="rgba(0,0,0,0.1)" className="dark:bg-slate-900" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export default function FunnelBuilder() {
  return <ReactFlowProvider><FunnelBuilderInner /></ReactFlowProvider>;
}