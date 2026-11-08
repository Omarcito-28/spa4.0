import { APPOINTMENT_STATUSES } from './appointmentStatus';
import { appointmentTimeToMinutes } from './date';
import { downloadFile } from './download';

// Exportación a Excel (.xlsx) con la imagen de la marca: banda oscura con el
// título en dorado, encabezados fijos con filtros, filas alternas, estados con
// su color, fechas y precios como valores reales (se pueden ordenar y sumar) y
// una fila de totales con fórmulas. ExcelJS se carga solo al exportar.

const BRAND = {
  dark: 'FF0D0B08',
  gold: 'FFC9942A',
  goldDark: 'FF996515',
  goldSoft: 'FFFDF8EF',
  ink: 'FF1A1A2E',
  muted: 'FF6B6B7B',
  zebra: 'FFFAF7F1',
  line: 'FFEEE8DC',
};

const FORMATS = {
  date: 'dd/mm/yyyy',
  time: 'h:mm AM/PM',
  number: '#,##0',
  currency: '"$" #,##0',
  percent: '0%',
};

const argb = hex => `FF${hex.replace('#', '').toUpperCase()}`;
const fill = color => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: color } });
const thin = color => ({ style: 'thin', color: { argb: color } });

// "2026-11-07" → fecha real de Excel (en UTC, para que no se corra un día).
const toExcelDate = value => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
  return match ? new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])) : null;
};

// "2:30 PM" → fracción del día, que Excel muestra como hora.
const toExcelTime = value => {
  if (!/^\d{1,2}:\d{2} (AM|PM)$/.test(value || '')) return null;
  return appointmentTimeToMinutes(value) / 1440;
};

const cellValue = (type, raw) => {
  if (raw === null || raw === undefined || raw === '') return null;
  if (type === 'date') return toExcelDate(raw) ?? String(raw);
  if (type === 'time') return toExcelTime(raw) ?? String(raw);
  if (['number', 'currency', 'percent'].includes(type)) {
    const number = Number(raw);
    return Number.isFinite(number) ? number : String(raw);
  }
  if (type === 'status') return APPOINTMENT_STATUSES[raw]?.label ?? String(raw);
  // Texto siempre literal: un valor que empieza por "=" no se ejecuta como fórmula.
  return String(raw);
};

// Texto tal como lo muestra Excel, para calcular el ancho de la columna. Si una
// fecha o un número no cabe, Excel no lo recorta: muestra "#####".
const displayText = (type, raw) => {
  if (raw === null || raw === undefined || raw === '') return '';
  if (type === 'date') return '00/00/0000';
  if (type === 'time') return '12:30 p. m.';
  if (type === 'currency') return `$ ${Math.round(Number(raw) || 0).toLocaleString('es-CO')}`;
  if (type === 'number') return (Number(raw) || 0).toLocaleString('es-CO');
  if (type === 'percent') return '100%';
  if (type === 'status') return APPOINTMENT_STATUSES[raw]?.label ?? String(raw);
  return String(raw);
};

// Ancho en unidades de Excel (≈ un carácter de Calibri 11): la negrita ocupa más
// y la sangría de las celdas suma unos 3 caracteres, más el margen interno.
const CELL_PADDING = 4;
const FILTER_ARROW = 3;
const measure = (text, { bold = false, scale = 1 } = {}) =>
  Math.ceil(Math.max(0, ...String(text).split('\n').map(line => line.length)) * (bold ? 1.2 : 1.1) * scale) + CELL_PADDING;

const typeOf = (column, row) => (typeof column.type === 'function' ? column.type(row) : column.type) || 'text';

const columnLetter = index => {
  let letter = '';
  for (let n = index; n > 0; n = Math.floor((n - 1) / 26)) letter = String.fromCharCode(65 + ((n - 1) % 26)) + letter;
  return letter;
};

const HEADER_ROW = 4;

const addSheet = (workbook, { title, subtitle, generatedAt }, sheet) => {
  const { name, columns, rows, totals } = sheet;
  const worksheet = workbook.addWorksheet(name, {
    views: [{ state: 'frozen', ySplit: HEADER_ROW, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } },
    headerFooter: { oddFooter: '&L&8Essence De Toi&R&8Página &P de &N' },
  });
  const lastColumn = columnLetter(columns.length);

  // Banda del título y línea de contexto.
  worksheet.mergeCells(`A1:${lastColumn}1`);
  worksheet.mergeCells(`A2:${lastColumn}2`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `ESSENCE DE TOI  ·  ${title}`;
  titleCell.font = { name: 'Georgia', size: 16, bold: true, color: { argb: BRAND.gold } };
  titleCell.alignment = { vertical: 'middle', indent: 1 };
  worksheet.getRow(1).height = 34;
  // Filtros en una línea y la fecha de generación en otra, para que quepa en hojas estrechas.
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = [subtitle, `Generado el ${generatedAt}`].filter(Boolean).join('\n');
  subtitleCell.font = { size: 10, italic: true, color: { argb: 'FFD9C9A3' } };
  subtitleCell.alignment = { vertical: 'middle', wrapText: true, indent: 1 };
  worksheet.getRow(2).height = subtitle ? 32 : 20;
  for (let index = 1; index <= columns.length; index += 1) {
    worksheet.getCell(1, index).fill = fill(BRAND.dark);
    worksheet.getCell(2, index).fill = fill(BRAND.dark);
    worksheet.getCell(2, index).border = { bottom: { style: 'medium', color: { argb: BRAND.gold } } };
  }
  worksheet.getRow(3).height = 8;

  // Encabezados.
  const header = worksheet.getRow(HEADER_ROW);
  columns.forEach((column, index) => {
    const cell = header.getCell(index + 1);
    cell.value = column.label;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = fill(BRAND.goldDark);
    cell.alignment = { vertical: 'middle', horizontal: ['number', 'currency', 'percent'].includes(column.type) ? 'right' : 'left', indent: 1 };
    cell.border = { bottom: thin(BRAND.dark) };
  });
  header.height = 26;

  // Datos.
  const widths = columns.map(column => measure(column.label, { bold: true }) + FILTER_ARROW);
  const fit = (index, text, options) => {
    const limit = columns[index].wrap ? 45 : 60;
    widths[index] = Math.max(widths[index], Math.min(measure(text, options), limit));
  };
  rows.forEach((row, rowIndex) => {
    const excelRow = worksheet.getRow(HEADER_ROW + 1 + rowIndex);
    columns.forEach((column, index) => {
      const type = typeOf(column, row);
      const raw = column.value(row);
      const cell = excelRow.getCell(index + 1);
      cell.value = cellValue(type, raw);
      if (FORMATS[type]) cell.numFmt = FORMATS[type];
      cell.font = { size: 11, color: { argb: BRAND.ink }, bold: Boolean(column.bold) };
      cell.alignment = { vertical: 'top', wrapText: Boolean(column.wrap), indent: 1 };
      cell.border = { bottom: thin(BRAND.line) };
      if (rowIndex % 2) cell.fill = fill(BRAND.zebra);
      const status = type === 'status' && APPOINTMENT_STATUSES[raw];
      if (status) {
        cell.fill = fill(argb(status.background));
        cell.font = { size: 11, bold: true, color: { argb: argb(status.color) } };
        cell.alignment = { vertical: 'top', horizontal: 'center' };
      }
      fit(index, displayText(type, raw), { bold: Boolean(column.bold) || Boolean(status) });
    });
  });

  const firstData = HEADER_ROW + 1;
  const lastData = HEADER_ROW + rows.length;
  if (rows.length) worksheet.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: lastData, column: columns.length } };

  // Totales: conteo en la primera columna y sumas con fórmula en las marcadas.
  if (totals && rows.length) {
    const totalRow = worksheet.getRow(lastData + 1);
    columns.forEach((column, index) => {
      const cell = totalRow.getCell(index + 1);
      if (index === 0) {
        cell.value = `${totals.label ?? 'Total'}: ${rows.length}`;
        fit(index, cell.value, { bold: true });
      } else if (column.total) {
        const letter = columnLetter(index + 1);
        // La suma es más larga que cada valor: se mide para que no salga "#####".
        const sum = rows.reduce((total, row) => total + (Number(column.value(row)) || 0), 0);
        cell.value = { formula: `SUBTOTAL(9,${letter}${firstData}:${letter}${lastData})`, result: sum };
        cell.numFmt = FORMATS[column.type] || FORMATS.number;
        fit(index, displayText(column.type === 'currency' ? 'currency' : 'number', sum), { bold: true });
      }
      cell.font = { bold: true, size: 11, color: { argb: BRAND.goldDark } };
      cell.fill = fill(BRAND.goldSoft);
      cell.alignment = { vertical: 'middle', indent: 1 };
      cell.border = { top: { style: 'medium', color: { argb: BRAND.gold } } };
    });
    totalRow.height = 22;
  }

  if (!rows.length) {
    const cell = worksheet.getCell(firstData, 1);
    cell.value = 'No hay datos con estos filtros.';
    cell.font = { italic: true, color: { argb: BRAND.muted } };
  }

  // Anchos finales: "width" de una columna es un mínimo. Si la hoja es más estrecha
  // que el título o los filtros (p. ej. el resumen, con dos columnas), se reparte
  // el espacio que falta entre las columnas para que la banda no se corte.
  columns.forEach((column, index) => { widths[index] = Math.max(widths[index], column.width ?? 0); });
  const bandWidth = Math.max(
    measure(titleCell.value, { bold: true, scale: 1.55 }),
    measure(subtitleCell.value, { scale: 0.95 }),
  );
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  const grow = totalWidth < bandWidth ? bandWidth / totalWidth : 1;
  widths.forEach((width, index) => { worksheet.getColumn(index + 1).width = Math.ceil(width * grow); });
  return worksheet;
};

const loadExcelJS = async () => {
  const module = await import('exceljs');
  return module.default ?? module;
};

// spec: { title, subtitle, sheets: [{ name, columns: [{ label, value, type, total, wrap, width, bold }], rows, totals }] }
// type: text | date | time | number | currency | percent | status (o una función de la fila).
export const buildWorkbook = async ({ title, subtitle, sheets }, now = new Date()) => {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Essence De Toi';
  workbook.created = now;
  const generatedAt = now.toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'long', timeStyle: 'short' });
  sheets.forEach(sheet => addSheet(workbook, { title: sheet.title ?? title, subtitle, generatedAt }, sheet));
  return workbook;
};

export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const downloadExcel = async (filename, spec) => {
  const workbook = await buildWorkbook(spec);
  downloadFile(filename, await workbook.xlsx.writeBuffer(), XLSX_TYPE);
};
