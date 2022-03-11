import React, {cloneElement, isValidElement, useState} from 'react';
import {useInteractions} from '../useInteractions';
import {useFloating} from '../';
import {useClick} from '../hooks/useClick';
import {useFocusTrap} from '../hooks/useFocusTrap';
import {useAria} from '../hooks/useAria';
import {useDismiss} from '../hooks/useDismiss';
import {useFloatingId} from '../hooks/useFloatingId';
import {FloatingPortal} from '../FloatingPortal';
import {FloatingOverlay} from '../FloatingOverlay';

interface Props {
  open?: boolean;
  render: (props: {
    close: () => void;
    titleId: string;
    descriptionId: string;
  }) => React.ReactNode;
}

export const Dialog: React.FC<Props> = ({
  children,
  render,
  open: passedOpen = false,
}) => {
  const [open, setOpen] = useState(passedOpen);

  const {reference, floating, context} = useFloating({
    open,
    onOpenChange: setOpen,
  });

  const titleId = useFloatingId();
  const descriptionId = useFloatingId();

  const {getReferenceProps, getFloatingProps} = useInteractions([
    useClick(context),
    useFocusTrap(context),
    useAria(context, {
      titleId,
      descriptionId,
    }),
    useDismiss(context),
  ]);

  return (
    <>
      {isValidElement(children) &&
        cloneElement(children, getReferenceProps({ref: reference}))}
      <FloatingPortal>
        {open && (
          <FloatingOverlay
            {...getFloatingProps({
              ref: floating,
              style: {
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(25, 25, 25, 0.6)',
                backdropFilter: 'blur(12px)',
              },
            })}
          >
            {render({
              close: () => setOpen(false),
              titleId,
              descriptionId,
            })}
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </>
  );
};
