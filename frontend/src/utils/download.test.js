import { describe, expect, it } from 'vitest';
import { appointmentInterval, toCsv, toIcs } from './download';

describe('toCsv', () => {
  const columns = [
    { label: 'Cliente', value: row => row.name },
    { label: 'Notas', value: row => row.notes },
  ];

  it('usa ";" con BOM, escapa comillas y saltos de línea', () => {
    const csv = toCsv(columns, [{ name: 'Ana Pérez', notes: 'Dijo "hola"; luego\nse fue' }]);
    expect(csv).toBe('﻿Cliente;Notas\r\nAna Pérez;"Dijo ""hola""; luego\nse fue"');
  });

  it('neutraliza celdas que Excel ejecutaría como fórmula', () => {
    expect(toCsv(columns, [{ name: '=HYPERLINK("x")', notes: null }])).toBe('﻿Cliente;Notas\r\n"\'=HYPERLINK(""x"")";');
  });
});

describe('calendario', () => {
  const appointment = { _id: 'a1', service: 'Corte, lavado', stylist: 'sofi', date: '2030-01-07', time: '2:30 PM', duration: 90 };

  it('convierte la hora de Colombia (UTC-5) a UTC', () => {
    const { start, end } = appointmentInterval(appointment);
    expect(start.toISOString()).toBe('2030-01-07T19:30:00.000Z');
    expect(end.toISOString()).toBe('2030-01-07T21:00:00.000Z');
  });

  it('genera un evento con recordatorio y textos escapados', () => {
    const ics = toIcs(appointment, { stylistName: 'Sofi Rojas', location: 'Calle 1 # 2-3, Neiva' });
    expect(ics).toContain('DTSTART:20300107T193000Z');
    expect(ics).toContain('DTEND:20300107T210000Z');
    expect(ics).toContain('SUMMARY:Corte\\, lavado - Essence De Toi');
    expect(ics).toContain('DESCRIPTION:Servicio: Corte\\, lavado\\nEstilista: Sofi Rojas');
    expect(ics).toContain('LOCATION:Calle 1 # 2-3\\, Neiva');
    expect(ics).toContain('TRIGGER:-PT2H');
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });
});
