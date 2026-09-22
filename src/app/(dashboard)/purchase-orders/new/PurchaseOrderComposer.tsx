"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parsePurchaseOrderText, type InventoryItemLookup } from "@/lib/parser";
import { createPurchaseOrder } from "./actions";

type Row = {
  key: string;
  name: string;
  quantity: string;
  unit: string;
  itemId: number | null;
  unitCost: string;
};

type PredictableItem = InventoryItemLookup & {
  category: string | null;
  currentStock: number;
  reorderLevel: number;
  purchaseCost: number | null;
};

const EXAMPLE = `Tandoori kabab - 1.5 kgs
Garlic - 1.5 kgs
Haryali - 0.5 kgs
Grill chicken - 20
Rotis - 80`;

export function PurchaseOrderComposer({
  inventoryItems,
  suppliers,
  outlets,
}: {
  inventoryItems: PredictableItem[];
  suppliers: { id: number; name: string }[];
  outlets: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [outletId, setOutletId] = useState<string>(
    outlets[0] ? String(outlets[0].id) : "",
  );
  const [supplierId, setSupplierId] = useState<string>(
    suppliers[0] ? String(suppliers[0].id) : "",
  );
  const [orderDate, setOrderDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictNotice, setPredictNotice] = useState<string | null>(null);
  const [predictCategory, setPredictCategory] = useState<string>("");

  const itemsById = useMemo(
    () => new Map(inventoryItems.map((i) => [i.id, i])),
    [inventoryItems],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          inventoryItems
            .map((i) => i.category)
            .filter((c): c is string => Boolean(c)),
        ),
      ).sort(),
    [inventoryItems],
  );

  function costFor(itemId: number | null): string {
    if (itemId === null) return "";
    const cost = itemsById.get(itemId)?.purchaseCost;
    return cost === null || cost === undefined ? "" : String(cost);
  }

  const lowStockItems = useMemo(
    () =>
      inventoryItems.filter(
        (i) =>
          i.currentStock <= i.reorderLevel &&
          i.reorderLevel > 0 &&
          (!predictCategory || i.category === predictCategory),
      ),
    [inventoryItems, predictCategory],
  );

  function handleParse() {
    const parsed = parsePurchaseOrderText(rawText, inventoryItems);
    setRows(
      parsed.map((line, idx) => ({
        key: `${idx}-${line.name}`,
        name: line.name,
        quantity: line.quantity !== null ? String(line.quantity) : "",
        unit: line.unit,
        itemId: line.matchedItemId,
        unitCost: costFor(line.matchedItemId),
      })),
    );
    setError(null);
    setPredictNotice(null);
  }

  function handlePredict() {
    setError(null);
    // At-the-floor items (current stock exactly equals min stock) still
    // count as "low", but ordering a quantity of 0 isn't useful on a PO —
    // only include rows that actually need restocking.
    const toOrder = lowStockItems.filter(
      (item) => item.reorderLevel - item.currentStock > 0,
    );
    if (toOrder.length === 0) {
      setPredictNotice(
        predictCategory
          ? `Nothing in "${predictCategory}" needs restocking right now.`
          : "Nothing needs restocking right now — set min-stock levels on the Inventory page if items aren't showing up here.",
      );
      setRows(null);
      return;
    }
    setPredictNotice(null);
    setRows(
      toOrder.map((item, idx) => ({
        key: `predict-${idx}-${item.id}`,
        name: item.name,
        quantity: String(
          Math.round((item.reorderLevel - item.currentStock) * 100) / 100,
        ),
        unit: item.unit,
        itemId: item.id,
        unitCost: item.purchaseCost === null ? "" : String(item.purchaseCost),
      })),
    );
  }

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev ? prev.map((r) => (r.key === key ? { ...r, ...patch } : r)) : prev,
    );
  }

  function removeRow(key: string) {
    setRows((prev) => (prev ? prev.filter((r) => r.key !== key) : prev));
  }

  async function handleSubmit() {
    if (!rows || rows.length === 0) {
      setError("Paste and parse your item list first.");
      return;
    }
    if (!outletId || !supplierId) {
      setError("Pick an outlet and a supplier.");
      return;
    }

    const items = rows.map((r) => ({
      itemId: r.itemId,
      name: r.name.trim(),
      unit: r.unit.trim() || "pcs",
      quantity: Number(r.quantity),
      unitCost: r.unitCost.trim() ? Number(r.unitCost) : null,
    }));

    const invalid = items.find(
      (i) => !i.name || !Number.isFinite(i.quantity) || i.quantity <= 0,
    );
    if (invalid) {
      setError(
        `"${invalid.name || "(blank)"}" needs a valid name and a quantity greater than 0.`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await createPurchaseOrder({
      outletId: Number(outletId),
      supplierId: Number(supplierId),
      orderDate,
      notes,
      items,
    });
    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.push(`/purchase-orders/${result.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-zinc-200 bg-white p-6 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-zinc-500">Outlet</span>
          <select
            value={outletId}
            onChange={(e) => setOutletId(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Select outlet…</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-zinc-500">Supplier</span>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Select supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-zinc-500">Order date</span>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">
            Predict from low stock
          </h2>
          <span className="text-xs text-zinc-400">
            {lowStockItems.length} item(s) at or below min stock
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Fills the review table below with every item at or below its minimum
          stock, ordering enough to bring it back up to that level.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs font-medium text-zinc-500">Category</span>
            <select
              value={predictCategory}
              onChange={(e) => setPredictCategory(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handlePredict}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Predict purchase order
          </button>
        </div>
        {predictNotice ? (
          <p className="mt-3 text-sm text-zinc-500">{predictNotice}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">
            Or paste your item list
          </h2>
          <button
            type="button"
            onClick={() => setRawText(EXAMPLE)}
            className="text-xs text-blue-600 hover:underline"
          >
            Fill example
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          One item per line: “Item name - quantity unit”, e.g. “Tandoori kabab -
          1.5 kgs”.
        </p>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={8}
          placeholder={EXAMPLE}
          className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm"
        />
        <button
          type="button"
          onClick={handleParse}
          className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Parse items
        </button>
      </div>

      {rows ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-700">
                Review before creating the PO
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Items not found in inventory are set to “create new” — pick an
                existing item instead if it&apos;s a match.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setRows((prev) => [
                  ...(prev ?? []),
                  {
                    key: `manual-${crypto.randomUUID()}`,
                    name: "",
                    quantity: "",
                    unit: "",
                    itemId: null,
                    unitCost: "",
                  },
                ])
              }
              className="shrink-0 text-xs text-blue-600 hover:underline"
            >
              + Add item
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Item</th>
                <th className="px-6 py-3 font-medium">Match</th>
                <th className="px-6 py-3 font-medium">Qty</th>
                <th className="px-6 py-3 font-medium">Unit</th>
                <th className="px-6 py-3 font-medium">Est. cost/unit</th>
                <th className="px-6 py-3 font-medium">Est. total</th>
                <th className="px-6 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row) => {
                const lineTotal =
                  (Number(row.quantity) || 0) * (Number(row.unitCost) || 0);
                return (
                  <tr key={row.key}>
                    <td className="px-6 py-2">
                      <input
                        value={row.name}
                        onChange={(e) =>
                          updateRow(row.key, { name: e.target.value })
                        }
                        className="w-40 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <select
                        value={row.itemId ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) {
                            updateRow(row.key, { itemId: null });
                            return;
                          }
                          const matched = itemsById.get(Number(value));
                          updateRow(row.key, {
                            itemId: Number(value),
                            unit: matched?.unit ?? row.unit,
                            unitCost: costFor(Number(value)),
                          });
                        }}
                        className={`rounded-lg border px-2 py-1 text-sm ${
                          row.itemId
                            ? "border-zinc-300"
                            : "border-amber-400 bg-amber-50"
                        }`}
                      >
                        <option value="">+ Create new item</option>
                        {inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-2">
                      <input
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(row.key, { quantity: e.target.value })
                        }
                        className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        value={row.unit}
                        onChange={(e) =>
                          updateRow(row.key, { unit: e.target.value })
                        }
                        className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        value={row.unitCost}
                        onChange={(e) =>
                          updateRow(row.key, { unitCost: e.target.value })
                        }
                        placeholder="₹"
                        className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-2 text-zinc-500">
                      {lineTotal > 0 ? `₹${lineTotal.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-6 py-2">
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        className="text-xs text-zinc-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-zinc-400"
                  >
                    No items parsed yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-3 text-sm">
            <span className="text-zinc-500">Estimated PO total</span>
            <span className="font-semibold text-zinc-900">
              ₹
              {rows
                .reduce(
                  (sum, r) =>
                    sum + (Number(r.quantity) || 0) * (Number(r.unitCost) || 0),
                  0,
                )
                .toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-100 px-6 py-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-zinc-500">
                Notes (optional)
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>

            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="self-start rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting
                ? "Creating…"
                : "Create purchase order & generate PDF"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
