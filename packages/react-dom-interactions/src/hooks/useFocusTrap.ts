import React, {MutableRefObject, useCallback, useEffect, useRef} from 'react';
import useIsomorphicLayoutEffect from 'use-isomorphic-layout-effect';
import {useFloatingPortalId} from '../FloatingPortal';
import {useFloatingTree} from '../FloatingTree';
import type {ElementProps, FloatingContext} from '../types';
import {getDocument} from '../utils/getDocument';
import {isElement, isHTMLElement} from '../utils/is';

const FOCUSABLE_ELEMENT_SELECTOR =
  'a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),iframe,object,embed,*[tabindex],*[contenteditable]';

export interface Props {
  enabled?: boolean;
  modal?: boolean;
  order?: Array<'reference' | 'floating' | 'content'>;
  initialContentFocus?: number | MutableRefObject<HTMLElement | null>;
  inert?: boolean;
  scrollLock?: boolean;
}

/**
 * Traps focus in a loop of focusable elements while the floating element is
 * open.
 * @see https://floating-ui.com/docs/useFocusTrap
 */
export const useFocusTrap = (
  {open, onOpenChange, refs, nodeId}: FloatingContext,
  {
    enabled = true,
    initialContentFocus = 0,
    order = ['content'],
    modal = true,
    inert = false,
    scrollLock = false,
  }: Props = {}
): ElementProps => {
  const portalId = useFloatingPortalId();
  const tree = useFloatingTree();
  const indexRef = useRef(0);

  const getFocusableElements = useCallback(() => {
    return order
      .map((type) => {
        if (isHTMLElement(refs.reference.current) && type === 'reference') {
          return refs.reference.current;
        }

        if (refs.floating.current && type === 'floating') {
          return refs.floating.current;
        }

        if (type === 'content') {
          return Array.from(
            refs.floating.current?.querySelectorAll(
              FOCUSABLE_ELEMENT_SELECTOR
            ) ?? []
          );
        }

        return null;
      })
      .filter(Boolean)
      .flat() as Array<HTMLElement>;
  }, [refs.floating, refs.reference, order]);

  useEffect(() => {
    if (inert || !enabled) {
      return;
    }

    if (open) {
      const focusableElements = getFocusableElements();

      if (typeof initialContentFocus === 'number') {
        focusableElements[initialContentFocus]?.focus({preventScroll: true});
      } else if (initialContentFocus.current) {
        focusableElements
          .find((element) => element === initialContentFocus.current)
          ?.focus({preventScroll: true});
      }
    } else if (modal && isHTMLElement(refs.reference.current)) {
      refs.reference.current.focus({preventScroll: true});
    }
  }, [
    getFocusableElements,
    open,
    inert,
    modal,
    initialContentFocus,
    enabled,
    refs.reference,
  ]);

  useEffect(() => {
    if (!modal || !enabled) {
      return;
    }

    const doc = getDocument(refs.floating.current);

    if (!open) {
      doc.removeEventListener('keydown', onKeyDown);
      indexRef.current = 0;
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (
        tree?.nodesRef.current
          ?.filter(({parentId}) => parentId === nodeId)
          .some(({context}) => context?.open)
      ) {
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();

        if (inert) {
          return;
        }

        const focusableElements = getFocusableElements();

        if (event.shiftKey) {
          indexRef.current =
            indexRef.current === 0
              ? focusableElements.length - 1
              : indexRef.current - 1;
        } else {
          indexRef.current =
            indexRef.current === focusableElements.length - 1
              ? 0
              : indexRef.current + 1;
        }

        focusableElements[indexRef.current]?.focus({preventScroll: true});
      }
    }

    doc.addEventListener('keydown', onKeyDown);
    return () => {
      doc.removeEventListener('keydown', onKeyDown);
    };
  }, [
    getFocusableElements,
    tree?.nodesRef,
    nodeId,
    open,
    modal,
    inert,
    enabled,
    refs.floating,
  ]);

  function onBlur(event: React.FocusEvent) {
    const target = event.relatedTarget as Element | null;
    if (
      target &&
      !refs.floating.current?.contains(target) &&
      isElement(refs.reference.current) &&
      !refs.reference.current.contains(target)
    ) {
      onOpenChange(false);
    }
  }

  useEffect(() => {
    if (!open || !modal || !enabled) {
      return;
    }

    const doc = getDocument(refs.floating.current);
    const portal = doc.querySelector(`#${portalId}`);
    const nodes = doc.querySelectorAll(`body > *:not(#${portalId})`);

    nodes.forEach((node) => {
      node.setAttribute('aria-hidden', 'true');
    });

    return () => {
      if (portal?.firstElementChild === refs.floating.current) {
        nodes.forEach((node) => {
          node.removeAttribute('aria-hidden');
        });
      }
    };
  }, [open, modal, scrollLock, portalId, enabled, refs.floating]);

  useIsomorphicLayoutEffect(() => {
    if (!open || !enabled) {
      return;
    }

    const doc = getDocument(refs.floating.current);
    if (scrollLock) {
      const scrollbarWidth =
        (doc.defaultView ?? window).innerWidth -
        doc.documentElement.offsetWidth;
      doc.documentElement.style.overflow = 'hidden';
      doc.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      if (scrollLock) {
        doc.documentElement.style.overflow = '';
        doc.body.style.paddingRight = '';
      }
    };
  }, [open, scrollLock, enabled]);

  if (!enabled) {
    return {};
  }

  if (modal) {
    return {
      floating: {
        'aria-modal': 'true',
      },
    };
  }

  return {
    reference: {onBlur},
    floating: {onBlur},
  };
};
