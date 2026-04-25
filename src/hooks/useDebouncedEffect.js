import { useEffect } from 'react';

export function useDebouncedEffect(callback, delay, dependencies) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      callback();
    }, delay);

    return () => window.clearTimeout(timeout);
  }, dependencies);
}
