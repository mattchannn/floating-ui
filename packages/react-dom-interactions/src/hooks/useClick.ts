import type {ElementProps, FloatingContext} from '../types';

export interface Props {
  enabled?: boolean;
}

/**
 * Adds click event listeners that change the open state (toggle behavior).
 * @see https://floating-ui.com/docs/useClick
 */
export const useClick = (
  {open, onOpenChange, dataRef}: FloatingContext,
  {enabled = true}: Props = {}
): ElementProps => {
  if (!enabled) {
    return {};
  }

  return {
    reference: {
      onClick(event: React.PointerEvent) {
        if (open) {
          if (
            dataRef.current.openEvent?.type === 'click' ||
            dataRef.current.hoveredThenClicked
          ) {
            dataRef.current.hoveredThenClicked = false;
            onOpenChange(false);
          } else {
            // Clicking to keep it open after a hover.
            dataRef.current.hoveredThenClicked = true;
          }
        } else {
          dataRef.current.openEvent = event.nativeEvent;
          onOpenChange(true);
        }
      },
    },
  };
};
