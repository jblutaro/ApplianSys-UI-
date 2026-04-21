import type { Order, ReportPeriod, SalesReportRow } from "./adminApi";

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

export function downloadExcelReport(
  period: ReportPeriod,
  orders: Order[],
  rows: SalesReportRow[],
) {
  const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);
  const totalTax = rows.reduce((sum, row) => sum + row.taxCollected, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.grossRevenue, 0);
  const summaryHeader = ["Period", "Total Orders", "Tax Collected", "Gross Revenue"];
  const orderHeader = ["Order ID", "Customer", "Email", "Date", "Total", "Status"];

  const escapeCell = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const makeRow = (cells: Array<string | number>) =>
    `<Row>${cells
      .map(
        (cell) =>
          `<Cell><Data ss:Type="${typeof cell === "number" ? "Number" : "String"}">${escapeCell(String(cell))}</Data></Cell>`,
      )
      .join("")}</Row>`;

  const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Sales Report">
  <Table>
   ${makeRow(["ApplianSys Sales Report"])}
   ${makeRow([`Period: ${period}`])}
   ${makeRow([])}
   ${makeRow(summaryHeader)}
   ${rows
     .map((row) =>
       makeRow([
         row.label,
         row.orders,
         Number(row.taxCollected.toFixed(2)),
         Number(row.grossRevenue.toFixed(2)),
       ]),
     )
     .join("")}
   ${makeRow([
     "Totals",
     totalOrders,
     Number(totalTax.toFixed(2)),
     Number(totalRevenue.toFixed(2)),
   ])}
   ${makeRow([])}
   ${makeRow(orderHeader)}
   ${orders
     .map((order) =>
       makeRow([
         order.id,
         order.customer,
         order.email,
         order.date,
         Number(order.total.toFixed(2)),
         order.status,
       ]),
     )
     .join("")}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `appliansys-sales-report-${period}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
