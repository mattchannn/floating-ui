import type {ElementProps, FloatingContext} from '../types';
import {useFloatingId} from './useFloatingId';

export interface Props {
  enabled?: boolean;
  role?: 'tooltip' | 'dialog' | 'menu' | 'listbox';
  titleId?: string;
  descriptionId?: string;
}

/**
 * Adds relevant screen reader props for a given element `role`.
 */
export const useAria = (
  {open}: FloatingContext,
  {enabled = true, role = 'dialog', titleId, descriptionId}: Partial<Props> = {}
): ElementProps => {
  const rootId = useFloatingId();
  const floatingProps = {id: rootId, role};

  if (!enabled) {
    return {};
  }

  if (role === 'tooltip') {
    return {
      reference: {
        'aria-describedby': open ? rootId : undefined,
      },
      floating: floatingProps,
    };
  }

  return {
    reference: {
      'aria-expanded': open ? 'true' : 'false',
      'aria-haspopup': role,
      'aria-controls': open ? rootId : undefined,
      ...(role === 'listbox' && {
        role: 'combobox',
      }),
    },
    floating: {
      ...floatingProps,
      ...(role === 'dialog' && {
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
      }),
    },
  };
};
