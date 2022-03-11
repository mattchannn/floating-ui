import React, {MutableRefObject, useCallback, useRef} from 'react';
import useIsomorphicLayoutEffect from 'use-isomorphic-layout-effect';
import type {ElementProps, FloatingContext} from '../types';
import {isElement, isHTMLElement} from '../utils/is';

function stop(event: React.KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function findNonDisabledIndex(
  listRef: MutableRefObject<Array<HTMLElement | null>>,
  {startingIndex = -1, decrement = false} = {}
): number {
  let index = startingIndex;

  do {
    index = index + (decrement ? -1 : 1);
  } while (
    listRef.current[index]?.hasAttribute('disabled') ||
    listRef.current[index]?.getAttribute('aria-disabled') === 'true'
  );

  return index === -1 ? 0 : index;
}

export interface Props {
  listRef: React.MutableRefObject<Array<HTMLElement | null>>;
  activeIndex: number | null;
  onNavigate: (index: number | null) => void;
  enabled?: boolean;
  selectedIndex?: number | null;
  loop?: boolean;
  nested?: boolean;
  rtl?: boolean;
}

/**
 * Adds focus-managed indexed navigation via arrow keys to a list of items
 * within the floating element.
 * @see https://floating-ui.com/docs/useListNavigation
 */
export const useListNavigation = (
  {open, onOpenChange, refs}: FloatingContext,
  {
    enabled = true,
    listRef = {current: []},
    activeIndex = null,
    selectedIndex = null,
    loop = false,
    nested = false,
    rtl = false,
    onNavigate = () => {},
  }: Partial<Props> = {}
): ElementProps => {
  const focusOnOpenRef = useRef(true);
  const indexRef = useRef(selectedIndex ?? 0);
  const keyRef = useRef('');

  const focusItem = useCallback(
    (
      listRef: MutableRefObject<Array<HTMLElement | null>>,
      indexRef: React.MutableRefObject<number>
    ) => {
      listRef.current[indexRef.current]?.focus({preventScroll: true});
    },
    []
  );

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    if (selectedIndex != null) {
      indexRef.current = selectedIndex;
    }

    if (open && focusOnOpenRef.current) {
      onNavigate(indexRef.current);
      focusItem(listRef, indexRef);
    }
  }, [open, selectedIndex, listRef, onNavigate, focusItem, enabled]);

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    if (open && activeIndex != null) {
      indexRef.current = activeIndex;
      onNavigate(indexRef.current);
      focusItem(listRef, indexRef);
    }
  }, [open, activeIndex, listRef, onNavigate, focusItem, enabled]);

  useIsomorphicLayoutEffect(() => {
    if (selectedIndex != null || !enabled) {
      return;
    }

    if (open) {
      if (
        keyRef.current === 'ArrowDown' ||
        keyRef.current === 'ArrowUp' ||
        (focusOnOpenRef.current &&
          (keyRef.current === ' ' || keyRef.current === 'Enter'))
      ) {
        indexRef.current =
          keyRef.current === 'ArrowUp'
            ? findNonDisabledIndex(listRef, {
                startingIndex: listRef.current.length,
                decrement: true,
              })
            : findNonDisabledIndex(listRef);
        onNavigate(indexRef.current);
        focusItem(listRef, indexRef);
      }
    }

    keyRef.current = '';
  }, [open, listRef, selectedIndex, onNavigate, focusItem, enabled]);

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    if (!open && selectedIndex != null) {
      (refs.reference.current as HTMLElement | null)?.focus({
        preventScroll: true,
      });
    }
  }, [refs.reference, selectedIndex, open, enabled]);

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    if (!open) {
      focusOnOpenRef.current = true;
      onNavigate(null);
    }
  }, [open, enabled]);

  function pointerCheck(event: React.PointerEvent) {
    // undefined or '' depending on the browser
    focusOnOpenRef.current = !event.pointerType;
  }

  if (!enabled) {
    return {};
  }

  return {
    reference: {
      onPointerEnter: pointerCheck,
      onPointerDown: pointerCheck,
      onKeyDown(event) {
        focusOnOpenRef.current = true;
        keyRef.current = event.key;

        if (
          isElement(refs.reference.current) &&
          refs.reference.current.tagName !== 'BUTTON'
        ) {
          if (event.key === 'Enter' || event.key === ' ') {
            onOpenChange(true);
          }
        }

        if (nested) {
          if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) {
            indexRef.current = findNonDisabledIndex(listRef);
            stop(event);
            onOpenChange(true);
            onNavigate(indexRef.current);
          }

          return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          if (selectedIndex == null) {
            indexRef.current =
              event.key === 'ArrowDown'
                ? findNonDisabledIndex(listRef)
                : findNonDisabledIndex(listRef, {
                    startingIndex: listRef.current.length,
                    decrement: true,
                  });
          } else {
            indexRef.current = selectedIndex;
          }

          stop(event);
          onOpenChange(true);
          onNavigate(indexRef.current);
        }
      },
    },
    floating: {
      onKeyDown(event) {
        if (nested && event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) {
          stop(event);
          onOpenChange(false);

          if (isHTMLElement(refs.reference.current)) {
            refs.reference.current.focus();
          }

          return;
        }

        const currentIndex = indexRef.current;
        const minIndex = findNonDisabledIndex(listRef);
        const maxIndex = findNonDisabledIndex(listRef, {
          decrement: true,
          startingIndex: listRef.current.length,
        });

        if (event.key === 'Home') {
          indexRef.current = minIndex;
          onNavigate(indexRef.current);
          focusItem(listRef, indexRef);
        }

        if (event.key === 'End') {
          indexRef.current = maxIndex;
          onNavigate(indexRef.current);
          focusItem(listRef, indexRef);
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          stop(event);

          if (
            event.currentTarget.ownerDocument.activeElement ===
              event.currentTarget &&
            selectedIndex != null
          ) {
            indexRef.current = selectedIndex;
            onNavigate(indexRef.current);
            focusItem(listRef, indexRef);
            return;
          }

          if (event.key === 'ArrowDown') {
            if (loop) {
              indexRef.current =
                currentIndex === maxIndex
                  ? minIndex
                  : findNonDisabledIndex(listRef, {
                      startingIndex: currentIndex,
                    });
            } else {
              indexRef.current = Math.min(
                maxIndex,
                findNonDisabledIndex(listRef, {
                  startingIndex: currentIndex,
                })
              );
            }
          } else {
            if (loop) {
              indexRef.current =
                currentIndex === minIndex
                  ? maxIndex
                  : findNonDisabledIndex(listRef, {
                      startingIndex: currentIndex,
                      decrement: true,
                    });
            } else {
              indexRef.current = Math.max(
                minIndex,
                findNonDisabledIndex(listRef, {
                  startingIndex: currentIndex,
                  decrement: true,
                })
              );
            }
          }

          onNavigate(indexRef.current);
          focusItem(listRef, indexRef);
        }
      },
    },
  };
};
