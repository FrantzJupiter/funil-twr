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
  // Cores das arestas: ajustar aqui muda todas as conexões.
  // Escolhi tons neutros para garantir contraste em ambos os temas.
  // Para destacar uma etapa, altere `stroke` ou `strokeWidth` dinamicamente.
  stroke: currentTheme === 'dark' ? '#94a3b8' : '#334155',
  strokeWidth: 2.5
});

// Cria uma aresta consistente: id único, animação e estilo por tema.
// Alterar aqui para ajustar animação/espessura/cor global das conexões.
const createEdge = (source: string, target: string, currentTheme: string | undefined): Edge => ({
  id: uuidv4(),
  source,
  target,
  animated: true,
  style: getEdgeStyle(currentTheme)
});
    // O componente `FunnelBuilderInner` é o núcleo da aplicação, responsável por gerenciar o estado dos nós e arestas, lidar com as interações do usuário e renderizar a interface do construtor de funil. Ele utiliza hooks do React para controlar o estado e os efeitos colaterais, além de integrar com a biblioteca React Flow para a manipulação visual do grafo. A lógica de inserção inteligente é implementada para facilitar a organização automática dos nós ao serem arrastados e soltos no canvas, garantindo uma experiência de usuário fluida e intuitiva.
function FunnelBuilderInner() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const [nodes, setNodes] = useState<FunnelNodeType[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<{ id: string; x: number; y: number } | null>(null);

  const { setCenter, screenToFlowPosition } = useReactFlow();

  // o trecho a seguir é responsável por carregar o estado salvo do funil quando o componente é montado e salvá-lo sempre que houver mudanças nos nós ou arestas. O estado `mounted` é usado para garantir que a renderização ocorra apenas após o carregamento dos dados, evitando problemas de hidratação(ou seja, garantir que o estado do lado do cliente corresponda ao estado renderizado no servidor). 
  useEffect(() => {
    setMounted(true);
    const saved = loadFunnel();
    if (saved) { 
      setNodes(saved.nodes as FunnelNodeType[]); 
      setEdges(saved.edges); 
    }
  }, []);

  // Sempre que os nós ou arestas mudarem, o estado atualizado é salvo. O `mounted` é verificado para evitar salvar um estado vazio antes do carregamento inicial.
  useEffect(() => { if (mounted) saveFunnel(nodes, edges); }, [nodes, edges, mounted]);
  
  // Quando o tema é alterado, atualizamos o estilo de todas as arestas para garantir que elas se adaptem ao novo tema.
  useEffect(() => {
    setEdges(eds => eds.map(e => ({ ...e, style: getEdgeStyle(currentTheme) })));
  }, [currentTheme]);

  // As funções `onNodesChange` e `onEdgesChange` são callbacks que lidam com as mudanças nos nós e arestas, respectivamente. Elas utilizam as funções `applyNodeChanges` e `applyEdgeChanges` da biblioteca React Flow para aplicar as alterações de forma imutável, garantindo que o estado seja atualizado corretamente sem mutações diretas. O uso de `useCallback` otimiza a performance, evitando a criação de novas funções a cada renderização.
  const onNodesChange: OnNodesChange<FunnelNodeType> = useCallback(cs => setNodes(nds => applyNodeChanges(cs, nds) as FunnelNodeType[]), []);
  const onEdgesChange: OnEdgesChange = useCallback(cs => setEdges(eds => applyEdgeChanges(cs, eds)), []);
  
  // A função `onConnect` é chamada quando o usuário conecta dois nós. Ela verifica se a conexão já existe ou se o usuário está tentando conectar um nó a ele mesmo, e somente adiciona a nova aresta se for uma conexão válida e única. O estilo da nova aresta é definido de acordo com o tema atual.
  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => {
      const isDuplicate = eds.some(e => 
        (e.source === params.source && e.target === params.target) ||
        (e.source === params.target && e.target === params.source)
      );
      // Quando o usuário conecta dois nós, adiciona-se a edge.
      // Evita duplicatas e conexões para o mesmo nó.
      if (isDuplicate || params.source === params.target) return eds;
      return addEdge(createEdge(params.source!, params.target!, currentTheme), eds);
    });
  }, [currentTheme]);

  // Se o usuário soltar a conexão no canvas (não em outro nó), criamos
  // automaticamente um novo nó na posição do drop e conectamos à origem.
  // Útil para fluxos rápidos de arrastar-conectar durante modelagem.
  const onConnectEnd = useCallback((event: any, connectionState: any) => {

    
    if (!connectionState.isValid) { // Soltou fora de um nó, cria um novo nó conectado à origem.
      // `fromId` é o ID do nó de origem da conexão.
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
        
        // o trecho a seguir adiciona o novo nó ao estado, garantindo que ele seja o único selecionado, e cria uma nova aresta conectando o nó de origem ao novo nó. 
        setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), newNode]);
        const isTarget = connectionState.fromHandle?.type === 'target';
        const sourceId = isTarget ? id : fromId;
        const targetId = isTarget ? fromId : id;
        setEdges(eds => [...eds, createEdge(sourceId, targetId, currentTheme)]);
      }
    }
  }, [screenToFlowPosition, currentTheme]);// A função `onEdgeContextMenu` é chamada quando o usuário clica com o botão direito em uma aresta. Ela previne o menu de contexto padrão do navegador e remove a aresta clicada do estado

// A função `onEdgeMouseEnter` é chamada quando o mouse entra em uma aresta. Ela define o estado `hoveredEdge` com as coordenadas do mouse e o ID da aresta, o que é usado para exibir uma dica de ferramenta personalizada.
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    setHoveredEdge(null);
  }, []);

// A função `onEdgeMouseMove` é chamada quando o mouse se move sobre uma aresta. Ela atualiza as coordenadas do estado `hoveredEdge` para que a dica de ferramenta siga o cursor.
  const onEdgeMouseEnter = useCallback((event: React.MouseEvent, edge: Edge) => {
    setHoveredEdge({ id: edge.id, x: event.clientX, y: event.clientY });
  }, []);

  // A função `onEdgeMouseLeave` é chamada quando o mouse sai de uma aresta. Ela limpa o estado `hoveredEdge`, fazendo com que a dica de ferramenta desapareça.
  const onEdgeMouseMove = useCallback((event: React.MouseEvent) => {
    if (hoveredEdge) setHoveredEdge(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
  }, [hoveredEdge]);

  const onEdgeMouseLeave = useCallback(() => setHoveredEdge(null), []);

  /**
 * Lógica de inserção inteligente:
 * Detecta se um nó foi solto entre dois nós já conectados.
 * Se sim, divide a linha (edge) e empurra os nós subsequentes para baixo,
 * mantendo o alinhamento e o espaçamento vertical consistente.
 */
  const processInsertion = useCallback((draggedNode: Node, currentNodes: FunnelNodeType[], currentEdges: Edge[]) => {

    // Calcula a posição final do nó arrastado, ajustando para o grid.
    let finalX = Math.round(draggedNode.position.x / FUNNEL_METRICS.GRID_SNAP) * FUNNEL_METRICS.GRID_SNAP;
    let finalY = Math.round(draggedNode.position.y / FUNNEL_METRICS.GRID_SNAP) * FUNNEL_METRICS.GRID_SNAP;

    // Verifica se o nó foi solto entre dois nós conectados por uma aresta.
    const edgeToSplit = currentEdges.find(e => {
      const source = currentNodes.find(n => n.id === e.source);
      const target = currentNodes.find(n => n.id === e.target);
      if (!source || !target) return false;
      const isBetweenY = finalY > source.position.y && finalY < target.position.y;
      const midX = (source.position.x + target.position.x) / 2;
      return isBetweenY && Math.abs(finalX - midX) <= FUNNEL_METRICS.SPLIT_TOLERANCE_X;
    });

    // Se encontrou uma aresta para dividir, ajusta as posições e arestas.
    if (edgeToSplit) {
      const source = currentNodes.find(n => n.id === edgeToSplit.source);
      const target = currentNodes.find(n => n.id === edgeToSplit.target);
      if (source && target) {
        finalX = source.position.x;
        finalY = source.position.y + FUNNEL_METRICS.SPACING_Y;
        const expectedTargetY = finalY + FUNNEL_METRICS.SPACING_Y;
        const diff = expectedTargetY - target.position.y;

        // Atualiza as arestas: remove a antiga e adiciona as duas novas.
        setEdges(eds => [
          ...eds.filter(e => e.id !== edgeToSplit.id && e.source !== draggedNode.id && e.target !== draggedNode.id),
          createEdge(edgeToSplit.source, draggedNode.id, currentTheme),
          createEdge(draggedNode.id, edgeToSplit.target, currentTheme)
        ]);

        // Atualiza os nós: posiciona o nó arrastado e empurra os nós subsequentes para baixo.
        return currentNodes.map(n => {
          if (n.id === draggedNode.id) return { ...n, position: { x: finalX, y: finalY } };
          if (n.position.y >= target.position.y) return { ...n, position: { ...n.position, y: n.position.y + diff } };
          return n;
        });
      }
    }

    // Se não encontrou uma aresta para dividir, apenas posiciona o nó arrastado na posição final ajustada.
    let safety = 0;
    let hasOverlap = true;
    while (hasOverlap && safety < FUNNEL_METRICS.MAX_SAFETY_LOOPS) {
      hasOverlap = false;

      // Verifica se a posição final do nó arrastado se sobrepõe a algum outro nó. Se sim, ajusta a posição para evitar a sobreposição.
      for (const other of currentNodes) {
        if (other.id === draggedNode.id) continue;
        if (Math.abs(finalX - other.position.x) < FUNNEL_METRICS.SAFETY_X && Math.abs(finalY - other.position.y) < FUNNEL_METRICS.SAFETY_Y) {
          hasOverlap = true; 
          finalY = finalY >= other.position.y ? other.position.y + FUNNEL_METRICS.SAFETY_Y : other.position.y - FUNNEL_METRICS.SAFETY_Y;
        }
      }
      safety++;
    }
    // Retorna os nós atualizados, posicionando o nó arrastado na posição final ajustada. Se houve sobreposição, a posição foi ajustada para evitar isso.
    return currentNodes.map(n => n.id === draggedNode.id ? { ...n, position: { x: finalX, y: finalY } } : n);
  }, [currentTheme]);

  // useCallback é usado para evitar renderizações desnecessárias dos componentes de nós e linhas ao manipular o canvas.
  
  const onNodeDragStop = useCallback((_: any, node: Node) => {
    // Quando o usuário solta um nó após arrastá-lo, esta função é chamada. Ela verifica se mais de um nó está selecionado (o que indicaria que o usuário está movendo um grupo de nós) e, se não for o caso, chama a função `processInsertion` para verificar se o nó foi solto entre dois nós conectados e ajustar as posições e arestas conforme necessário. O estado dos nós é atualizado com base no resultado da função `processInsertion`.
    setNodes(nds => {
      
      const selectedCount = nds.filter(n => n.selected).length;
      if (selectedCount > 1) return nds;
      
      return processInsertion(node, nds, edges);
    });
  }, [edges, processInsertion, setNodes]);

  // A função `handleSidebarStep` é chamada quando o usuário clica em um passo pré-definido na barra lateral. Ela cria um novo nó com os dados do passo selecionado, posiciona-o à direita do nó mais à direita (ou em uma posição padrão se não houver nós) e o seleciona. Após um breve atraso, a função centraliza a visualização no novo nó para garantir que ele esteja visível para o usuário.
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

// O trecho a seguir adiciona o novo nó ao estado, garantindo que ele seja o único selecionado, e depois centraliza a visualização no novo nó para garantir que ele esteja visível para o usuário.
    setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), newNode]);
    setTimeout(() => {
        setCenter(newX + FUNNEL_METRICS.CENTER_OFFSET_X, newY + FUNNEL_METRICS.CENTER_OFFSET_Y, { zoom: 1, duration: FUNNEL_METRICS.ANIMATION_DURATION });
    }, 50);
  }, [nodes, setCenter]);

// A função `handleAddFreeNode` é chamada quando o usuário clica no botão "Nova Etapa" na barra superior. Ela cria um novo nó do tipo "Topo de Funil" com uma posição inicial centralizada na tela, garantindo que ele seja o único selecionado.
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
    setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), newNode]); // Adiciona o novo nó ao estado, garantindo que ele seja o único selecionado.
  };

  if (!mounted) return null; // Evita renderização até que o estado seja carregado, prevenindo problemas de hidratação.

  return (
    // O contêiner principal do construtor de funil é um `div` que ocupa toda a tela e tem um fundo que se adapta ao tema atual. Ele também inclui estilos personalizados para os nós, arestas, controles e a área de seleção do React Flow, garantindo uma aparência consistente e integrada com o design geral da aplicação. A estrutura interna inclui um cabeçalho fixo com o título e os botões de ação, uma barra lateral para adicionar etapas pré-definidas e a área principal onde o canvas do React Flow é renderizado.
    <div className="fixed inset-0 w-screen h-screen flex flex-col font-sans overflow-hidden transition-colors duration-500" style={{ background: currentTheme === 'dark' ? 'linear-gradient(to bottom right, #000000, #0a192f)' : 'linear-gradient(to bottom right, #e2e8f0, #94a3b8)', zIndex: 0 }}>
      <style>{`

      /* Estilos personalizados para React Flow, adaptando cores e transições ao tema atual. */

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

      {/* Estilos para a dica de ferramenta personalizada, garantindo boa visibilidade e contraste em ambos os temas. */}
      {hoveredEdge && (
        <div
          className="fixed z-[9999] pointer-events-none px-2.5 py-1.5 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-[11px] font-bold rounded shadow-xl backdrop-blur-sm transition-opacity"
          style={{ left: hoveredEdge.x + 15, top: hoveredEdge.y - 15 }}
        >
          Clique com o botão direito para excluir linha
        </div>
      )}

      {/* cabeçalho. */}
      <header className="h-16 flex items-center justify-between px-6 z-50 bg-white/5 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">TWR — Criador de Funil</h1>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-1">Desafio Técnico Frontend</span>
        </div>
        {/*
        botões Nova Etapa, Limpar Funil e alternância de tema. O botão "Nova Etapa" chama a função `handleAddFreeNode` para adicionar um novo nó ao canvas. O botão de limpar funil solicita confirmação do usuário antes de limpar os nós e arestas. A alternância de tema é feita através do componente `ThemeToggle`, que permite ao usuário mudar entre os temas claro e escuro.
        */}
        <div className="flex items-center">
          <div className="mr-[15px]">
            <Button onClick={handleAddFreeNode} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 h-10 font-bold text-[13px] transition-all shadow-lg flex items-center justify-center gap-2">
              <Plus size={16} strokeWidth={3} /> Nova Etapa
            </Button>
          </div>

          {/* botão de limpar funil */}
          <div className="flex items-center gap-3">
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
            <button onClick={() => { if(confirm('Limpar funil?')){setNodes([]); setEdges([]);} }} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-all border border-white/10 cursor-pointer"><Trash2 size={18} /></button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
          
            <ThemeToggle /> {/* Componente para alternar entre temas claro e escuro.*/}
          
          </div>
        </div>
      </header>


      <div className="flex flex-1 relative overflow-hidden"> {/* barra lateral e botão para esconder. */} 

        {/* barra lateral.*/}
        <div className={`absolute top-0 left-0 h-full z-40 flex pointer-events-none transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-[170px]'}`}>
          <aside style={{ backgroundColor: currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.32)', backdropFilter: 'blur(6px)' }} className="w-[170px] h-full border-r border-slate-200 dark:border-slate-800 px-3 py-5 overflow-y-auto shadow-2xl pointer-events-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-4 px-1">ADICIONAR ETAPAS</p>
            <div className="flex flex-col gap-[4px]"> 
              {PREDEFINED_STEPS.map((step) => ( // Para cada etapa pré-definida, renderiza um botão na barra lateral. O botão inclui um ícone, um rótulo e uma cor que se adapta ao tema atual. Quando o usuário clica no botão, a função `handleSidebarStep` é chamada para adicionar a etapa correspondente ao canvas.
                <button key={step.label} onClick={() => handleSidebarStep(step)} className="group w-full h-10 flex items-center px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-left border-none cursor-pointer">
                  <div className={`w-5 flex items-center justify-center mr-3 ${step.color}`}><step.icon size={16} strokeWidth={2.5} /></div>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex-1">{step.label}</span>
                  <Plus size={14} className="opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" strokeWidth={2.5} />
                </button>
              ))}

            </div>
          </aside>

          {/* botão de esconder barra lateral.*/}
          <div className="pt-6 ml-[-1px] pointer-events-auto">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ backgroundColor: currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)' }} className="w-8 h-10 flex items-center justify-center border border-slate-300 dark:border-slate-800 rounded-r-lg shadow-md text-slate-600 dark:text-blue-400 transition-all cursor-pointer">
              <ChevronLeft size={16} className={`transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>

        {/* área principal do canvas. O componente `ReactFlow` é renderizado aqui, recebendo os nós, arestas, tipos de nós e os callbacks para lidar com as mudanças e interações. Ele também inclui o plano de fundo, controles e mini mapa para facilitar a navegação e visualização do funil.*/}
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