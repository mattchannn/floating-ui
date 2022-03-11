import type {UseFloatingReturn} from '@floating-ui/react-dom';
import React from 'react';

export * from './';
export * from '@floating-ui/dom';

export {arrow} from '@floating-ui/react-dom';

export interface FloatingEvents {
  emit(event: string, data?: any): void;
  on(event: string, handler: (data?: any) => void): void;
  off(event: string, handler: (data?: any) => void): void;
}

export interface FloatingContext extends UseFloatingReturn {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: FloatingEvents;
  dataRef: React.MutableRefObject<Record<string, any>>;
  nodeId: string | undefined;
}

export interface FloatingNodeType {
  id: string;
  parentId: string | null;
  context?: FloatingContext;
}

export interface FloatingTreeType {
  nodesRef: React.MutableRefObject<Array<FloatingNodeType>>;
  events: FloatingEvents;
  addNode: (node: FloatingNodeType) => void;
  removeNode: (node: FloatingNodeType) => void;
}

export interface ElementProps {
  reference?: React.HTMLProps<Element>;
  floating?: React.HTMLProps<HTMLElement>;
}
