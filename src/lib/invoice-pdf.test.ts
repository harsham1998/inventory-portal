import { describe, expect, it } from "vitest";
import { parseInvoiceHeader, parseItemsFromText, toIsoDate } from "@/lib/invoice-pdf";

// Mirrors the linearized text layout of a real Swipe-generated invoice
// (INV-24, Star BBQ'ue Madhapur) used to validate the regex-based parser.
const INVOICE_TEXT = `TAX INVOICE
SBBQUE FOODS LLP
GSTIN 36AFXFS4937G1Z8
Invoice #: INV-24
Invoice Date: 21 Sep 2026
Due Date: 21 Sep 2026
Customer Details:
Star BBQ'ue Madhapur
# Item Rate / Item Qty Taxable Value Tax Amount Amount
1 Roti 15.00 80 PCS 1,200.00 0.00 (0%) 1,200.00
2 Grill Birds 220.00 20.2 KGS 4,444.00 0.00 (0%) 4,444.00
3 Tandoori Tikka 416.80 1.5 KGS 625.20 0.00 (0%) 625.20
4 Garlic Tikka 421.80 1.5 KGS 632.70 0.00 (0%) 632.70
5 Hariyali Tikka 412.80 0.5 KGS 206.40 0.00 (0%) 206.40
6 Malai Tikka 650.80 0.5 KGS 325.40 0.00 (0%) 325.40
7 Shawarma 377.60 3 KGS 1,132.80 0.00 (0%) 1,132.80
8 Tangdi Kebab 306.80 0.5 KGS 153.40 0.00 (0%) 153.40
9 Tandoori Wings 289.00 1 KGS 289.00 0.00 (0%) 289.00
10 Sprinkling Masala 320.65 3.5 KGS 1,122.28 0.00 (0%) 1,122.27
Taxable Amount ₹10,131.17
Round Off -0.17
Total ₹10,131.00
Amount Payable: ₹10,131.00`;

describe("parseItemsFromText", () => {
  it("extracts all line items from a real invoice layout", () => {
    const items = parseItemsFromText(INVOICE_TEXT);
    expect(items).toHaveLength(10);
    expect(items[0]).toEqual({
      itemName: "Roti",
      rate: 15,
      qty: 80,
      unit: "PCS",
      taxableValue: 1200,
      taxAmount: 0,
      amount: 1200,
    });
    expect(items[1]).toMatchObject({ itemName: "Grill Birds", qty: 20.2, unit: "KGS", amount: 4444 });
    expect(items[9]).toMatchObject({ itemName: "Sprinkling Masala", qty: 3.5, amount: 1122.27 });
  });

  it("ignores non-item lines", () => {
    const items = parseItemsFromText("TAX INVOICE\nSBBQUE FOODS LLP\nCustomer Details:");
    expect(items).toHaveLength(0);
  });
});

describe("parseInvoiceHeader", () => {
  it("extracts invoice number, dates, and totals", () => {
    const header = parseInvoiceHeader(INVOICE_TEXT);
    expect(header.invoiceNumber).toBe("INV-24");
    expect(header.invoiceDate).toBe("2026-09-21");
    expect(header.dueDate).toBe("2026-09-21");
    expect(header.subtotal).toBe(10131.17);
    expect(header.roundOff).toBe(-0.17);
    expect(header.totalAmount).toBe(10131.0);
  });
});

describe("toIsoDate", () => {
  it("parses '21 Sep 2026' style dates", () => {
    expect(toIsoDate("21 Sep 2026")).toBe("2026-09-21");
  });

  it("returns null for unparseable text", () => {
    expect(toIsoDate("not a date")).toBeNull();
  });
});
