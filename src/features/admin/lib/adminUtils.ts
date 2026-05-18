import type { ItemSalesRow, Order, ReportPeriod, SalesReportRow } from "./adminApi";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
});

export function formatCurrency(value: number) {
  return CURRENCY.format(value);
}

export function getStatusClass(status: string) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

// ── Palette ────────────────────────────────────────────────────────────────
const GOLD        = [170, 109,  39] as const;  // --primary-gold
const GOLD_LIGHT  = [245, 237, 224] as const;  // warm card bg
const GOLD_MID    = [211, 168, 107] as const;  // mid accent
const TEXT_MAIN   = [ 26,  26,  26] as const;  // --text-main
const TEXT_MUTED  = [102, 102, 102] as const;  // --text-muted
const WHITE       = [255, 255, 255] as const;
const PAGE_BG     = [251, 251, 251] as const;  // --bg-light

// ── Helpers ────────────────────────────────────────────────────────────────
function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}
function setTextColor(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

// ── PDF-safe currency (jsPDF built-in fonts don't support ₱) ──────────────
const PDF_CURRENCY = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function pdfCurrency(value: number): string {
  return `PHP ${PDF_CURRENCY.format(value)}`;
}

// ── PDF export ─────────────────────────────────────────────────────────────
export function downloadPdfReport(
  period: ReportPeriod,
  orders: Order[],
  rows: SalesReportRow[],
  itemSalesRows: ItemSalesRow[],
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210;
  const PH = 297;
  const ML = 14;
  const MR = 14;
  const CW = PW - ML - MR;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);

  // ── Page background ──────────────────────────────────────────────────────
  setFill(doc, PAGE_BG);
  doc.rect(0, 0, PW, PH, "F");

  // ── Header band ──────────────────────────────────────────────────────────
  setFill(doc, GOLD);
  doc.rect(0, 0, PW, 36, "F");

  // Bottom accent stripe on header
  setFill(doc, GOLD_MID);
  doc.rect(0, 34, PW, 2, "F");

  // Brand name
  setTextColor(doc, WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ApplianSys", ML, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Premium Appliances Management Panel", ML, 21);

  // Report title — right side
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Sales Report", PW - MR, 13, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`${periodLabel}  |  Generated ${dateStr}`, PW - MR, 21, { align: "right" });

  // ── KPI cards ────────────────────────────────────────────────────────────
  const totalOrders  = rows.reduce((s, r) => s + r.orders, 0);
  const totalTax     = rows.reduce((s, r) => s + r.taxCollected, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.grossRevenue, 0);
  const totalItemsSold = itemSalesRows.reduce((s, r) => s + r.quantitySold, 0);
  const totalItemSales = itemSalesRows.reduce((s, r) => s + r.grossSales, 0);

  const kpis = [
    { label: "TOTAL ORDERS",   value: String(totalOrders) },
    { label: "TAX COLLECTED",  value: pdfCurrency(totalTax) },
    { label: "GROSS REVENUE",  value: pdfCurrency(totalRevenue) },
  ];

  const cardGap = 5;
  const cardW   = (CW - cardGap * 2) / 3;
  const cardY   = 42;
  const cardH   = 24;

  kpis.forEach((kpi, i) => {
    const x = ML + i * (cardW + cardGap);

    // Card fill + border
    setFill(doc, GOLD_LIGHT);
    setDraw(doc, GOLD_MID);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, "FD");

    // Left accent bar
    setFill(doc, GOLD);
    doc.roundedRect(x, cardY, 3, cardH, 1.5, 1.5, "F");
    // Cover right side of accent bar so only left corners are rounded
    doc.rect(x + 1.5, cardY, 1.5, cardH, "F");

    // Label
    setTextColor(doc, TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(kpi.label, x + 6, cardY + 8);

    // Value
    setTextColor(doc, TEXT_MAIN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(kpi.value, x + 6, cardY + 18);
  });

  // ── Shared helpers ────────────────────────────────────────────────────────
  let y = cardY + cardH + 10;

  const drawSectionTitle = (title: string, subtitle: string) => {
    setTextColor(doc, GOLD);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, ML, y);
    y += 5;

    setTextColor(doc, TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(subtitle, ML, y);
    y += 5;

    setDraw(doc, GOLD_MID);
    doc.setLineWidth(0.4);
    doc.line(ML, y, ML + CW, y);
    y += 4;
  };

  type ColDef = { label: string; w: number; align?: "left" | "right" };
  type CellDef = { value: string; w: number; align?: "left" | "right" };

  const drawTableHeader = (cols: ColDef[]) => {
    setFill(doc, GOLD);
    doc.rect(ML, y, CW, 7, "F");
    setTextColor(doc, WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    let cx = ML + 3;
    for (const col of cols) {
      if (col.align === "right") {
        doc.text(col.label, cx + col.w - 4, y + 5, { align: "right" });
      } else {
        doc.text(col.label, cx, y + 5);
      }
      cx += col.w;
    }
    y += 7;
  };

  const drawTableRow = (cells: CellDef[], isEven: boolean, isTotals = false) => {
    const rowH = 7;

    if (isTotals) {
      setFill(doc, GOLD_LIGHT);
      doc.rect(ML, y, CW, rowH, "F");
      setDraw(doc, GOLD_MID);
      doc.setLineWidth(0.3);
      doc.line(ML, y, ML + CW, y);
    } else if (isEven) {
      setFill(doc, [245, 245, 245] as unknown as readonly [number, number, number]);
      doc.rect(ML, y, CW, rowH, "F");
    }

    doc.setFont("helvetica", isTotals ? "bold" : "normal");
    doc.setFontSize(8);
    setTextColor(doc, isTotals ? GOLD : TEXT_MAIN);

    let cx = ML + 3;
    for (const cell of cells) {
      if (cell.align === "right") {
        doc.text(cell.value, cx + cell.w - 4, y + 5, { align: "right" });
      } else {
        doc.text(cell.value, cx, y + 5);
      }
      cx += cell.w;
    }

    setDraw(doc, [220, 220, 220] as unknown as readonly [number, number, number]);
    doc.setLineWidth(0.1);
    doc.line(ML, y + rowH, ML + CW, y + rowH);
    y += rowH;
  };

  // ── Sales Summary table ───────────────────────────────────────────────────
  drawSectionTitle("Sales Summary", `${periodLabel} breakdown of orders, tax, and revenue`);

  // col widths must sum to CW exactly
  const sW = [CW * 0.36, CW * 0.16, CW * 0.24, CW * 0.24];
  const summaryHeader: ColDef[] = [
    { label: "Period",        w: sW[0] },
    { label: "Orders",        w: sW[1], align: "right" },
    { label: "Tax Collected", w: sW[2], align: "right" },
    { label: "Gross Revenue", w: sW[3], align: "right" },
  ];

  drawTableHeader(summaryHeader);

  rows.forEach((row, i) => {
    drawTableRow(
      [
        { value: row.label,                        w: sW[0] },
        { value: String(row.orders),               w: sW[1], align: "right" },
        { value: pdfCurrency(row.taxCollected),    w: sW[2], align: "right" },
        { value: pdfCurrency(row.grossRevenue),    w: sW[3], align: "right" },
      ],
      i % 2 === 0,
    );
  });

  drawTableRow(
    [
      { value: "Totals",                    w: sW[0] },
      { value: String(totalOrders),         w: sW[1], align: "right" },
      { value: pdfCurrency(totalTax),       w: sW[2], align: "right" },
      { value: pdfCurrency(totalRevenue),   w: sW[3], align: "right" },
    ],
    false,
    true,
  );

  y += 10;

  if (y > PH - 60) {
    doc.addPage();
    setFill(doc, PAGE_BG);
    doc.rect(0, 0, PW, PH, "F");
    y = 14;
  }

  drawSectionTitle("Items Sold", "Individual product totals for the selected report period");

  const iW = [CW * 0.42, CW * 0.16, CW * 0.20, CW * 0.22];
  const itemHeader: ColDef[] = [
    { label: "Item",          w: iW[0] },
    { label: "Units Sold",    w: iW[1], align: "right" },
    { label: "Average Price", w: iW[2], align: "right" },
    { label: "Total Sales",   w: iW[3], align: "right" },
  ];

  drawTableHeader(itemHeader);

  itemSalesRows.forEach((item, i) => {
    if (y > PH - 20) {
      doc.addPage();
      setFill(doc, PAGE_BG);
      doc.rect(0, 0, PW, PH, "F");
      y = 14;
      drawTableHeader(itemHeader);
    }

    drawTableRow(
      [
        { value: item.productName,                   w: iW[0] },
        { value: String(item.quantitySold),          w: iW[1], align: "right" },
        { value: pdfCurrency(item.averageUnitPrice), w: iW[2], align: "right" },
        { value: pdfCurrency(item.grossSales),       w: iW[3], align: "right" },
      ],
      i % 2 === 0,
    );
  });

  drawTableRow(
    [
      { value: "Grand Total Sold by System", w: iW[0] },
      { value: String(totalItemsSold),       w: iW[1], align: "right" },
      { value: "",                          w: iW[2], align: "right" },
      { value: pdfCurrency(totalItemSales),  w: iW[3], align: "right" },
    ],
    false,
    true,
  );

  // ── Order Details table ───────────────────────────────────────────────────
  y += 10;

  if (y > PH - 60) {
    doc.addPage();
    setFill(doc, PAGE_BG);
    doc.rect(0, 0, PW, PH, "F");
    y = 14;
  }

  drawSectionTitle("Order Details", "Individual order records for the selected period");

  // Widths: 182mm total — give Status enough room, Total enough for "PHP 10,073.00"
  const oW = [
    CW * 0.13,   // Order ID   ~23.7mm
    CW * 0.18,   // Customer   ~32.8mm
    CW * 0.25,   // Email      ~45.5mm
    CW * 0.15,   // Date       ~27.3mm
    CW * 0.17,   // Total      ~31mm
    CW * 0.12,   // Status     ~21.8mm
  ];

  const orderHeader: ColDef[] = [
    { label: "Order ID",  w: oW[0] },
    { label: "Customer",  w: oW[1] },
    { label: "Email",     w: oW[2] },
    { label: "Date",      w: oW[3] },
    { label: "Total",     w: oW[4], align: "right" },
    { label: "Status",    w: oW[5] },
  ];

  drawTableHeader(orderHeader);

  orders.forEach((order, i) => {
    if (y > PH - 20) {
      doc.addPage();
      setFill(doc, PAGE_BG);
      doc.rect(0, 0, PW, PH, "F");
      y = 14;
      drawTableHeader(orderHeader);
    }

    drawTableRow(
      [
        { value: order.id,                    w: oW[0] },
        { value: order.customer,              w: oW[1] },
        { value: order.email,                 w: oW[2] },
        { value: order.date,                  w: oW[3] },
        { value: pdfCurrency(order.total),    w: oW[4], align: "right" },
        { value: order.status,                w: oW[5] },
      ],
      i % 2 === 0,
    );
  });

  // ── Footer on every page ──────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);

    setFill(doc, GOLD_LIGHT);
    doc.rect(0, PH - 11, PW, 11, "F");
    setDraw(doc, GOLD_MID);
    doc.setLineWidth(0.3);
    doc.line(0, PH - 11, PW, PH - 11);

    setTextColor(doc, TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("ApplianSys  |  Confidential", ML, PH - 4);
    doc.text(`Page ${p} of ${pageCount}`, PW - MR, PH - 4, { align: "right" });
  }

  doc.save(`appliansys-sales-report-${period}.pdf`);
}

const EXCEL_COLORS = {
  border: "FFE3D6C8",
  gold: "FFA66D27",
  goldDark: "FF6E4317",
  goldLight: "FFF5EDE0",
  muted: "FF7F6248",
  stripe: "FFFBF7F0",
  text: "FF241A12",
  white: "FFFFFFFF",
};

function styleTitleCell(cell: ExcelJS.Cell) {
  cell.font = { bold: true, color: { argb: EXCEL_COLORS.white }, size: 18 };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_COLORS.gold },
  };
  cell.alignment = { horizontal: "left", vertical: "middle" };
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: EXCEL_COLORS.white }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.goldDark },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      bottom: { style: "thin", color: { argb: EXCEL_COLORS.border } },
      left: { style: "thin", color: { argb: EXCEL_COLORS.border } },
      right: { style: "thin", color: { argb: EXCEL_COLORS.border } },
      top: { style: "thin", color: { argb: EXCEL_COLORS.border } },
    };
  });
}

function styleBodyRow(row: ExcelJS.Row, isStriped: boolean) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { color: { argb: EXCEL_COLORS.text }, size: 10 };
    cell.alignment = { vertical: "middle" };
    cell.border = {
      bottom: { style: "thin", color: { argb: EXCEL_COLORS.border } },
    };

    if (isStriped) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: EXCEL_COLORS.stripe },
      };
    }
  });
}

function styleTotalRow(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: EXCEL_COLORS.goldDark }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.goldLight },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: EXCEL_COLORS.gold } },
      top: { style: "thin", color: { argb: EXCEL_COLORS.gold } },
    };
  });
}

function addReportTitle(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  lastColumn: string,
) {
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getRow(1).height = 30;
  sheet.getCell("A1").value = title;
  styleTitleCell(sheet.getCell("A1"));

  const subtitleCell = sheet.getCell("A2");
  subtitleCell.value = subtitle;
  subtitleCell.font = { italic: true, color: { argb: EXCEL_COLORS.muted }, size: 10 };
  subtitleCell.alignment = { horizontal: "left", vertical: "middle" };
}

async function saveWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadExcelReport(
  period: ReportPeriod,
  rows: SalesReportRow[],
  itemSalesRows: ItemSalesRow[],
) {
  const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);
  const totalTax = rows.reduce((sum, row) => sum + row.taxCollected, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.grossRevenue, 0);
  const totalItemsSold = itemSalesRows.reduce((sum, item) => sum + item.quantitySold, 0);
  const totalItemSales = itemSalesRows.reduce((sum, item) => sum + item.grossSales, 0);
  const generatedAt = new Date().toLocaleString("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ApplianSys";
  workbook.created = new Date();
  workbook.modified = new Date();

  const summarySheet = workbook.addWorksheet("Sales Report", {
    pageSetup: { fitToPage: true, orientation: "landscape" },
    views: [{ state: "frozen", ySplit: 4 }],
  });

  addReportTitle(
    summarySheet,
    "ApplianSys Sales Report",
    `${periodLabel} sales summary | Generated ${generatedAt}`,
    "D",
  );

  summarySheet.columns = [
    { key: "period", width: 34 },
    { key: "orders", width: 16 },
    { key: "tax", width: 20 },
    { key: "revenue", width: 20 },
  ];
  summarySheet.addRow([]);
  const summaryHeader = summarySheet.addRow([
    "Period",
    "Total Orders",
    "Tax Collected",
    "Gross Revenue",
  ]);
  styleHeaderRow(summaryHeader);

  rows.forEach((row, index) => {
    const sheetRow = summarySheet.addRow([
      row.label,
      row.orders,
      Number(row.taxCollected.toFixed(2)),
      Number(row.grossRevenue.toFixed(2)),
    ]);
    sheetRow.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    sheetRow.getCell(3).numFmt = "₱#,##0.00";
    sheetRow.getCell(4).numFmt = "₱#,##0.00";
    styleBodyRow(sheetRow, index % 2 === 1);
  });

  const summaryTotalRow = summarySheet.addRow([
    "Totals",
    totalOrders,
    Number(totalTax.toFixed(2)),
    Number(totalRevenue.toFixed(2)),
  ]);
  summaryTotalRow.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
  summaryTotalRow.getCell(3).numFmt = "₱#,##0.00";
  summaryTotalRow.getCell(4).numFmt = "₱#,##0.00";
  styleTotalRow(summaryTotalRow);

  summarySheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { ...cell.alignment, wrapText: true };
    });
  });

  const itemSheet = workbook.addWorksheet("Items Sold", {
    pageSetup: { fitToPage: true, orientation: "landscape" },
    views: [{ state: "frozen", ySplit: 4 }],
  });

  addReportTitle(
    itemSheet,
    "ApplianSys Items Sold",
    `${periodLabel} product totals | Generated ${generatedAt}`,
    "D",
  );

  itemSheet.columns = [
    { key: "item", width: 34 },
    { key: "quantitySold", width: 16 },
    { key: "averageUnitPrice", width: 20 },
    { key: "grossSales", width: 20 },
  ];
  itemSheet.addRow([]);
  const itemHeader = itemSheet.addRow([
    "Item Sold",
    "Units Sold",
    "Average Price",
    "Total Sales",
  ]);
  styleHeaderRow(itemHeader);

  itemSalesRows.forEach((item, index) => {
    const sheetRow = itemSheet.addRow([
      item.productName,
      item.quantitySold,
      Number(item.averageUnitPrice.toFixed(2)),
      Number(item.grossSales.toFixed(2)),
    ]);
    sheetRow.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    sheetRow.getCell(3).numFmt = "₱#,##0.00";
    sheetRow.getCell(4).numFmt = "₱#,##0.00";
    styleBodyRow(sheetRow, index % 2 === 1);
  });

  const itemTotalRow = itemSheet.addRow([
    "Grand Total Sold by System",
    totalItemsSold,
    "",
    Number(totalItemSales.toFixed(2)),
  ]);
  itemTotalRow.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
  itemTotalRow.getCell(4).numFmt = "₱#,##0.00";
  styleTotalRow(itemTotalRow);

  itemSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { ...cell.alignment, wrapText: true };
    });
  });

  await saveWorkbook(workbook, `appliansys-sales-report-${period}.xlsx`);
}
