import {useMemo} from 'react';

let globalId = 0;
function genId() {
  return `floating-ui-${globalId++}`;
}

export function useFloatingId() {
  return useMemo(genId, []);
}
