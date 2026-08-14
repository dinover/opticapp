import { useEffect, useState } from 'react';

/**
 * Devuelve el valor recién después de que dejó de cambiar por `delay` ms.
 * Se usa para que escribir en un buscador no dispare una request por tecla.
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
