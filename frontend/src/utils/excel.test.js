import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { buildWorkbook } from './excel';

const spec = {
  title: 'Listado de citas',
  subtitle: 'Estado: Todas',
  sheets: [{
    name: 'Citas',
    totals: { label: 'Citas' },
    rows: [
      { date: '2026-11-07', time: '2:30 PM', name: 'Ana Pérez', status: 'CONFIRMED', price: 60000, notes: '=HYPERLINK("x")' },
      { date: '2026-11-08', time: '9:00 AM', name: 'Luis', status: 'NO_SHOW', price: '', notes: '' },
    ],
    columns: [
      { label: 'Fecha', type: 'date', value: row => row.date },
      { label: 'Hora', type: 'time', value: row => row.time },
      { label: 'Cliente', value: row => row.name },
      { label: 'Estado', type: 'status', value: row => row.status },
      { label: 'Precio', type: 'currency', total: true, value: row => row.price },
      { label: 'Notas', wrap: true, value: row => row.notes },
    ],
  }],
};

// Se escribe y se vuelve a leer el archivo, como lo abriría Excel.
const roundTrip = async () => {
  const workbook = await buildWorkbook(spec, new Date('2026-11-07T15:00:00Z'));
  const reread = new ExcelJS.Workbook();
  await reread.xlsx.load(await workbook.xlsx.writeBuffer());
  return reread.getWorksheet('Citas');
};

describe('buildWorkbook', () => {
  it('pone el título de la marca, el contexto y encabezados fijos con filtro', async () => {
    const sheet = await roundTrip();
    expect(sheet.getCell('A1').value).toBe('ESSENCE DE TOI  ·  Listado de citas');
    expect(sheet.getCell('A2').value).toMatch(/^Estado: Todas\nGenerado el 7 de noviembre de 2026/);
    expect(sheet.getRow(4).values.slice(1)).toEqual(['Fecha', 'Hora', 'Cliente', 'Estado', 'Precio', 'Notas']);
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 4 });
    expect(sheet.autoFilter).toBeTruthy();
  });

  it('guarda fechas, horas y precios como valores reales con formato', async () => {
    const sheet = await roundTrip();
    expect(sheet.getCell('A5').value).toEqual(new Date(Date.UTC(2026, 10, 7)));
    expect(sheet.getCell('A5').numFmt).toBe('dd/mm/yyyy');
    // Se guarda como fracción del día (0,604); al leerla con formato de hora vuelve como fecha base de Excel.
    expect(sheet.getCell('B5').value).toEqual(new Date('1899-12-30T14:30:00Z'));
    expect(sheet.getCell('B5').numFmt).toBe('h:mm AM/PM');
    expect(sheet.getCell('E5').value).toBe(60000);
    expect(sheet.getCell('E5').numFmt).toBe('"$" #,##0');
    expect(sheet.getCell('E6').value).toBeNull();
  });

  it('colorea el estado y deja el texto como literal, no como fórmula', async () => {
    const sheet = await roundTrip();
    expect(sheet.getCell('D5').value).toBe('Confirmada');
    expect(sheet.getCell('D5').fill.fgColor.argb).toBe('FFDFF3E4');
    expect(sheet.getCell('D6').value).toBe('No asistió');
    expect(sheet.getCell('F5').value).toBe('=HYPERLINK("x")');
    expect(sheet.getCell('F5').formula).toBeUndefined();
  });

  it('agrega una fila de totales con el conteo y la suma', async () => {
    const sheet = await roundTrip();
    expect(sheet.getCell('A7').value).toBe('Citas: 2');
    expect(sheet.getCell('E7').formula).toBe('SUBTOTAL(9,E5:E6)');
    expect(sheet.getCell('E7').result).toBe(60000);
  });

  // Excel muestra "#####" cuando una fecha o un número no cabe en la columna.
  it('deja columnas anchas para fechas, horas y totales en negrita', async () => {
    const sheet = await roundTrip();
    expect(sheet.getColumn('A').width).toBeGreaterThanOrEqual(15); // "07/11/2026" + sangría
    expect(sheet.getColumn('B').width).toBeGreaterThanOrEqual(16); // "2:30 p. m."
    expect(sheet.getColumn('E').width).toBeGreaterThanOrEqual(14); // total "$ 60.000" en negrita
  });

  it('ensancha una hoja estrecha para que el título y los filtros no se corten', async () => {
    const workbook = await buildWorkbook({
      title: 'Resumen del negocio',
      subtitle: 'Período: 2026-11-01 a 2026-11-07  ·  Estado: Completada  ·  Servicio: Tratamiento Capilar',
      sheets: [{
        name: 'Resumen',
        rows: [{ label: 'Ticket promedio (completadas)', value: 60000 }],
        columns: [
          { label: 'Indicador', bold: true, value: row => row.label },
          { label: 'Valor', type: 'currency', value: row => row.value, width: 22 },
        ],
      }],
    });
    const sheet = workbook.getWorksheet('Resumen');
    const total = sheet.getColumn('A').width + sheet.getColumn('B').width;
    expect(total).toBeGreaterThanOrEqual(85);
    expect(sheet.getColumn('A').width).toBeGreaterThanOrEqual(39); // indicador en negrita completo
    expect(sheet.getCell('A2').value).toContain('\nGenerado el');
  });
});
