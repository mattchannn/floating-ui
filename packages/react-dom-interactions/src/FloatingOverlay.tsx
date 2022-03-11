import {forwardRef} from 'react';

/**
 * Provides base styling for a fixed overlay element to dim content or block
 * pointer events behind a floating element.
 * It's a regular <div />, so it can be styled via any CSS solution you prefer.
 * @see https://floating-ui.com/docs/FloatingOverlay
 */
export const FloatingOverlay = forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement>
>(function FloatingOverlay(props, ref) {
  return (
    <div
      ref={ref}
      {...props}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
        ...props.style,
      }}
    />
  );
});
