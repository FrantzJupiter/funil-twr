import { Node } from '@xyflow/react';

export type FunnelStepType =
  | 'Topo de Funil'
  | 'Meio de Funil'
  | 'Fundo de Funil'
  | 'Anúncio'
  | 'Landing Page'
  | 'Formulário'
  | 'Checkout'
  | 'Confirmação';

export type FunnelNodeData = {
  label: string;
  stepType: FunnelStepType;
  visitors: number;
  conversions: number;
};


export type FunnelNodeType = Node<FunnelNodeData, 'customFunnelNode'>;