import {getOverflowAncestors} from '@floating-ui/react-dom';
import {useCallback, useEffect} from 'react';
import {useFloatingTree} from '../FloatingTree';
import type {ElementProps, FloatingContext} from '../types';
import {getChildren} from '../utils/getChildren';
import {getDocument} from '../utils/getDocument';
import {isElement, isHTMLElement} from '../utils/is';

export interface Props {
  enabled?: boolean;
  escapeKey?: boolean;
  referencePointerDown?: boolean;
  outsidePointerDown?: boolean;
  ancestorScroll?: boolean;
}

/**
 * Adds listeners that dismiss (close) the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export const useDismiss = (
  {open, onOpenChange, refs, events, nodeId}: FloatingContext,
  {
    enabled = true,
    escapeKey = true,
    outsidePointerDown = true,
    referencePointerDown = false,
    ancestorScroll = false,
  }: Props = {}
): ElementProps => {
  const tree = useFloatingTree();

  const focusReference = useCallback(() => {
    if (isHTMLElement(refs.reference.current)) {
      refs.reference.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refs.reference.current]);

  useEffect(() => {
    if (!open || !enabled) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        events.emit('dismiss');
        onOpenChange(false);
        focusReference();
      }
    }

    function onPointerDown(event: PointerEvent) {
      const targetIsInsideChildren =
        tree &&
        getChildren(tree, nodeId).some((node) =>
          node.context?.refs.floating.current?.contains(
            event.target as Element | null
          )
        );

      if (
        refs.floating.current?.contains(event.target as Element | null) ||
        (isElement(refs.reference.current) &&
          refs.reference.current.contains(event.target as Element | null)) ||
        targetIsInsideChildren
      ) {
        return;
      }

      events.emit('dismiss');
      onOpenChange(false);
      focusReference();
    }

    function onScroll() {
      onOpenChange(false);
    }

    const doc = getDocument(refs.floating.current);
    escapeKey && doc.addEventListener('keydown', onKeyDown);
    outsidePointerDown && doc.addEventListener('pointerdown', onPointerDown);

    const ancestors = ancestorScroll
      ? [
          ...(isElement(refs.reference.current)
            ? getOverflowAncestors(refs.reference.current)
            : []),
          ...(isElement(refs.floating.current)
            ? getOverflowAncestors(refs.floating.current)
            : []),
        ]
      : [];
    ancestors.forEach((ancestor) =>
      ancestor.addEventListener('scroll', onScroll, {passive: true})
    );

    return () => {
      escapeKey && doc.removeEventListener('keydown', onKeyDown);
      outsidePointerDown &&
        doc.removeEventListener('pointerdown', onPointerDown);
      ancestors.forEach((ancestor) =>
        ancestor.removeEventListener('scroll', onScroll)
      );
    };
  }, [
    escapeKey,
    outsidePointerDown,
    events,
    tree,
    nodeId,
    open,
    onOpenChange,
    focusReference,
    ancestorScroll,
    enabled,
    refs.floating,
    refs.reference,
  ]);

  if (!enabled) {
    return {};
  }

  return {
    reference: {
      onPointerDown() {
        if (referencePointerDown) {
          events.emit('dismiss');
          onOpenChange(false);
        }
      },
    },
  };
};
