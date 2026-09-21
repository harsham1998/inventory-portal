import { describe, expect, it } from "vitest";
import { parsePurchaseOrderText, type InventoryItemLookup } from "@/lib/parser";

const inventory: InventoryItemLookup[] = [
  { id: 1, name: "Tandoori Kabab", unit: "kgs" },
  { id: 2, name: "Garlic Tikka", unit: "kgs" },
  { id: 3, name: "Rotis", unit: "pcs" },
  { id: 4, name: "Grill Chicken", unit: "pcs" },
];

describe("parsePurchaseOrderText", () => {
  it("parses the user's real paste example", () => {
    const text = [
      "Tandoori kabab - 1.5 kgs",
      "Garlic - 1.5 kgs",
      "Chest shawarma - 3 kgs",
      "Grill chicken - 20",
      "Rotis - 80",
    ].join("\n");

    const result = parsePurchaseOrderText(text, inventory);

    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({ name: "Tandoori kabab", quantity: 1.5, unit: "kgs", matchedItemId: 1 });
    expect(result[3]).toMatchObject({ name: "Grill chicken", quantity: 20, unit: "pcs", matchedItemId: 4 });
    expect(result[4]).toMatchObject({ name: "Rotis", quantity: 80, unit: "pcs", matchedItemId: 3 });
  });

  it("defaults to pcs when no unit is given and there is no matched item", () => {
    const [line] = parsePurchaseOrderText("Mystery sauce - 4", inventory);
    expect(line.unit).toBe("pcs");
    expect(line.matchedItemId).toBeNull();
  });

  it("flags lines it can't parse", () => {
    const [line] = parsePurchaseOrderText("just some notes with no dash or qty", inventory);
    expect(line.error).toBeTruthy();
    expect(line.quantity).toBeNull();
  });

  it("flags a zero or negative quantity as an error", () => {
    const [line] = parsePurchaseOrderText("Paneer - 0 kgs", inventory);
    expect(line.error).toBeTruthy();
  });

  it("ignores blank lines", () => {
    const result = parsePurchaseOrderText("Rotis - 80\n\n\nGarlic - 1.5 kgs\n", inventory);
    expect(result).toHaveLength(2);
  });

  it("matches case-insensitively and past simple plurals", () => {
    const [line] = parsePurchaseOrderText("roti - 10 pcs", inventory);
    expect(line.matchedItemId).toBe(3);
  });
});
