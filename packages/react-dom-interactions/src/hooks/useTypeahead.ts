import React, {useRef} from 'react';
import useIsomorphicLayoutEffect from 'use-isomorphic-layout-effect';
import type {ElementProps, FloatingContext} from '../types';
import {getDocument} from '../utils/getDocument';

export interface Props {
  listRef: React.MutableRefObject<Array<string | null>>;
  onMatch: (index: number) => void;
  enabled?: boolean;
  onFind?: null | ((itemString: string | null, typedString: string) => boolean);
  debounceMs?: number;
  ignoreKeys?: Array<string>;
}

/**
 * Provides a transient string via a callback as the user types, often used in
 * tandem with `useListNavigation()`.
 * @see https://floating-ui.com/docs/useTypeahead
 */
export const useTypeahead = (
  {open}: FloatingContext,
  {
    enabled = true,
    listRef = {current: []},
    onMatch = () => {},
    onFind = null,
    debounceMs = 500,
    ignoreKeys = [],
  }: Partial<Props> = {}
): ElementProps => {
  const timeoutIdRef = useRef<any>();
  const stringRef = useRef('');
  const prevIndexRef = useRef<number | null>(null);
  const matchIndexRef = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (open) {
      clearTimeout(timeoutIdRef.current);
      prevIndexRef.current = null;
      matchIndexRef.current = null;
      stringRef.current = '';
    }
  }, [open]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (
      !event.currentTarget.contains(
        getDocument(event.currentTarget as HTMLElement).activeElement
      )
    ) {
      return;
    }

    if (event.key === ' ' && stringRef.current.length > 0) {
      event.preventDefault();
      event.stopPropagation();
    }

    const listContent = listRef.current;

    if (
      listContent == null ||
      [
        'Home',
        'End',
        'Escape',
        'Enter',
        'Tab',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        ...ignoreKeys,
      ].includes(event.key)
    ) {
      return;
    }

    // Bail out if the list contains a word like "llama" or "aaron". TODO:
    // allow it in this case, too.
    const allowRapidSuccessionOfFirstLetter = listContent.every((text) =>
      text ? text[0]?.toLowerCase() !== text[1]?.toLowerCase() : true
    );

    // Allows the user to cycle through items that start with the same letter
    // in rapid succession
    if (allowRapidSuccessionOfFirstLetter && stringRef.current === event.key) {
      stringRef.current = '';
      prevIndexRef.current = matchIndexRef.current;
    }

    stringRef.current += event.key;
    clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = setTimeout(() => {
      stringRef.current = '';
      prevIndexRef.current = matchIndexRef.current;
    }, debounceMs);

    const prevIndex = prevIndexRef.current;

    const str = [
      ...listContent.slice((prevIndex ?? 0) + 1),
      ...listContent.slice(0, prevIndex ?? 0),
    ].find((text) =>
      onFind
        ? onFind(text, stringRef.current)
        : text?.toLowerCase().indexOf(stringRef.current) === 0
    );

    const index = str ? listContent.indexOf(str) : -1;

    if (index !== -1) {
      onMatch(index);
      matchIndexRef.current = index;
    }
  }

  if (!enabled) {
    return {};
  }

  return {
    reference: {onKeyDown},
    floating: {onKeyDown},
  };
};
