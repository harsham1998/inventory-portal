import { describe, expect, it } from "vitest";
import { itemsFromTable, parseItemsFromText } from "@/lib/sales-report-pdf";

// Mirrors real getTable() output for the actual Star BBQ'ue Petpooja export
// (both pages) — one array of cells per table row, in column order.
const TABLE_ROWS = [
  ["Category", "Item", "Code", "Sap Code", "Qty.", "Total ₹"],
  ["Total", "", "", "", "157", "23800"],
  ["Min.", "", "", "", "1", "20"],
  ["Max.", "", "", "", "42", "4950"],
  ["Avg.", "", "", "", "6.28", "952"],
  ["Grill Chicken", "Grill Chicken Half", "Half", "", "14.00", "4620.00"],
  ["Grill Chicken", "Grill Chicken Full", "Ful", "", "9.00", "4950.00"],
  ["Beverages", "Masala Thumpsup", "4", "", "3.00", "240.00"],
  ["Beverages", "Masala Sprite", "5", "", "1.00", "80.00"],
  ["Beverages", "Thumps Up", "Thumps up", "", "1.00", "20.00"],
  ["Beverages", "Thumbs-up Glass", "Thumbs up", "", "7.00", "175.00"],
  ["Beverages", "Water Bottle", "water", "", "9.00", "180.00"],
  ["Beverages", "Coke Bottle", "Coca cola", "", "2.00", "40.00"],
  ["Beverages", "Diet Coke", "Diet coke", "", "16.00", "800.00"],
  ["Kebabs", "Tandoori Tikka", "6", "", "3.00", "735.00"],
  ["Kebabs", "Hariyali Tikka", "7", "", "1.00", "245.00"],
  ["Kebabs", "Lemon Tikka", "8", "", "1.00", "265.00"],
  ["Kebabs", "Garlic Tikka", "9", "", "3.00", "795.00"],
  ["Kebabs", "Malai Kebab", "10", "", "2.00", "580.00"],
  ["Kebabs", "Tangdi Kebab", "11", "", "1.00", "200.00"],
  ["Kebabs", "Tandoori Wings", "12", "", "2.00", "440.00"],
  ["Kebabs", "Paneer Tikka", "13", "", "2.00", "510.00"],
  ["Shawarma", "Chicken Shawarma", "14", "", "9.00", "1800.00"],
  ["Shawarma", "Big Shawarma", "15", "", "9.00", "2385.00"],
  ["Kebab Shawarma", "Tandoori Tikka Shawarma", "16", "", "4.00", "980.00"],
  ["Kebab Shawarma", "Hariyali Tikka Shawarma", "17", "", "3.00", "735.00"],
  ["Kebab Shawarma", "Malai Shawarma", "20", "", "3.00", "870.00"],
  ["Kebab Shawarma", "Puri Shawarma", "22", "", "3.00", "405.00"],
  ["Add-ONS", "Mayonnaise", "Mayo", "", "7.00", "280.00"],
  // page 2 repeats the summary rows, then the one item that spilled over
  ["Total", "", "", "", "157", "23800"],
  ["Min.", "", "", "", "1", "20"],
  ["Max.", "", "", "", "42", "4950"],
  ["Avg.", "", "", "", "6.28", "952"],
  ["Add-ONS", "Roti", "Roti", "", "42.00", "1470.00"],
];

describe("itemsFromTable", () => {
  it("extracts every real item row and skips header/summary rows", () => {
    const items = itemsFromTable(TABLE_ROWS);
    expect(items).toHaveLength(25);
    expect(items[0]).toEqual({ category: "Grill Chicken", itemName: "Grill Chicken Half", qty: 14, total: 4620 });
    expect(items.find((i) => i.itemName === "Thumps Up")).toEqual({
      category: "Beverages",
      itemName: "Thumps Up",
      qty: 1,
      total: 20,
    });
    expect(items.find((i) => i.itemName === "Roti")).toEqual({
      category: "Add-ONS",
      itemName: "Roti",
      qty: 42,
      total: 1470,
    });

    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    const totalRevenue = items.reduce((sum, i) => sum + i.total, 0);
    expect(totalQty).toBe(157);
    expect(totalRevenue).toBe(23800);
  });

  it("never emits the summary rows themselves as items", () => {
    const items = itemsFromTable(TABLE_ROWS);
    expect(items.some((i) => ["Total", "Min.", "Max.", "Avg."].includes(i.itemName))).toBe(false);
  });
});

describe("parseItemsFromText (fallback path)", () => {
  it("extracts item rows from linearized text when no table is detected", () => {
    const text = [
      "Restaurant Name: STAR BBQ'ue-MADHAPUR",
      "Category Item Code Sap Code Qty. Total ₹",
      "Total 157 23800",
      "Grill Chicken Grill Chicken Half Half 14.00 4620.00",
      "Kebabs Tandoori Tikka 6 3.00 735.00",
      "Add-ONS Roti Roti 42.00 1470.00",
    ].join("\n");

    const items = parseItemsFromText(text);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ qty: 14, total: 4620 });
    expect(items[0].itemName).toContain("Grill Chicken Half");
    expect(items[2]).toMatchObject({ itemName: "Add-ONS Roti Roti", qty: 42, total: 1470 });
  });
});
