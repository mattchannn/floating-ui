import type {FloatingTreeType} from '../types';

export function getChildren(tree: FloatingTreeType, id: string | undefined) {
  let allChildren =
    tree?.nodesRef.current.filter(
      (node) => node.parentId === id && node.context?.open
    ) ?? [];
  let currentChildren = allChildren;

  while (currentChildren.length) {
    currentChildren =
      tree?.nodesRef.current.filter((node) =>
        currentChildren?.some(
          (n) => node.parentId === n.id && node.context?.open
        )
      ) ?? [];

    allChildren = allChildren.concat(currentChildren);
  }

  return allChildren;
}
