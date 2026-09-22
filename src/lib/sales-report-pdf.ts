import { PDFParse } from "pdf-parse";

export type ParsedSalesReportItem = {
  category: string | null;
  itemName: string;
  qty: number;
  total: number;
};

export type ParsedSalesReport = {
  restaurantName: string | null;
  items: ParsedSalesReportItem[];
};

const SUMMARY_ROW_LABELS = new Set(["total", "min.", "max.", "avg."]);

function toNumber(text: string | undefined | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/,/g, "").trim();
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

// Petpooja's "Item Wise: Sales Report" export is a real ruled table:
// Category | Item | Code | Sap Code | Qty. | Total (₹)
// plus Total/Min./Max./Avg. summary rows to skip.
export function itemsFromTable(rows: string[][]): ParsedSalesReportItem[] {
  const items: ParsedSalesReportItem[] = [];
  for (const row of rows) {
    const cells = row.map((c) => c.trim());
    if (cells.length < 2) continue;
    const first = cells[0].toLowerCase();
    if (first === "category" || SUMMARY_ROW_LABELS.has(first)) continue;

    // Last two numeric-looking cells are qty and total; category/item/code
    // fill the cells before them (layout varies slightly row to row).
    const numericFromEnd: number[] = [];
    for (let i = cells.length - 1; i >= 0 && numericFromEnd.length < 2; i--) {
      const n = toNumber(cells[i]);
      if (n !== null) numericFromEnd.unshift(n);
      else break;
    }
    if (numericFromEnd.length < 2) continue;
    const [qty, total] = numericFromEnd;

    const nonNumericCells = cells.slice(0, cells.length - 2).filter((c) => c.length > 0);
    if (nonNumericCells.length === 0) continue;

    const category = nonNumericCells.length > 1 ? nonNumericCells[0] : null;
    const itemName = nonNumericCells.length > 1 ? nonNumericCells[1] : nonNumericCells[0];

    if (!itemName || qty <= 0) continue;
    items.push({ category, itemName, qty, total: total ?? 0 });
  }
  return items;
}

// Fallback for when table geometry isn't detected: "<name...> <qty> <total>"
// per line. Category/code can't be reliably split out of linear text, so
// the whole prefix becomes the item name — good enough to review/fix.
const LINE_PATTERN = /^(.+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*$/;

export function parseItemsFromText(text: string): ParsedSalesReportItem[] {
  const items: ParsedSalesReportItem[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const match = line.match(LINE_PATTERN);
    if (!match) continue;
    const [, name, qtyText, totalText] = match;
    const first = name.trim().toLowerCase();
    if (SUMMARY_ROW_LABELS.has(first) || first === "category") continue;
    const qty = toNumber(qtyText) ?? 0;
    const total = toNumber(totalText) ?? 0;
    if (qty <= 0) continue;
    items.push({ category: null, itemName: name.trim(), qty, total });
  }
  return items;
}

export async function parseSalesReportPdf(buffer: Buffer): Promise<ParsedSalesReport> {
  const parser = new PDFParse({ data: buffer });

  let text = "";
  let items: ParsedSalesReportItem[] = [];

  try {
    const textResult = await parser.getText();
    text = textResult.text ?? "";
  } catch (err) {
    console.error("[parseSalesReportPdf] getText failed:", err);
  }

  try {
    const tableResult = await parser.getTable();
    for (const page of tableResult.pages) {
      for (const table of page.tables) {
        const extracted = itemsFromTable(table);
        if (extracted.length > 0) items.push(...extracted);
      }
    }
  } catch (err) {
    console.error("[parseSalesReportPdf] getTable failed:", err);
  }

  if (items.length === 0 && text) {
    items = parseItemsFromText(text);
  }

  await parser.destroy();

  // Multi-page reports repeat the same item across pages in some exports —
  // merge duplicate (category, name) rows by summing qty/total just in case.
  const merged = new Map<string, ParsedSalesReportItem>();
  for (const item of items) {
    const key = `${item.category ?? ""}::${item.itemName.toLowerCase()}`;
    const existing = merged.get(key);
    if (existing) {
      existing.qty += item.qty;
      existing.total += item.total;
    } else {
      merged.set(key, { ...item });
    }
  }

  const restaurantMatch = text.match(/Restaurant\s*Name:\s*(.+)/i);

  return {
    restaurantName: restaurantMatch?.[1]?.trim() ?? null,
    items: Array.from(merged.values()),
  };
}
