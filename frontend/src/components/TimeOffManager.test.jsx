import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimeOffManager from './TimeOffManager';
import { apiCreateTimeOff, apiDeleteTimeOff, apiGetTimeOff } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetTimeOff: vi.fn(),
  apiCreateTimeOff: vi.fn(),
  apiDeleteTimeOff: vi.fn(),
}));

const own = { _id: 't1', stylist: 'sofi', start: '2099-03-02', end: '2099-03-06', reason: 'Vacaciones' };
const closure = { _id: 't2', stylist: '', start: '2099-12-25', end: '2099-12-25', reason: 'Navidad' };

describe('TimeOffManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetTimeOff.mockResolvedValue([own, closure]);
    apiCreateTimeOff.mockResolvedValue({});
    apiDeleteTimeOff.mockResolvedValue({});
  });

  it('el estilista bloquea sus fechas y ve los cierres del spa sin poder quitarlos', async () => {
    const user = userEvent.setup();
    render(<TimeOffManager currentUsername="sofi" />);

    const closureRow = (await screen.findByText('Navidad')).closest('tr');
    expect(within(closureRow).getByText('Todo el spa')).toBeInTheDocument();
    expect(within(closureRow).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Aplica a')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2099-04-10' } });
    expect(screen.getByLabelText('Hasta')).toHaveValue('2099-04-10');
    fireEvent.change(screen.getByLabelText('Motivo (opcional)'), { target: { value: 'Cita médica' } });
    await user.click(screen.getByRole('button', { name: 'Bloquear fechas' }));

    expect(apiCreateTimeOff).toHaveBeenCalledWith({ start: '2099-04-10', end: '2099-04-10', reason: 'Cita médica' });
    expect(await screen.findByRole('status')).toHaveTextContent('Las fechas quedaron bloqueadas');
    expect(apiGetTimeOff).toHaveBeenCalledTimes(2);
  });

  it('muestra el error del backend, por ejemplo si hay citas en esas fechas', async () => {
    const user = userEvent.setup();
    apiCreateTimeOff.mockRejectedValue(new Error('Hay 1 cita activa en esas fechas.'));
    render(<TimeOffManager currentUsername="sofi" />);
    await screen.findByText('Navidad');

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2099-04-10' } });
    await user.click(screen.getByRole('button', { name: 'Bloquear fechas' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Hay 1 cita activa en esas fechas.');
  });

  it('el administrador elige a quién aplica y puede quitar cualquier bloqueo', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<TimeOffManager stylists={[{ _id: 's1', username: 'sofi', fullName: 'Sofi Rojas' }]} />);

    const ownRow = (await screen.findByText('Vacaciones')).closest('tr');
    expect(within(ownRow).getByText('Sofi Rojas')).toBeInTheDocument();
    expect(screen.getByLabelText('Aplica a')).toHaveValue('');

    await user.click(within(screen.getByText('Navidad').closest('tr')).getByRole('button', { name: 'Quitar' }));
    expect(apiDeleteTimeOff).toHaveBeenCalledWith('t2');

    await user.selectOptions(screen.getByLabelText('Aplica a'), 'sofi');
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2099-05-01' } });
    await user.click(screen.getByRole('button', { name: 'Bloquear fechas' }));
    expect(apiCreateTimeOff).toHaveBeenCalledWith({ stylist: 'sofi', start: '2099-05-01', end: '2099-05-01', reason: '' });
  });
});
