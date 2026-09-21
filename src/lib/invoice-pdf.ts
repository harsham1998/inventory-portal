import { PDFParse } from "pdf-parse";

export type ParsedInvoiceItem = {
  itemName: string;
  rate: number | null;
  qty: number;
  unit: string | null;
  taxableValue: number | null;
  taxAmount: number;
  amount: number;
};

export type ParsedInvoice = {
  invoiceNumber: string | null;
  invoiceDate: string | null; // YYYY-MM-DD
  dueDate: string | null; // YYYY-MM-DD
  subtotal: number | null;
  roundOff: number | null;
  totalAmount: number | null;
  items: ParsedInvoiceItem[];
};

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

export function toIsoDate(text: string): string | null {
  const match = text.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (!match) return null;
  const [, day, monthName, year] = match;
  const month = MONTHS[monthName.slice(0, 3).toLowerCase()];
  if (!month) return null;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

function toNumber(text: string | undefined | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/,/g, "").trim();
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

// Matches an item row from linearized PDF text, e.g.:
// "1 Roti 15.00 80 PCS 1,200.00 0.00 (0%) 1,200.00"
const ROW_PATTERN =
  /^\s*\d+\s+(.+?)\s+([\d,]+\.\d{2})\s+([\d.]+)\s+([A-Za-z]+)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*\(\s*[\d.]+\s*%\s*\)\s+([\d,]+\.\d{2})\s*$/;

export function parseItemsFromText(text: string): ParsedInvoiceItem[] {
  const items: ParsedInvoiceItem[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const match = line.match(ROW_PATTERN);
    if (!match) continue;
    const [, name, rate, qty, unit, taxableValue, taxAmount, amount] = match;
    items.push({
      itemName: name.trim(),
      rate: toNumber(rate),
      qty: toNumber(qty) ?? 0,
      unit: unit.trim(),
      taxableValue: toNumber(taxableValue),
      taxAmount: toNumber(taxAmount) ?? 0,
      amount: toNumber(amount) ?? 0,
    });
  }
  return items;
}

function itemsFromTable(rows: string[][]): ParsedInvoiceItem[] {
  const items: ParsedInvoiceItem[] = [];
  for (const row of rows) {
    const cells = row.map((c) => c.trim());
    // Expect: [#, Item, Rate, Qty (with unit or separate), Taxable Value, Tax Amount, Amount]
    // Tolerate a few column layouts by re-joining and running the same line regex.
    const joined = cells.join(" ");
    const match = joined.match(ROW_PATTERN);
    if (match) {
      const [, name, rate, qty, unit, taxableValue, taxAmount, amount] = match;
      items.push({
        itemName: name.trim(),
        rate: toNumber(rate),
        qty: toNumber(qty) ?? 0,
        unit: unit.trim(),
        taxableValue: toNumber(taxableValue),
        taxAmount: toNumber(taxAmount) ?? 0,
        amount: toNumber(amount) ?? 0,
      });
    }
  }
  return items;
}

export async function parseInvoicePdf(buffer: Buffer): Promise<ParsedInvoice> {
  const parser = new PDFParse({ data: buffer });

  let text = "";
  let items: ParsedInvoiceItem[] = [];

  try {
    const textResult = await parser.getText();
    text = textResult.text ?? "";
  } catch (err) {
    console.error("[parseInvoicePdf] getText failed:", err);
  }

  try {
    const tableResult = await parser.getTable();
    for (const page of tableResult.pages) {
      for (const table of page.tables) {
        const extracted = itemsFromTable(table);
        if (extracted.length > 0) {
          items = extracted;
          break;
        }
      }
      if (items.length > 0) break;
    }
  } catch (err) {
    console.error("[parseInvoicePdf] getTable failed:", err);
  }

  if (items.length === 0 && text) {
    items = parseItemsFromText(text);
  }

  await parser.destroy();

  return { ...parseInvoiceHeader(text), items };
}

export function parseInvoiceHeader(
  text: string,
): Omit<ParsedInvoice, "items"> {
  // A currency symbol (₹) between a label and its number can come back as
  // almost anything depending on the PDF's embedded font — tolerate any
  // short run of non-digit characters there instead of matching ₹ literally.
  const CURRENCY = "[^\\d\\n]{0,3}";
  const invoiceNumberMatch = text.match(/Invoice\s*#:?\s*([A-Za-z0-9-]+)/i);
  const invoiceDateMatch = text.match(/Invoice\s*Date:?\s*(\d{1,2}\s+[A-Za-z]{3,}\s+\d{4})/i);
  const dueDateMatch = text.match(/Due\s*Date:?\s*(\d{1,2}\s+[A-Za-z]{3,}\s+\d{4})/i);
  const subtotalMatch = text.match(new RegExp(`Taxable\\s*Amount\\s*${CURRENCY}([\\d,]+\\.\\d{2})`, "i"));
  const roundOffMatch = text.match(/Round\s*Off\s*(-?[\d,]+\.\d{2})/i);
  const totalMatch =
    text.match(new RegExp(`Amount\\s*Payable:?\\s*${CURRENCY}([\\d,]+\\.\\d{2})`, "i")) ??
    text.match(new RegExp(`Total\\s*${CURRENCY}([\\d,]+\\.\\d{2})`, "i"));

  return {
    invoiceNumber: invoiceNumberMatch?.[1]?.trim() ?? null,
    invoiceDate: invoiceDateMatch ? toIsoDate(invoiceDateMatch[1]) : null,
    dueDate: dueDateMatch ? toIsoDate(dueDateMatch[1]) : null,
    subtotal: toNumber(subtotalMatch?.[1]),
    roundOff: toNumber(roundOffMatch?.[1]),
    totalAmount: toNumber(totalMatch?.[1]),
  };
}
