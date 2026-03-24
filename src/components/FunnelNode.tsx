"use client";

import { Handle, Position, useReactFlow, NodeProps } from '@xyflow/react';
import { MousePointerClick, Users, X, TrendingUp, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { FunnelNodeType } from '@/types/funnel';

const STEP_TYPES = [
  'Topo de Funil',
  'Meio de Funil',
  'Fundo de Funil',
  'Anúncio',
  'Landing Page',
  'Formulário',
  'Checkout',
  'Confirmação',
];

const STEP_TYPE_COLORS: Record<string, string> = {
  'Topo de Funil':  'bg-blue-100/80   dark:bg-blue-900/60   text-blue-800   dark:text-blue-200',
  'Meio de Funil':  'bg-violet-100/80 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200',
  'Fundo de Funil': 'bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
  'Anúncio':        'bg-orange-100/80 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200',
  'Landing Page':   'bg-sky-100/80    dark:bg-sky-900/60    text-sky-800    dark:text-sky-200',
  'Formulário':     'bg-pink-100/80   dark:bg-pink-900/60   text-pink-800   dark:text-pink-200',
  'Checkout':       'bg-amber-100/80  dark:bg-amber-900/60  text-amber-800  dark:text-amber-200',
  'Confirmação':    'bg-teal-100/80   dark:bg-teal-900/60   text-teal-800   dark:text-teal-200',
};

function NumericInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const parsed = parseInt(draft.replace(/\D/g, ''), 10);
    onChange(isNaN(parsed) ? 0 : parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-16 bg-white/60 dark:bg-white/10 border border-blue-400 rounded px-1 text-right outline-none text-xs font-bold text-slate-800 dark:text-white"
      />
    );
  }

  return (
    <strong
      className="cursor-text rounded px-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-white"
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      title="Clique para editar"
    >
      {value.toLocaleString('pt-BR')}
    </strong>
  );
}

export default function FunnelNode({ id, data, selected }: NodeProps<FunnelNodeType>) {
  const { updateNodeData, setNodes } = useReactFlow();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const conversionRate = data.visitors > 0
    ? ((data.conversions / data.visitors) * 100).toFixed(1)
    : '0.0';

  const badgeColor = STEP_TYPE_COLORS[data.stepType]
    ?? 'bg-slate-100/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as globalThis.Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    // 1. TAMANHO FIXO: Largura e Altura explícitas aqui resolvem o bug do minimapa instantaneamente.
    <div style={{ width: 280, height: 175 }} className="relative group font-sans">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-slate-400 border-2 border-slate-600 dark:border-slate-300 z-50"
      />

      <div className={`
        w-full h-full rounded-xl border transition-all duration-300 flex flex-col overflow-visible
        backdrop-blur-xl hover:border-blue-400/50
        ${selected
          ? 'border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.4)] bg-white/95 dark:bg-slate-900/95'
          : 'border-slate-200 dark:border-slate-700 shadow-xl bg-white/80 dark:bg-slate-900/80'
        }
      `}>
        {/* 2. PADDING GARANTIDO: Usando 'style' inline para forçar o espaçamento independente do Tailwind */}
        <div style={{ padding: '20px' }} className="flex flex-col h-full">
          
          <div className="flex items-center justify-between mb-4" ref={dropdownRef}>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all border-none cursor-pointer ${badgeColor}`}
              >
                {data.stepType}
                <ChevronDown size={10} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full mt-1 left-0 z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 min-w-[160px]">
                  {STEP_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => { updateNodeData(id, { stepType: type }); setDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors
                        ${data.stepType === type ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={10} />
              {conversionRate}%
            </div>
          </div>

          <input
            value={data.label}
            onChange={e => updateNodeData(id, { label: e.target.value })}
            placeholder="Nome da etapa..."
            className="w-full text-sm font-bold text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-400 outline-none transition-colors placeholder:text-slate-400"
          />

          <div className="mt-auto flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Visitantes</span>
              </div>
              <NumericInput value={data.visitors} onChange={v => updateNodeData(id, { visitors: v })} />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <MousePointerClick size={13} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>Conversões</span>
              </div>
              <NumericInput value={data.conversions} onChange={v => updateNodeData(id, { conversions: v })} />
            </div>

            <div className="mt-1">
              <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(parseFloat(conversionRate), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão X de excluir */}
      <div className="absolute top-[-12px] right-[-12px] w-8 h-8 flex items-center justify-center z-50 group/btn">
        <button
          onClick={() => setNodes(nds => nds.filter(n => n.id !== id))}
          className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 transition-all duration-300 cursor-pointer outline-none text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:border-red-500 hover:shadow-md active:scale-95"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-slate-400 border-2 border-slate-600 dark:border-slate-300 z-50"
      />
    </div>
  );
}