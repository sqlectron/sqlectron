import { useEffect } from 'react';

import { usePrevious } from './usePrevious';

export const useEffectDebugger = (
  effectHook: () => void,
  dependencies: any[],
  dependencyNames = [],
) => {
  const previousDeps = usePrevious(dependencies, []);

  const changedDeps = dependencies.reduce((accum, dependency, index) => {
    if (dependency !== previousDeps[index]) {
      const keyName = dependencyNames[index] || index;
      return {
        ...accum,
        [keyName]: {
          before: previousDeps[index],
          after: dependency,
        },
      };
    }

    return accum;
  }, {});

  if (Object.keys(changedDeps).length) {
    // eslint-disable-next-line no-console
    console.log('[use-effect-debugger] ', changedDeps);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effectHook, dependencies);
};
