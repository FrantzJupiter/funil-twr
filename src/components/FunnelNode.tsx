"use client";

import { Handle, Position, useReactFlow, NodeProps } from '@xyflow/react';
import { MousePointerClick, Users, X, TrendingUp, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { FunnelNodeType } from '@/types/funnel';

function NumericInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => {
    const parsed = parseInt(draft.replace(/\D/g, ''), 10);
    onChange(isNaN(parsed) ? 0 : parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef} type="text" inputMode="numeric" value={draft}
        onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-16 bg-white border border-blue-400 rounded px-1 text-right outline-none text-xs font-bold text-slate-800 dark:text-white"
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

export default function FunnelNode({ id, data, selected }: NodeProps<FunnelNodeType>) {
  const { setNodes, updateNodeData } = useReactFlow();
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const conversionRate = data.visitors > 0 ? ((data.conversions / data.visitors) * 100).toFixed(1) : '0.0';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ width: 280, height: 180 }} className="relative group font-sans">
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ left: '50%', transform: 'translateX(-50%)', background: currentTheme === 'dark' ? '#94a3b8' : '#475569' }}
        className="w-3 h-3 border-2 border-slate-700 dark:border-slate-300 z-50" 
      />

      <div 
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          padding: '24px',
          boxSizing: 'border-box',
          backgroundColor: currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.32)',
          borderColor: selected ? (currentTheme === 'dark' ? '#ffffff' : '#3b82f6') : (currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
        }}
        className={`w-full h-full rounded-2xl border flex flex-col transition-all duration-300 shadow-xl 
          ${selected 
            ? (currentTheme === 'dark' ? 'shadow-[0_0_25px_rgba(255,255,255,0.15)]' : 'shadow-[0_0_25px_rgba(59,130,246,0.3)]') 
            : (currentTheme === 'dark' 
                ? 'hover:shadow-[0_0_15px_rgba(255,255,255,0.25)]' 
                : 'hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]')
          }
        `}
      >
        <div className="flex items-center justify-between mb-4" ref={dropdownRef}>
          <div className="relative">
            <button onClick={() => setDropdownOpen(o => !o)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none cursor-pointer">
              {data.stepType} <ChevronDown size={10} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full mt-2 left-0 z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl py-1 min-w-[160px] backdrop-blur-xl">
                {['Topo de Funil', 'Meio de Funil', 'Fundo de Funil', 'Anúncio', 'Landing Page', 'Formulário', 'Checkout', 'Confirmação'].map(type => (
                  <button key={type} onClick={() => { updateNodeData(id, { stepType: type }); setDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 transition-colors">
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={12} /> {conversionRate}%
          </div>
        </div>

        <input
          value={data.label} onChange={e => updateNodeData(id, { label: e.target.value })}
          className="w-full text-base font-bold text-slate-900 dark:text-white bg-transparent border-none outline-none font-sans mb-auto"
        />

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            <div className="flex items-center gap-2.5"><Users size={14} /><span>Visitantes</span></div>
            <NumericInput value={data.visitors} onChange={v => updateNodeData(id, { visitors: v })} />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            <div className="flex items-center gap-2.5"><MousePointerClick size={14} /><span>Conversões</span></div>
            <NumericInput value={data.conversions} onChange={v => updateNodeData(id, { conversions: v })} />
          </div>
        </div>
      </div>

      <button
        onClick={() => setNodes(nds => nds.filter(n => n.id !== id))}
        style={{ top: '-12px', right: '-12px' }}
        className="absolute w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer z-50"
      >
        <X size={14} strokeWidth={2.5} />
      </button>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ left: '50%', bottom: '0px', transform: 'translateX(-50%)', background: currentTheme === 'dark' ? '#94a3b8' : '#475569' }}
        className="w-3 h-3 border-2 border-slate-700 dark:border-slate-300 z-50" 
      />
    </div>
  );
}