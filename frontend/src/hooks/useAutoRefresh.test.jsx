import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { AUTO_REFRESH_INTERVAL, useAutoRefresh } from './useAutoRefresh';

let visibility = 'visible';
const setVisibility = value => {
  visibility = value;
  document.dispatchEvent(new Event('visibilitychange'));
};
// Avanza el reloj simulado y deja que se resuelvan las promesas pendientes.
const advance = ms => act(() => vi.advanceTimersByTimeAsync(ms));

describe('useAutoRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('carga al montar y vuelve a pedir los datos cada 30 segundos', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(['a']).mockResolvedValueOnce(['a', 'b']);
    const { result } = renderHook(() => useAutoRefresh(fetcher));
    expect(result.current.loading).toBe(true);

    await advance(0);
    expect(result.current).toMatchObject({ data: ['a'], loading: false, error: '' });
    expect(result.current.lastUpdated).toEqual(expect.any(Number));

    await advance(AUTO_REFRESH_INTERVAL - 1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(['a', 'b']);
  });

  it('no vuelve al estado de carga ni pierde los datos en los refrescos', async () => {
    let resolveSecond;
    const fetcher = vi.fn()
      .mockResolvedValueOnce(['a'])
      .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve; }));
    const { result } = renderHook(() => useAutoRefresh(fetcher));
    await advance(0);

    await advance(AUTO_REFRESH_INTERVAL);
    expect(result.current).toMatchObject({ data: ['a'], loading: false, refreshing: true });

    await act(async () => resolveSecond(['b']));
    expect(result.current).toMatchObject({ data: ['b'], refreshing: false });
  });

  it('se pausa con la pestaña oculta y al volver refresca si los datos son viejos', async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    renderHook(() => useAutoRefresh(fetcher));
    await advance(0);

    act(() => setVisibility('hidden'));
    await advance(AUTO_REFRESH_INTERVAL * 3);
    expect(fetcher).toHaveBeenCalledTimes(1);

    act(() => setVisibility('visible'));
    await advance(0);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await advance(AUTO_REFRESH_INTERVAL);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('no repite la petición si la pestaña vuelve con datos recientes', async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    renderHook(() => useAutoRefresh(fetcher));
    await advance(0);

    act(() => setVisibility('hidden'));
    await advance(5000);
    act(() => setVisibility('visible'));
    await advance(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('se limpia al desmontar', async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    const unsubscribe = vi.fn();
    const subscribe = () => unsubscribe;
    const { unmount } = renderHook(() => useAutoRefresh(fetcher, { subscribe }));
    await advance(0);

    unmount();
    await advance(AUTO_REFRESH_INTERVAL * 3);
    act(() => setVisibility('visible'));
    await advance(0);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('conserva los datos y expone el error si un refresco falla', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(['a']).mockRejectedValueOnce(new Error('Sin conexión'));
    const { result } = renderHook(() => useAutoRefresh(fetcher));
    await advance(0);

    await advance(AUTO_REFRESH_INTERVAL);
    expect(result.current).toMatchObject({ data: ['a'], error: 'Sin conexión', loading: false });
  });

  it('refresh() pide los datos de inmediato y gana la respuesta más reciente', async () => {
    const resolvers = [];
    const fetcher = vi.fn(() => new Promise(resolve => resolvers.push(resolve)));
    const { result } = renderHook(() => useAutoRefresh(fetcher));
    await advance(0);

    let manual;
    act(() => { manual = result.current.refresh(); });
    await advance(0);
    expect(fetcher).toHaveBeenCalledTimes(2);

    // La respuesta vieja llega después de la nueva y se descarta.
    await act(async () => { resolvers[1](['nuevo']); await manual; });
    await act(async () => resolvers[0](['viejo']));
    expect(result.current.data).toEqual(['nuevo']);
  });

  it('refresca cuando llega un aviso externo', async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    let notify;
    const subscribe = callback => { notify = callback; return () => {}; };
    renderHook(() => useAutoRefresh(fetcher, { subscribe }));
    await advance(0);

    await act(async () => notify());
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('un subscribe escrito en línea no provoca peticiones extra en cada render', async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    const { rerender } = renderHook(() => useAutoRefresh(fetcher, { subscribe: () => () => {} }));
    await advance(0);
    rerender();
    rerender();
    await advance(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('no acumula peticiones si la anterior sigue en curso', async () => {
    const fetcher = vi.fn(() => new Promise(() => {}));
    renderHook(() => useAutoRefresh(fetcher));
    await advance(AUTO_REFRESH_INTERVAL * 3);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
