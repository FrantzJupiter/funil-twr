"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Megaphone, FileText, ClipboardList, ShoppingCart, CheckCircle,
  LayoutTemplate, ArrowDownToLine, Trash2, ChevronLeft, ChevronRight, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
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
  ReactFlowInstance,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FunnelNode from './FunnelNode';

const nodeTypes = { customFunnelNode: FunnelNode };

const PREDEFINED_STEPS = [
  {
    label: 'Anúncio',
    icon: Megaphone,
    color: 'text-orange-400',
    bg: 'bg-orange-950/40 hover:bg-orange-900/60',
    border: 'border-orange-800/50',
    dot: 'bg-orange-400',
    data: { label: 'Anúncio', stepType: 'Anúncio', visitors: 5000, conversions: 400 },
  },
  {
    label: 'Landing Page',
    icon: FileText,
    color: 'text-sky-400',
    bg: 'bg-sky-950/40 hover:bg-sky-900/60',
    border: 'border-sky-800/50',
    dot: 'bg-sky-400',
    data: { label: 'Landing Page', stepType: 'Landing Page', visitors: 400, conversions: 120 },
  },
  {
    label: 'Formulário',
    icon: ClipboardList,
    color: 'text-pink-400',
    bg: 'bg-pink-950/40 hover:bg-pink-900/60',
    border: 'border-pink-800/50',
    dot: 'bg-pink-400',
    data: { label: 'Formulário', stepType: 'Formulário', visitors: 120, conversions: 60 },
  },
  {
    label: 'Checkout',
    icon: ShoppingCart,
    color: 'text-amber-400',
    bg: 'bg-amber-950/40 hover:bg-amber-900/60',
    border: 'border-amber-800/50',
    dot: 'bg-amber-400',
    data: { label: 'Checkout', stepType: 'Checkout', visitors: 60, conversions: 25 },
  },
  {
    label: 'Confirmação',
    icon: CheckCircle,
    color: 'text-teal-400',
    bg: 'bg-teal-950/40 hover:bg-teal-900/60',
    border: 'border-teal-800/50',
    dot: 'bg-teal-400',
    data: { label: 'Confirmação', stepType: 'Confirmação', visitors: 25, conversions: 25 },
  },
  {
    label: 'Topo de Funil',
    icon: LayoutTemplate,
    color: 'text-blue-400',
    bg: 'bg-blue-950/40 hover:bg-blue-900/60',
    border: 'border-blue-800/50',
    dot: 'bg-blue-400',
    data: { label: 'Nova Etapa', stepType: 'Topo de Funil', visitors: 0, conversions: 0 },
  },
];

const STORAGE_KEY = 'twr-funnel-builder-v1';

function loadFromStorage(): { nodes: Node[]; edges: Edge[] } | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(nodes: Node[], edges: Edge[]) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  } catch {}
}

const defaultNodes: Node[] = [
  {
    id: '1',
    type: 'customFunnelNode',
    position: { x: 240, y: 60 },
    data: { label: 'Anúncio Instagram', stepType: 'Anúncio', visitors: 5000, conversions: 400 },
  },
  {
    id: '2',
    type: 'customFunnelNode',
    position: { x: 240, y: 340 },
    data: { label: 'Landing Page', stepType: 'Landing Page', visitors: 400, conversions: 120 },
  },
];
const defaultEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
];

function FunnelBuilderInner() {
  const [nodes, setNodes] = useState<Node[]>(() => loadFromStorage()?.nodes ?? defaultNodes);
  const [edges, setEdges] = useState<Edge[]>(() => loadFromStorage()?.edges ?? defaultEdges);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { setCenter } = useReactFlow();
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleType = useRef<'source' | 'target' | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage(nodes, edges);
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 1500);
    }, 600);
    return () => clearTimeout(timer);
  }, [nodes, edges]);

  const onNodesChange: OnNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)), []
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)), []
  );
  const onConnect: OnConnect = useCallback(params => {
    connectingNodeId.current = null;
    connectingHandleType.current = null;
    setEdges(eds => addEdge({ ...params, animated: true }, eds));
  }, []);

  const onConnectStart = useCallback((_: any, params: any) => {
    connectingNodeId.current = params.nodeId;
    connectingHandleType.current = params.handleType;
  }, []);

  const onConnectEnd = useCallback((event: any) => {
    if (!connectingNodeId.current || !rfInstance.current) return;
    const target = event.target as HTMLElement;
    if (!target.classList.contains('react-flow__pane')) return;

    const originNodeId = connectingNodeId.current;
    const handleType   = connectingHandleType.current;
    connectingNodeId.current  = null;
    connectingHandleType.current = null;

    const clientX = 'clientX' in event ? event.clientX : event.changedTouches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : event.changedTouches[0].clientY;
    const position = rfInstance.current.screenToFlowPosition({ x: clientX, y: clientY });

    const newNodeId = uuidv4();
    const newNode: Node = {
      id: newNodeId,
      type: 'customFunnelNode',
      position,
      data: {
        label: 'Nova Etapa',
        stepType: handleType === 'target' ? 'Topo de Funil' : 'Meio de Funil',
        visitors: 0,
        conversions: 0,
      },
    };
    const newEdge: Edge = {
      id: uuidv4(),
      source: handleType === 'target' ? newNodeId : originNodeId,
      target: handleType === 'target' ? originNodeId : newNodeId,
      animated: true,
    };
    setNodes(nds => nds.concat(newNode));
    setEdges(eds => eds.concat(newEdge));
  }, []);

  const handleSidebarStep = useCallback((step: (typeof PREDEFINED_STEPS)[number]) => {
    setNodes(currentNodes => {
      const existing = currentNodes.find(n => n.data?.stepType === step.data.stepType);

      if (existing) {
        const w = (existing.measured?.width as number | undefined) ?? 300;
        const h = (existing.measured?.height as number | undefined) ?? 220;
        setTimeout(() => {
          setCenter(
            existing.position.x + w / 2,
            existing.position.y + h / 2,
            { zoom: 1.15, duration: 550 }
          );
        }, 30);
        return currentNodes.map(n => ({ ...n, selected: n.id === existing.id })) as Node[];
      }

      const pos = rfInstance.current
        ? rfInstance.current.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          })
        : { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 };

      const newNode: Node = {
        id: uuidv4(),
        type: 'customFunnelNode',
        position: pos,
        selected: true,
        data: { ...step.data },
      };
      return [...(currentNodes.map(n => ({ ...n, selected: false })) as Node[]), newNode];
    });
  }, [setCenter]);

  const handleAddNode = () => {
    const pos = rfInstance.current
      ? rfInstance.current.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        })
      : { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 };

    setNodes(nds => [
      ...nds,
      {
        id: uuidv4(),
        type: 'customFunnelNode',
        position: pos,
        data: { label: 'Nova Etapa', stepType: 'Meio de Funil', visitors: 0, conversions: 0 },
      },
    ]);
  };

  const clearCanvas = () => {
    if (confirm('Limpar todo o funil? Esta ação não pode ser desfeita.')) {
      setNodes([]);
      setEdges([]);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'funil.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="h-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-5 shadow-sm z-20 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title={sidebarOpen ? 'Fechar painel' : 'Abrir painel'}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            TWR — Criador de Funil
          </h1>
          {savedIndicator && (
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium animate-pulse">
              Salvo ✓
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAddNode}
            size="sm"
            className="gap-1.5 rounded-full text-xs cursor-pointer dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            <Plus size={13} />
            Adicionar Etapa
          </Button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <button
            onClick={exportJSON}
            title="Exportar JSON"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <ArrowDownToLine size={15} />
          </button>
          <button
            onClick={clearCanvas}
            title="Limpar canvas"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
          >
            <Trash2 size={15} />
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div
          style={{ width: sidebarOpen ? 208 : 0 }}
          className="shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
        >
          <aside className="w-[208px] h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col gap-1 overflow-y-auto px-3 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-1 whitespace-nowrap">
              Etapas
            </p>
            {PREDEFINED_STEPS.map((step) => {
              const Icon = step.icon;
              const exists = mounted && nodes.some(n => n.data?.stepType === step.data.stepType);
              return (
                <button
                  key={step.label}
                  onClick={() => handleSidebarStep(step)}
                  title={exists ? `Selecionar "${step.label}"` : `Adicionar "${step.label}"`}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap ${step.bg} ${step.border}`}
                >
                  <Icon size={14} className={`shrink-0 ${step.color}`} />
                  <span className={`text-xs font-medium ${step.color}`}>{step.label}</span>
                  {exists && (
                    <span className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${step.dot}`} />
                  )}
                </button>
              );
            })}
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[9px] text-slate-400 dark:text-slate-600 text-center px-1 leading-relaxed">
                Clique para adicionar ou selecionar. Arraste os handles para conectar.
              </p>
            </div>
          </aside>
        </div>

        <div className="flex-1 h-full relative outline-none">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onInit={inst => { rfInstance.current = inst; }}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            deleteKeyCode={['Backspace', 'Delete']}
            selectionKeyCode="Shift"
            multiSelectionKeyCode="Shift"
          >
            <Background color="#94a3b8" gap={20} size={1} style={{ opacity: 0.25 }} />
            <Controls className="[&_.react-flow__controls-button]:!bg-slate-700 [&_.react-flow__controls-button]:!border-slate-600 [&_.react-flow__controls-button]:!shadow-none [&_.react-flow__controls-button:hover]:!bg-slate-600 [&_.react-flow__controls-button_svg]:!fill-slate-100" />
            <MiniMap
              zoomable
              pannable
              nodeColor="#64748b"
              maskColor="rgba(2,6,23,0.65)"
              style={{
                backgroundColor: 'rgb(15 23 42)',
                border: '1px solid rgb(51 65 85)',
                borderRadius: 12,
              }}
            />
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