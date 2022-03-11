import {useMemo, useRef, useState} from 'react';
import {
  useFloating as usePositionalFloating,
  UseFloatingReturn,
} from '@floating-ui/react-dom';
import useIsomorphicLayoutEffect from 'use-isomorphic-layout-effect';
import type {FloatingContext, Middleware, Placement, Strategy} from './types';
import {createPubSub} from './createPubSub';
import {useFloatingTree} from './FloatingTree';

export interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement: Placement;
  middleware: Array<Middleware>;
  strategy: Strategy;
  nodeId: string;
}

export function useFloating({
  open = false,
  onOpenChange = () => {},
  placement,
  middleware,
  strategy,
  nodeId,
}: Partial<Props> = {}): UseFloatingReturn & {context: FloatingContext} {
  const tree = useFloatingTree();
  const dataRef = useRef<Record<string, any>>({});
  const events = useState(() => createPubSub())[0];
  const floating = usePositionalFloating({placement, middleware, strategy});

  const context: FloatingContext = useMemo(
    () => ({
      ...floating,
      dataRef,
      nodeId,
      events,
      open,
      onOpenChange,
    }),
    [floating, dataRef, nodeId, events, open, onOpenChange]
  );

  useIsomorphicLayoutEffect(() => {
    const node = tree?.nodesRef.current.find((node) => node.id === nodeId);
    if (node) {
      node.context = context;
    }
  });

  return useMemo(
    () => ({
      context,
      ...floating,
    }),
    [floating, context]
  );
}

export * from '@floating-ui/react-dom';
export {useInteractions} from './useInteractions';
export {safePolygon} from './safePolygon';
export {FloatingPortal} from './FloatingPortal';
export {FloatingOverlay} from './FloatingOverlay';
export {
  FloatingTree,
  FloatingNode,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useFloatingTree,
} from './FloatingTree';
export {
  FloatingDelayGroup,
  useDelayGroup,
  useDelayGroupContext,
} from './FloatingDelayGroup';
export {useAria} from './hooks/useAria';
export {useClick} from './hooks/useClick';
export {useDismiss} from './hooks/useDismiss';
export {useFloatingId} from './hooks/useFloatingId';
export {useFocus} from './hooks/useFocus';
export {useFocusTrap} from './hooks/useFocusTrap';
export {useHover} from './hooks/useHover';
export {useListNavigation} from './hooks/useListNavigation';
export {useTypeahead} from './hooks/useTypeahead';
