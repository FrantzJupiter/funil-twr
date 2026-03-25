"use client";

import { Handle, Position, useReactFlow, NodeProps } from '@xyflow/react';
import { 
  Megaphone, FileText, ClipboardList, ShoppingCart, CheckCircle, 
  LayoutTemplate, TrendingUp, ChevronDown, X, Users, MousePointerClick 
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { FunnelNodeType } from '@/types/funnel';
import { FUNNEL_METRICS } from '@/lib/constants';

const ICON_MAP: Record<string, React.ElementType> = {
  'Anúncio': Megaphone,
  'Landing Page': FileText,
  'Formulário': ClipboardList,
  'Checkout': ShoppingCart,
  'Confirmação': CheckCircle,
  'Topo de Funil': LayoutTemplate,
  'Meio de Funil': LayoutTemplate,
  'Fundo de Funil': LayoutTemplate
};

/**
 * COMPONENTE CONTROLADO: NumericInput
 * Isola a lógica de edição inline de métricas, aplicando sanitização de entrada
 * e regras de negócio de limite (clamping), evitando estados inconsistentes na UI.
 */
function NumericInput({ value, onChange, max }: { value: number; onChange: (v: number) => void; max?: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // UX: Foco e seleção automática do texto ao entrar no modo de edição.
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => {
    let parsed = parseInt(draft.replace(/\D/g, ''), 10);
    if (isNaN(parsed)) parsed = 0;
    // Sanitização de Regra de Negócio: Conversões não podem ultrapassar Visitantes.
    if (max !== undefined && parsed > max) parsed = max;
    onChange(parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef} type="text" inputMode="numeric" value={draft}
        onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-16 bg-slate-200 dark:bg-slate-900 border-2 border-blue-500 rounded px-1 text-right outline-none text-xs font-bold text-slate-900 dark:text-white shadow-sm"
      />
    );
  }

  return (
    <strong
      className="cursor-text rounded px-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-white font-sans"
      onClick={() => { setDraft(String(value)); setEditing(true); }}
    >
      {value.toLocaleString('pt-BR')}
    </strong>
  );
}

/**
 * CAMADA DE APRESENTAÇÃO: FunnelNode
 * Componente customizado do React Flow, responsável pelo encapsulamento de estilos (Tailwind)
 * e gestão de interações locais (Hover, Dropdown, Taxa de Conversão).
 */
export default function FunnelNode({ id, data, selected }: NodeProps<FunnelNodeType>) {
  const { setNodes, updateNodeData, getNodes } = useReactFlow();
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const StepIcon = ICON_MAP[data.stepType] || LayoutTemplate;

  // Prevenção contra Divisão por Zero no cálculo da taxa em tempo real.
  const cappedConversions = Math.min(data.conversions, data.visitors);
  const conversionRate = data.visitors > 0 ? ((cappedConversions / data.visitors) * 100).toFixed(1) : '0.0';

  // Listener para fechamento do Dropdown (Click Outside).
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler); 
  }, [dropdownOpen]);

  // Gestão de Deleção em Lote (Multi-seleção).
  const handleDelete = () => {
    if (selected) { 
      setNodes(nds => nds.filter(n => !n.selected)); 
    } else {
      setNodes(nds => nds.filter(n => n.id !== id)); 
    }
  };

  const hasOtherSelectedNodes = getNodes().some(n => n.selected); 
  const showTooltip = isHovered && !selected && hasOtherSelectedNodes;

  return (
    <div 
      style={{ width: FUNNEL_METRICS.NODE_WIDTH, height: FUNNEL_METRICS.NODE_HEIGHT }} 
      className="relative group font-sans" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {showTooltip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-[9999] px-2.5 py-1.5 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-[11px] font-bold rounded shadow-xl backdrop-blur-sm whitespace-nowrap pointer-events-none">
          Clique com Ctrl para selecionar vários
        </div>
      )}

      {/* Handles Dinâmicos: Reagem ao hover para indicar área de conexão. */}
      <Handle type="target" position={Position.Top} style={{ left: '50%', top: '-7px', transform: 'translateX(-50%)', background: currentTheme === 'dark' ? '#94a3b8' : '#475569', width: '14px', height: '14px' }} className="border-2 border-slate-700 dark:border-slate-300 z-50 transition-transform hover:scale-125" />
      
      <div
        style={{
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: '24px', boxSizing: 'border-box',
          backgroundColor: currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.32)',
          borderColor: selected ? (currentTheme === 'dark' ? '#ffffff' : '#3b82f6') : (currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
        } }
        className={`w-full h-full rounded-2xl border flex flex-col transition-all duration-300 shadow-xl ${selected ? (currentTheme === 'dark' ? 'shadow-[0_0_25px_rgba(255,255,255,0.15)]' : 'shadow-[0_0_25px_rgba(59,130,246,0.3)]') : (currentTheme === 'dark' ? 'hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]' : 'hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]')}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(o => !o)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <StepIcon size={12} className="text-blue-600 dark:text-blue-400" />
              {data.stepType} <ChevronDown size={10} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full mt-2 left-0 z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl py-1 min-w-[160px] backdrop-blur-xl">
                {Object.keys(ICON_MAP).map(type => {
                  const MenuIcon = ICON_MAP[type];
                  return (
                    <button key={type} onClick={() => { updateNodeData(id, { stepType: type }); setDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2">
                      <MenuIcon size={14} className="text-blue-600 dark:text-blue-400" /> {type}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={14} /> {conversionRate}%
          </div>
        </div>
        
        <input value={data.label} onChange={e => updateNodeData(id, { label: e.target.value })} className="w-full text-base font-bold text-slate-900 dark:text-white bg-transparent border-none outline-none font-sans mb-auto" />

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold tracking-tight">
            <div className="flex items-center gap-2.5"><Users size={14} /><span>Visitantes</span></div>
            <NumericInput value={data.visitors} onChange={v => updateNodeData(id, { visitors: v })} />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold tracking-tight">
            <div className="flex items-center gap-2.5"><MousePointerClick size={14} /><span>Conversões</span></div>
            <NumericInput value={data.conversions} onChange={v => updateNodeData(id, { conversions: v })} max={data.visitors} />
          </div>
        </div>
      </div>

      {/* Gestão de Z-Index: Garante que o botão de exclusão flutue acima do conteúdo principal do nó. */}
      <button onClick={handleDelete} style={{ top: '-12px', right: '-12px' }} className="absolute w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer z-50"><X size={14} strokeWidth={2.5} /></button>
      <Handle type="source" position={Position.Bottom} style={{ left: '50%', bottom: '-7px', transform: 'translateX(-50%)', background: currentTheme === 'dark' ? '#94a3b8' : '#475569', width: '14px', height: '14px' }} className="border-2 border-slate-700 dark:border-slate-300 z-50 transition-transform hover:scale-125" />
    </div>
  );
}