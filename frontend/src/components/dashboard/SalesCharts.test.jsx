import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesCharts from './SalesCharts';

const catalog = [{ name: 'Corte para Dama', price: '$ 35.000' }, { name: 'Masaje Relajante', price: '$ 70.000' }];
const completed = (date, service) => ({ _id: `${date}-${service}`, date, service, status: 'COMPLETED' });
const appointments = [
  completed('2030-01-07', 'Corte para Dama'),
  completed('2030-01-07', 'Masaje Relajante'),
  completed('2030-01-03', 'Masaje Relajante'),
  // Período anterior de 7 días (del 25 al 31 de diciembre).
  completed('2029-12-28', 'Corte para Dama'),
  { _id: 'p', date: '2030-01-07', service: 'Masaje Relajante', status: 'PENDING' },
];

const renderCharts = () => render(<SalesCharts appointments={appointments} catalog={catalog} today="2030-01-07" />);
const figure = label => screen.getByText(label, { selector: 'span' }).parentElement;

describe('SalesCharts', () => {
  it('resume los ingresos de las citas completadas del período elegido', async () => {
    const user = userEvent.setup();
    renderCharts();
    expect(screen.getByRole('button', { name: '14 días' })).toHaveAttribute('aria-pressed', 'true');
    // 14 días (25 dic – 7 ene) incluye la cita del 28 de diciembre.
    expect(figure('Ingresos')).toHaveTextContent(/210\.000/);
    expect(figure('Citas completadas')).toHaveTextContent('4');

    await user.click(screen.getByRole('button', { name: '7 días' }));
    expect(figure('Ingresos')).toHaveTextContent(/175\.000/);
    // Período anterior: 35.000 → actual 175.000 = +400 %.
    expect(figure('Ingresos')).toHaveTextContent('▲ 400 % vs. los 7 días anteriores');
    expect(screen.getAllByRole('listitem', { name: /cita/ })).toHaveLength(7);
  });

  it('muestra el detalle del día al pasar el cursor o enfocar una barra', async () => {
    const user = userEvent.setup();
    renderCharts();
    await user.click(screen.getByRole('button', { name: '7 días' }));
    const day = screen.getByRole('listitem', { name: /7 de enero/ });
    await user.hover(day);
    expect(within(day).getByRole('tooltip')).toHaveTextContent(/105\.000/);
    expect(within(day).getByRole('tooltip')).toHaveTextContent('2 citas completadas');
    await user.unhover(day);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('ordena los servicios más vendidos por ingresos', () => {
    renderCharts();
    const items = within(screen.getByRole('list', { name: 'Servicios con más ingresos' })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Masaje Relajante');
    expect(items[0]).toHaveTextContent('2 citas completadas');
    expect(items[1]).toHaveTextContent('Corte para Dama');
  });

  it('indica cuando no hay ventas en el período', () => {
    render(<SalesCharts appointments={[]} catalog={catalog} today="2030-01-07" />);
    expect(screen.getByText('Sin ventas completadas en este período.')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay servicios completados en este período.')).toBeInTheDocument();
  });
});
