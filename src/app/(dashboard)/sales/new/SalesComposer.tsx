"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSalesRecord } from "./actions";

type Row = {
  key: string;
  menuItemId: string;
  quantity: string;
  unitPrice: string;
};

function emptyRow(): Row {
  return { key: crypto.randomUUID(), menuItemId: "", quantity: "", unitPrice: "" };
}

export function SalesComposer({
  menuItems,
  outlets,
}: {
  menuItems: { id: number; name: string; selling_price: number | null }[];
  outlets: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"upload" | "manual">("manual");
  const [outletId, setOutletId] = useState(outlets[0] ? String(outlets[0].id) : "");
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const menuById = useMemo(() => new Map(menuItems.map((m) => [m.id, m])), [menuItems]);

  const total = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0), 0);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function handleSubmit() {
    setError(null);
    if (!outletId) {
      setError("Pick an outlet.");
      return;
    }

    const items = rows
      .filter((r) => r.menuItemId)
      .map((r) => ({
        menuItemId: Number(r.menuItemId),
        name: menuById.get(Number(r.menuItemId))?.name ?? "",
        quantity: Number(r.quantity),
        unitPrice: Number(r.unitPrice) || 0,
      }));

    if (items.length === 0 || items.some((i) => !Number.isFinite(i.quantity) || i.quantity <= 0)) {
      setError("Every row needs a dish and a quantity greater than 0.");
      return;
    }

    setSubmitting(true);
    const result = await createSalesRecord({ outletId: Number(outletId), saleDate, items });
    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.push("/sales");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-zinc-200 bg-white p-6 sm:grid-cols-2">
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
          <span className="text-xs font-medium text-zinc-500">Sale date</span>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              mode === "upload" ? "bg-zinc-900 text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Upload sales report
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              mode === "manual" ? "bg-zinc-900 text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Enter manually
          </button>
        </div>
        {mode === "upload" ? (
          <p className="mt-4 text-sm text-zinc-500">
            PDF upload for sales reports isn&apos;t wired up yet — share a sample report and it&apos;ll
            work the same way invoice upload does. Use &quot;Enter manually&quot; for now.
          </p>
        ) : (
          <p className="mt-4 text-xs text-zinc-500">Add each dish sold below.</p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-700">Items sold</h2>
          <button type="button" onClick={() => setRows((prev) => [...prev, emptyRow()])} className="text-xs text-blue-600 hover:underline">
            + Add row
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Dish</th>
              <th className="px-4 py-2 font-medium">Qty</th>
              <th className="px-4 py-2 font-medium">Unit price</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => {
              const amount = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
              return (
                <tr key={row.key}>
                  <td className="px-4 py-2">
                    <select
                      value={row.menuItemId}
                      onChange={(e) => {
                        const menuItem = menuById.get(Number(e.target.value));
                        updateRow(row.key, {
                          menuItemId: e.target.value,
                          unitPrice: row.unitPrice || String(menuItem?.selling_price ?? ""),
                        });
                      }}
                      className="w-44 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    >
                      <option value="">Select dish…</option>
                      {menuItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={row.quantity}
                      onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                      className="w-16 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={row.unitPrice}
                      onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })}
                      className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2 text-zinc-500">₹{amount.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                      className="text-xs text-zinc-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-3 text-sm">
          <span className="text-zinc-500">Total revenue</span>
          <span className="font-semibold text-zinc-900">₹{total.toFixed(2)}</span>
        </div>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="self-start rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save sales record"}
      </button>
    </div>
  );
}
