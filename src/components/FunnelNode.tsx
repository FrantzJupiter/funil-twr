import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MousePointerClick, Users, X } from 'lucide-react';

export default function FunnelNode({ id, data }: { id: string, data: any }) {
  const { updateNodeData, setNodes } = useReactFlow();

  const onChangeLabel = (evt: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { label: evt.target.value });
  };

  const onDelete = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  return (
    <div className="w-72 group">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-slate-400 border-2 border-white" 
      />

      <Card className="border-slate-200 shadow-sm bg-white hover:border-blue-300 transition-colors">
        <CardHeader className="pb-2 flex flex-col items-start gap-2 space-y-0 relative">
          
          <div className="flex w-full items-center justify-between">
            <Badge variant="secondary" className="text-[10px] font-normal uppercase tracking-wider">
              {data.stepType}
            </Badge>
            
            <button 
              onClick={onDelete}
              className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
              title="Excluir etapa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input 
            value={data.label}
            onChange={onChangeLabel}
            className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-400 outline-none transition-colors"
            title="Clique para editar o nome"
          />

        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center text-xs text-slate-500">
              <Users className="w-4 h-4 mr-2 text-blue-500" />
              <span>Visitantes: <strong className="text-slate-700">{data.visitors}</strong></span>
            </div>
            <div className="flex items-center text-xs text-slate-500">
              <MousePointerClick className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Conversões: <strong className="text-emerald-700">{data.conversions}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-slate-400 border-2 border-white" 
      />
    </div>
  );
}