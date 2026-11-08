import { describe, expect, it } from 'vitest';
import { lastDays, priceOf, revenueByDay, revenueByService, revenueOf, toAmount } from './revenue';

const catalog = [{ name: 'Corte', price: '$ 35.000' }, { name: 'Masaje', price: '$ 70.000' }];
const appointment = overrides => ({ service: 'Corte', date: '2030-01-07', status: 'COMPLETED', ...overrides });

describe('revenue', () => {
  it('convierte precios con formato a números', () => {
    expect(toAmount('$ 35.000')).toBe(35000);
    expect(toAmount('')).toBe(0);
    expect(toAmount(undefined)).toBe(0);
  });

  it('usa el precio guardado en la cita y, si falta, el del catálogo', () => {
    expect(priceOf(appointment({ price: '$ 30.000' }), catalog)).toBe('$ 30.000');
    expect(priceOf(appointment(), catalog)).toBe('$ 35.000');
    expect(revenueOf([appointment({ price: '$ 30.000' }), appointment({ service: 'Masaje' })], catalog)).toBe(100000);
  });

  it('genera los últimos días incluyendo hoy, cruzando meses', () => {
    expect(lastDays('2030-03-02', 4)).toEqual(['2030-02-27', '2030-02-28', '2030-03-01', '2030-03-02']);
  });

  it('suma por día solo las citas completadas dentro del rango', () => {
    const days = revenueByDay([
      appointment(),
      appointment({ service: 'Masaje' }),
      appointment({ status: 'CONFIRMED' }),
      appointment({ date: '2030-01-01' }),
    ], catalog, ['2030-01-06', '2030-01-07']);
    expect(days).toEqual([
      { date: '2030-01-06', amount: 0, count: 0 },
      { date: '2030-01-07', amount: 105000, count: 2 },
    ]);
  });

  it('ordena los servicios por ingresos y limita la cantidad', () => {
    const top = revenueByService([
      appointment(), appointment(), appointment({ service: 'Masaje' }), appointment({ service: 'Uñas', price: '$ 10.000' }),
    ], catalog, ['2030-01-07'], 2);
    expect(top).toEqual([
      { service: 'Corte', amount: 70000, count: 2 },
      { service: 'Masaje', amount: 70000, count: 1 },
    ]);
  });
});
