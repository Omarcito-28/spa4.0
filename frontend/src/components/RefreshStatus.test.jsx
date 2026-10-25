import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import RefreshStatus from './RefreshStatus';

describe('RefreshStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra cuánto hace de la última actualización y avanza cada segundo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-07T15:00:00Z'));
    render(<RefreshStatus lastUpdated={Date.now() - 12000} refreshing={false} onRefresh={() => {}} />);
    expect(screen.getByText('Actualizado hace 12 s')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(60000); });
    expect(screen.getByText('Actualizado hace 1 min')).toBeInTheDocument();
  });

  it('indica la carga inicial', () => {
    render(<RefreshStatus lastUpdated={null} refreshing onRefresh={() => {}} />);
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('refresca a mano y se desactiva mientras actualiza', () => {
    const onRefresh = vi.fn();
    const { rerender } = render(<RefreshStatus lastUpdated={Date.now()} refreshing={false} onRefresh={onRefresh} />);

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar ahora' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    rerender(<RefreshStatus lastUpdated={Date.now()} refreshing onRefresh={onRefresh} />);
    expect(screen.getByRole('button', { name: 'Actualizar ahora' })).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('Actualizando…');
  });
});
