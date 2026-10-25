import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export const AUTO_REFRESH_INTERVAL = 30000;

// Pide los datos al montar y luego cada `interval` ms mientras la pestaña está
// visible. Al volver a una pestaña con datos viejos, refresca de inmediato.
// Los refrescos no vacían `data` (sin parpadeos) y solo se aplica la respuesta
// de la petición más reciente. `subscribe(callback)` permite refrescar ante
// avisos externos y debe devolver la función para desuscribirse.
export function useAutoRefresh(fetcher, { interval = AUTO_REFRESH_INTERVAL, subscribe } = {}) {
  const [state, setState] = useState({ data: undefined, error: '', lastUpdated: null, refreshing: false });
  const fetcherRef = useRef(fetcher);
  const latestRequest = useRef(0);
  const inFlight = useRef(false);
  const lastUpdatedRef = useRef(0);
  const mounted = useRef(false);

  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequest.current;
    const isCurrent = () => mounted.current && requestId === latestRequest.current;
    inFlight.current = true;
    // Espera un microtask para no actualizar estado en medio del efecto que llamó a refresh.
    await Promise.resolve();
    if (isCurrent()) setState(current => ({ ...current, refreshing: true }));
    try {
      const data = await fetcherRef.current();
      if (isCurrent()) {
        lastUpdatedRef.current = Date.now();
        setState({ data, error: '', lastUpdated: lastUpdatedRef.current, refreshing: false });
      }
    } catch (error) {
      if (isCurrent()) {
        setState(current => ({ ...current, error: error.message || 'No se pudieron actualizar los datos.', refreshing: false }));
      }
    } finally {
      if (requestId === latestRequest.current) inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    let timer;
    // Si una petición sigue en curso, el ciclo se salta en lugar de acumular peticiones.
    const tick = () => { if (!inFlight.current) refresh(); };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      stop();
      timer = setInterval(tick, interval);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        stop();
        return;
      }
      if (Date.now() - lastUpdatedRef.current >= interval) tick();
      start();
    };

    refresh();
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [interval, refresh]);

  // Efecto aparte: si `subscribe` cambia de identidad solo se vuelve a suscribir, sin pedir datos.
  useEffect(() => subscribe?.(refresh), [subscribe, refresh]);

  return {
    data: state.data,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refreshing: state.refreshing,
    loading: state.lastUpdated === null && !state.error,
    refresh,
  };
}
