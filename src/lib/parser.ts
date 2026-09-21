export type InventoryItemLookup = {
  id: number;
  name: string;
  unit: string;
};

export type ParsedLine = {
  raw: string;
  name: string;
  quantity: number | null;
  unit: string;
  matchedItemId: number | null;
  matchedItemName: string | null;
  error: string | null;
};

const LINE_PATTERN = /^(.+?)\s*[-–—]\s*([\d]+(?:\.\d+)?)\s*([a-zA-Z]*)\s*$/;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/'/g, "")
    .replace(/s$/, "");
}

function findBestMatch(name: string, items: InventoryItemLookup[]): InventoryItemLookup | null {
  const target = normalize(name);
  if (!target) return null;

  const exact = items.find((item) => normalize(item.name) === target);
  if (exact) return exact;

  const contains = items
    .filter((item) => {
      const candidate = normalize(item.name);
      return candidate.includes(target) || target.includes(candidate);
    })
    .sort((a, b) => Math.abs(normalize(a.name).length - target.length) - Math.abs(normalize(b.name).length - target.length));

  return contains[0] ?? null;
}

/**
 * Parses free-form pasted lines like "Tandoori kabab - 1.5 kgs" into
 * structured items, fuzzy-matched against known inventory items so the UI
 * can flag anything that needs to be linked or created before a PO is submitted.
 */
export function parsePurchaseOrderText(
  text: string,
  existingItems: InventoryItemLookup[],
): ParsedLine[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((raw) => {
      const match = raw.match(LINE_PATTERN);

      if (!match) {
        return {
          raw,
          name: raw,
          quantity: null,
          unit: "",
          matchedItemId: null,
          matchedItemName: null,
          error: "Couldn't read a quantity from this line. Expected: \"Item name - qty unit\".",
        };
      }

      const [, rawName, rawQuantity, rawUnit] = match;
      const name = rawName.trim();
      const quantity = Number(rawQuantity);
      const match_ = findBestMatch(name, existingItems);
      const unit = rawUnit.trim() || match_?.unit || "pcs";

      return {
        raw,
        name,
        quantity: Number.isFinite(quantity) ? quantity : null,
        unit,
        matchedItemId: match_?.id ?? null,
        matchedItemName: match_?.name ?? null,
        error: Number.isFinite(quantity) && quantity > 0 ? null : "Quantity must be a positive number.",
      };
    });
}
