import {useEffect, useRef} from 'react';
import useIsomorphicLayoutEffect from 'use-isomorphic-layout-effect';
import {useFloatingTree} from '../FloatingTree';
import type {ElementProps, FloatingContext, FloatingTreeType} from '../types';
import {getDocument} from '../utils/getDocument';

export function getDelay(value: Props['delay'], prop: 'open' | 'close') {
  if (typeof value === 'number') {
    return value;
  }

  return value?.[prop];
}

export interface Props {
  enabled?: boolean;
  handleLeave?:
    | null
    | ((
        context: FloatingContext & {
          onClose: () => void;
          tree?: FloatingTreeType | null;
        }
      ) => (event: PointerEvent) => void);
  pointerRestMs?: number;
  delay?: number | Partial<{open: number; close: number}>;
  mouseOnly?: boolean;
}

/**
 * Adds hover event listeners that change the open state, like CSS :hover.
 * @see https://floating-ui.com/docs/useHover
 */
export const useHover = (
  context: FloatingContext,
  {
    enabled = true,
    delay = 0,
    handleLeave = null,
    mouseOnly = false,
    pointerRestMs = 0,
  }: Props = {}
): ElementProps => {
  const {open, onOpenChange, dataRef, events, refs} = context;

  const tree = useFloatingTree();

  const timeoutRef = useRef<any>();
  const handlerRef = useRef<(event: PointerEvent) => void>();
  const pointerRestTimeoutRef = useRef<any>();
  const blockPointerMoveRef = useRef(true);

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      dataRef.current.hoveredThenClicked = false;
    }
  }, [open]);

  useEffect(() => {
    function onDismiss() {
      clearTimeout(timeoutRef.current);
      clearTimeout(pointerRestTimeoutRef.current);
      blockPointerMoveRef.current = true;
    }

    events.on('dismiss', onDismiss);
    return () => {
      events.off('dismiss', onDismiss);
    };
  }, [events]);

  function closeWithDelay(runElseBranch = true) {
    if (delay) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(
        () => onOpenChange(false),
        getDelay(delay, 'close')
      );
    } else if (runElseBranch) {
      onOpenChange(false);
    }
  }

  if (!enabled) {
    return {};
  }

  return {
    reference: {
      onPointerMove() {
        if (pointerRestMs === 0 || open) {
          return;
        }

        clearTimeout(pointerRestTimeoutRef.current);
        pointerRestTimeoutRef.current = setTimeout(() => {
          if (!blockPointerMoveRef.current) {
            onOpenChange(true);
          }
        }, pointerRestMs);
      },
      onPointerEnter(event: React.PointerEvent) {
        if (mouseOnly && event.pointerType !== 'mouse') {
          return;
        }

        blockPointerMoveRef.current = false;
        dataRef.current.openEvent = event.nativeEvent;

        if (delay) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            onOpenChange(true);
          }, getDelay(delay, 'open'));
        } else {
          onOpenChange(true);
        }
      },
      onPointerLeave(event: React.PointerEvent) {
        if (
          dataRef.current.hoveredThenClicked ||
          dataRef.current.openEvent?.type === 'click'
        ) {
          return;
        }

        const doc = getDocument(refs.floating.current);
        clearTimeout(pointerRestTimeoutRef.current);

        if (handleLeave) {
          clearTimeout(timeoutRef.current);

          handlerRef.current &&
            doc.removeEventListener('pointermove', handlerRef.current);

          handlerRef.current = handleLeave({
            ...context,
            tree,
            x: event.clientX,
            y: event.clientY,
            onClose() {
              handlerRef.current &&
                doc.removeEventListener('pointermove', handlerRef.current);
              closeWithDelay();
            },
          });

          handlerRef.current(event.nativeEvent);

          doc.addEventListener('pointermove', handlerRef.current);
          return;
        }

        closeWithDelay();
      },
    },
    floating: {
      onPointerEnter() {
        clearTimeout(timeoutRef.current);
      },
      onPointerLeave: () => closeWithDelay(false),
    },
  };
};
