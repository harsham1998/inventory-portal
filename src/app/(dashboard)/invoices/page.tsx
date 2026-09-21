import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const [{ data: invoices }, { data: suppliers }] = await Promise.all([
    supabase
      .from("supplier_invoices")
      .select("id, invoice_number, invoice_date, total_amount, supplier_id, po_id")
      .order("created_at", { ascending: false }),
    supabase.from("suppliers").select("id, name"),
  ]);

  const supplierName = new Map((suppliers ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Supplier Invoices</h1>
          <p className="mt-1 text-sm text-zinc-500">Invoices received from suppliers, optionally linked to a PO.</p>
        </div>
        <Link href="/invoices/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
          + Log invoice
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">Invoice #</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Supplier</th>
              <th className="px-6 py-3 font-medium">Linked PO</th>
              <th className="px-6 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(invoices ?? []).map((inv) => (
              <tr key={inv.id}>
                <td className="px-6 py-3 font-medium text-zinc-900">{inv.invoice_number}</td>
                <td className="px-6 py-3 text-zinc-500">{inv.invoice_date}</td>
                <td className="px-6 py-3 text-zinc-500">{supplierName.get(inv.supplier_id) ?? "—"}</td>
                <td className="px-6 py-3">
                  {inv.po_id ? (
                    <Link href={`/purchase-orders/${inv.po_id}`} className="text-blue-600 hover:underline">
                      View PO
                    </Link>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-6 py-3 text-zinc-500">₹{inv.total_amount}</td>
              </tr>
            ))}
            {(invoices ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">
                  No invoices logged yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
