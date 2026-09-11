import { useEffect, useState } from 'react';

/**
 * true mientras la media query coincide. Se usa para renderizar UNA sola
 * variante (tabla o tarjetas, chip de barra o de fila) en vez de dos ocultas
 * por CSS: duplicar botones rompería los selectores únicos de los tests.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);

  return matches;
}

/** Celular: por debajo del breakpoint `sm` de Tailwind. */
export const useIsMobile = () => useMediaQuery('(max-width: 639px)');
