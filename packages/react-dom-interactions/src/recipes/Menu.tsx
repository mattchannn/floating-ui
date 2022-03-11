import {autoUpdate} from '@floating-ui/dom';
import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useFloating,
  offset,
  flip,
  shift,
  useListNavigation,
  useHover,
  useTypeahead,
} from '../';
import {useInteractions} from '../useInteractions';
import {useAria} from '../hooks/useAria';
import {useClick} from '../hooks/useClick';
import {useDismiss} from '../hooks/useDismiss';
import {useFocusTrap} from '../hooks/useFocusTrap';
import mergeRefs from 'react-merge-refs';
import {safePolygon} from '../safePolygon';
import {FloatingPortal} from '../FloatingPortal';
import {
  useFloatingTree,
  useFloatingNodeId,
  useFloatingParentNodeId,
  FloatingNode,
} from '../FloatingTree';
import {useIsomorphicLayoutEffect} from 'framer-motion';

export const MenuItem = forwardRef<HTMLButtonElement, {label: string}>(
  ({label, ...props}, ref) => {
    return (
      <button
        ref={ref}
        role="menuitem"
        {...props}
        style={{display: 'block', width: '100%'}}
      >
        {label}
      </button>
    );
  }
);

export const Menu = forwardRef<
  any,
  {label?: string; nested?: boolean} & React.HTMLProps<HTMLButtonElement>
>(({children, label, nested = false}, ref) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const listItemsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const listContentRef = useRef(
    Children.map(children, (child) =>
      isValidElement(child) ? child.props.label : null
    ) as Array<string | null>
  );

  const nodeId = useFloatingNodeId();
  const parentId = useFloatingParentNodeId();
  const tree = useFloatingTree();

  useEffect(() => {
    function onTreeOpenChange({
      open,
      reference,
      parentId,
    }: {
      open: boolean;
      reference: Element;
      parentId: string;
    }) {
      if (parentId !== nodeId) {
        return;
      }

      if (open) {
        listItemsRef.current.forEach((item) => {
          if (item && item !== reference) {
            item.style.pointerEvents = 'none';
          }
        });
      } else {
        listItemsRef.current.forEach((item) => {
          if (item && item !== reference) {
            item.style.pointerEvents = '';
          }
        });
      }
    }

    tree?.events.on('openChange', onTreeOpenChange);
    return () => {
      tree?.events.off('openChange', onTreeOpenChange);
    };
  }, [tree, nodeId]);

  const {x, y, reference, floating, strategy, refs, update, context} =
    useFloating({
      open,
      onOpenChange: setOpen,
      middleware: [offset({mainAxis: 5, alignmentAxis: -8}), flip(), shift()],
      placement: nested ? 'right-start' : 'bottom',
      nodeId,
    });

  const {getReferenceProps, getFloatingProps} = useInteractions([
    useHover(context, {
      handleLeave: safePolygon(),
      enabled: nested,
    }),
    useClick(context),
    useAria(context, {role: 'menu'}),
    useDismiss(context),
    useFocusTrap(context, {inert: true}),
    useListNavigation(context, {
      listRef: listItemsRef,
      activeIndex,
      nested,
      onNavigate: setActiveIndex,
    }),
    useTypeahead(context, {
      listRef: listContentRef,
      onMatch: open ? setActiveIndex : undefined,
    }),
  ]);

  useIsomorphicLayoutEffect(() => {
    tree?.events.emit('openChange', {
      open,
      parentId,
      reference: refs.reference.current,
    });
  }, [tree, open, parentId, refs.reference]);

  useEffect(() => {
    const reference = refs.reference.current;
    const floating = refs.floating.current;

    if (open && reference && floating) {
      return autoUpdate(reference, floating, update);
    }
  }, [open, update, refs.reference, refs.floating]);

  const stableReferenceRef = useMemo(
    () => mergeRefs([ref, reference]),
    [reference, ref]
  );

  const pointerFocusListeners: React.HTMLProps<HTMLButtonElement> = {
    onPointerEnter({currentTarget}) {
      const target = currentTarget as HTMLButtonElement | null;
      if (target) {
        currentTarget.focus({preventScroll: true});
        setActiveIndex(listItemsRef.current.indexOf(target));
      }
    },
    onPointerLeave() {
      refs.floating.current?.focus({preventScroll: true});
    },
  };

  return (
    <FloatingNode id={nodeId}>
      <button
        {...getReferenceProps({
          ref: stableReferenceRef,
          ...(parentId && {
            ...pointerFocusListeners,
            role: 'menuitem',
          }),
          style: {
            width: '100%',
          },
        })}
      >
        {label}
      </button>
      <FloatingPortal>
        {open && (
          <div
            {...getFloatingProps({
              className: 'popup',
              ref: floating,
              style: {
                position: strategy,
                top: y ?? '',
                left: x ?? '',
              },
            })}
          >
            {Children.map(
              children,
              (child, index) =>
                isValidElement(child) &&
                cloneElement(child, {
                  role: 'menuitem',
                  ref(node: HTMLButtonElement) {
                    listItemsRef.current[index] = node;
                  },
                  ...(child.type === Menu && {nested: true}),
                  ...pointerFocusListeners,
                })
            )}
          </div>
        )}
      </FloatingPortal>
    </FloatingNode>
  );
});
