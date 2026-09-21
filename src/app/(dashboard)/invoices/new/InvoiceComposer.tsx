"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createSupplierInvoice } from "./actions";

type Row = {
  key: string;
  itemName: string;
  rate: string;
  qty: string;
  unit: string;
  taxableValue: string;
  taxAmount: string;
  amount: string;
};

function emptyRow(): Row {
  return {
    key: crypto.randomUUID(),
    itemName: "",
    rate: "",
    qty: "",
    unit: "",
    taxableValue: "",
    taxAmount: "0",
    amount: "",
  };
}

export function InvoiceComposer({
  suppliers,
  outlets,
  purchaseOrders,
}: {
  suppliers: { id: number; name: string }[];
  outlets: { id: number; name: string }[];
  purchaseOrders: { id: number; po_number: string; supplier_id: number }[];
}) {
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierId, setSupplierId] = useState(suppliers[0] ? String(suppliers[0].id) : "");
  const [outletId, setOutletId] = useState(outlets[0] ? String(outlets[0].id) : "");
  const [poId, setPoId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [roundOff, setRoundOff] = useState("0");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const relevantPos = useMemo(
    () => purchaseOrders.filter((po) => !supplierId || po.supplier_id === Number(supplierId)),
    [purchaseOrders, supplierId],
  );

  const totals = useMemo(() => {
    const subtotal = rows.reduce((sum, r) => sum + (Number(r.taxableValue) || Number(r.amount) || 0), 0);
    const tax = rows.reduce((sum, r) => sum + (Number(r.taxAmount) || 0), 0);
    const itemsTotal = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const total = itemsTotal + (Number(roundOff) || 0);
    return { subtotal, tax, total };
  }, [rows, roundOff]);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function handleSubmit() {
    setError(null);

    const items = rows
      .filter((r) => r.itemName.trim())
      .map((r) => ({
        itemName: r.itemName.trim(),
        rate: r.rate ? Number(r.rate) : null,
        qty: Number(r.qty),
        unit: r.unit.trim(),
        taxableValue: r.taxableValue ? Number(r.taxableValue) : null,
        taxAmount: Number(r.taxAmount) || 0,
        amount: Number(r.amount),
      }));

    if (!invoiceNumber || !supplierId || !outletId) {
      setError("Invoice number, supplier and outlet are required.");
      return;
    }
    if (items.length === 0 || items.some((i) => !Number.isFinite(i.qty) || !Number.isFinite(i.amount))) {
      setError("Every item needs a quantity and an amount.");
      return;
    }

    setSubmitting(true);

    let filePath: string | null = null;
    if (file) {
      const supabase = createClient();
      const path = `${supplierId}/${invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, "_")}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("supplier-invoices").upload(path, file);
      if (uploadError) {
        setSubmitting(false);
        setError(`File upload failed: ${uploadError.message}`);
        return;
      }
      filePath = path;
    }

    const result = await createSupplierInvoice({
      invoiceNumber,
      supplierId: Number(supplierId),
      outletId: Number(outletId),
      poId: poId ? Number(poId) : null,
      invoiceDate,
      dueDate: dueDate || null,
      subtotal: totals.subtotal,
      taxAmount: totals.tax,
      roundOff: Number(roundOff) || 0,
      totalAmount: totals.total,
      filePath,
      items,
    });

    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.push("/invoices");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-zinc-200 bg-white p-6 sm:grid-cols-3">
        <TextField label="Invoice number" value={invoiceNumber} onChange={setInvoiceNumber} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-zinc-500">Supplier</span>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="">Select supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-zinc-500">Outlet</span>
          <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="">Select outlet…</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-zinc-500">Linked PO (optional)</span>
          <select value={poId} onChange={(e) => setPoId(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="">None</option>
            {relevantPos.map((po) => (
              <option key={po.id} value={po.id}>
                {po.po_number}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-zinc-500">Invoice date</span>
          <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-zinc-500">Due date</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-3">
          <span className="text-xs font-medium text-zinc-500">Upload invoice file (optional)</span>
          <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-700">Line items</h2>
          <button type="button" onClick={() => setRows((prev) => [...prev, emptyRow()])} className="text-xs text-blue-600 hover:underline">
            + Add row
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 font-medium">Rate</th>
              <th className="px-4 py-2 font-medium">Qty</th>
              <th className="px-4 py-2 font-medium">Unit</th>
              <th className="px-4 py-2 font-medium">Taxable value</th>
              <th className="px-4 py-2 font-medium">Tax</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-4 py-2">
                  <input value={row.itemName} onChange={(e) => updateRow(row.key, { itemName: e.target.value })} className="w-36 rounded-lg border border-zinc-300 px-2 py-1 text-sm" />
                </td>
                <td className="px-4 py-2">
                  <input value={row.rate} onChange={(e) => updateRow(row.key, { rate: e.target.value })} className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm" />
                </td>
                <td className="px-4 py-2">
                  <input value={row.qty} onChange={(e) => updateRow(row.key, { qty: e.target.value })} className="w-16 rounded-lg border border-zinc-300 px-2 py-1 text-sm" />
                </td>
                <td className="px-4 py-2">
                  <input value={row.unit} onChange={(e) => updateRow(row.key, { unit: e.target.value })} className="w-16 rounded-lg border border-zinc-300 px-2 py-1 text-sm" />
                </td>
                <td className="px-4 py-2">
                  <input value={row.taxableValue} onChange={(e) => updateRow(row.key, { taxableValue: e.target.value })} className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm" />
                </td>
                <td className="px-4 py-2">
                  <input value={row.taxAmount} onChange={(e) => updateRow(row.key, { taxAmount: e.target.value })} className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm" />
                </td>
                <td className="px-4 py-2">
                  <input value={row.amount} onChange={(e) => updateRow(row.key, { amount: e.target.value })} className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm" />
                </td>
                <td className="px-4 py-2">
                  <button type="button" onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))} className="text-xs text-zinc-400 hover:text-red-600">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col gap-2 border-t border-zinc-100 px-6 py-4 text-sm">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal</span>
            <span>{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Tax</span>
            <span>{totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-500">
            <span>Round off</span>
            <input value={roundOff} onChange={(e) => setRoundOff(e.target.value)} className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-right text-sm" />
          </div>
          <div className="flex justify-between border-t border-zinc-100 pt-2 font-semibold text-zinc-900">
            <span>Total</span>
            <span>{totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="self-start rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save invoice"}
      </button>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
    </label>
  );
}
