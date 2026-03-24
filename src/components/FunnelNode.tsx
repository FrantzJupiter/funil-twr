import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { MousePointerClick, Users, X } from 'lucide-react';

export default function FunnelNode({ id, data, selected }: { id: string, data: any, selected: boolean }) {
  const { updateNodeData, setNodes } = useReactFlow();

  const onChangeLabel = (evt: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { label: evt.target.value });
  };

  const onDelete = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  return (
    <>
      <NodeResizer 
        isVisible={selected} 
        minWidth={288} 
        minHeight={170} 
        lineStyle={{ opacity: 0 }}
        handleStyle={{ opacity: 0 }}
      />
      <div className="w-full h-full relative">
        <Handle 
          type="target" 
          position={Position.Top} 
          className="w-3 h-3 bg-slate-400 border-2 border-slate-800 z-50" 
        />

        <div className={`w-full h-full rounded-xl border transition-all duration-300 flex flex-col overflow-hidden ${selected ? 'border-white/30 shadow-[0_0_30px_rgba(59,130,246,0.6)] bg-slate-100/80 dark:bg-slate-900/80' : 'border-white/10 shadow-2xl bg-slate-100/70 dark:bg-slate-900/70'} backdrop-blur-3xl hover:border-blue-400/50`}>
          <div className="p-6 pb-3 flex flex-col items-start gap-4 relative">
            
            <div className="flex w-full items-center justify-between">
              <Badge variant="secondary" className="text-[10px] font-normal uppercase tracking-wider bg-white/50 dark:bg-white/10 text-slate-800 dark:text-slate-200 backdrop-blur-md border-none">
                {data.stepType}
              </Badge>
            </div>

            <input 
              value={data.label}
              onChange={onChangeLabel}
              className="w-full text-base font-bold text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-400/30 dark:hover:border-white/20 focus:border-blue-400 outline-none transition-colors"
            />

          </div>
          
          <div className="p-6 pt-0 mt-auto flex-1 flex flex-col justify-end">
            <div className="flex flex-col gap-3">
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <Users className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">Visitantes: <strong className="text-slate-800 dark:text-white">{data.visitors}</strong></span>
              </div>
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <MousePointerClick className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Conversões: <strong className="text-slate-800 dark:text-white">{data.conversions}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-[-24px] right-[-24px] w-12 h-12 flex items-center justify-center z-50 group/btn">
          <button 
            onClick={onDelete}
            className="w-6 h-6 flex items-center justify-center rounded-full border border-slate-300 dark:border-white/20 transition-all duration-300 ease-in-out cursor-pointer outline-none text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 opacity-0 group-hover/btn:opacity-100 hover:text-red-500 hover:border-red-500 hover:shadow-[0_0_15px_3px_rgba(239,68,68,0.4)] active:bg-red-900/60 active:scale-95"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="w-3 h-3 bg-slate-400 border-2 border-slate-800 z-50" 
        />
      </div>
    </>
  );
}