import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientNotesPanel from './ClientNotesPanel';
import { apiCreateClientNote, apiDeleteClientNote, apiGetClientNotes } from '../services/api';

vi.mock('../services/api', () => ({
  apiGetClientNotes: vi.fn(),
  apiCreateClientNote: vi.fn(),
  apiDeleteClientNote: vi.fn(),
}));

vi.mock('../contexts/auth', () => ({
  useAuth: () => ({ user: { username: 'sofi', role: 'STYLIST' } }),
}));

const own = { _id: 'n1', author: 'sofi', authorName: 'Sofi Rojas', text: 'Alérgica al amoníaco', createdAt: '2030-01-07T15:00:00Z' };
const other = { _id: 'n2', author: 'marta', authorName: 'Marta', text: 'Tinte 7.1', createdAt: '2030-01-05T15:00:00Z' };

describe('ClientNotesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGetClientNotes.mockResolvedValue([own, other]);
    apiCreateClientNote.mockResolvedValue({});
    apiDeleteClientNote.mockResolvedValue({});
  });

  it('muestra las notas y solo deja borrar las propias', async () => {
    render(<ClientNotesPanel client="ana" clientName="Ana Pérez" />);

    const ownNote = (await screen.findByText('Alérgica al amoníaco')).closest('li');
    expect(within(ownNote).getByRole('button', { name: 'Borrar' })).toBeInTheDocument();
    expect(within(screen.getByText('Tinte 7.1').closest('li')).queryByRole('button')).not.toBeInTheDocument();
    expect(apiGetClientNotes).toHaveBeenCalledWith('ana');
  });

  it('agrega una nota y recarga la lista', async () => {
    const user = userEvent.setup();
    render(<ClientNotesPanel client="ana" />);
    await screen.findByText('Alérgica al amoníaco');

    expect(screen.getByRole('button', { name: 'Guardar nota' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Nueva nota'), { target: { value: 'Prefiere la tarde' } });
    await user.click(screen.getByRole('button', { name: 'Guardar nota' }));

    expect(apiCreateClientNote).toHaveBeenCalledWith('ana', 'Prefiere la tarde');
    expect(apiGetClientNotes).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText('Nueva nota')).toHaveValue('');
  });

  it('muestra el error si el estilista no atiende a ese cliente', async () => {
    apiGetClientNotes.mockRejectedValue(new Error('Solo puedes ver las notas de clientes que atiendes.'));
    render(<ClientNotesPanel client="luis" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Solo puedes ver las notas de clientes que atiendes.');
  });
});
