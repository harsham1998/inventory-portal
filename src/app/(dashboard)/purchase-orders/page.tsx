import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PurchaseOrdersPage() {
  const supabase = await createClient();
  const [{ data: orders }, { data: outlets }, { data: suppliers }] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id, po_number, order_date, status, outlet_id, supplier_id")
      .order("created_at", { ascending: false }),
    supabase.from("outlets").select("id, name"),
    supabase.from("suppliers").select("id, name"),
  ]);

  const outletName = new Map((outlets ?? []).map((o) => [o.id, o.name]));
  const supplierName = new Map((suppliers ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Purchase Orders</h1>
          <p className="mt-1 text-sm text-zinc-500">Every PO request raised to a supplier.</p>
        </div>
        <Link
          href="/purchase-orders/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          + New purchase order
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">PO Number</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Outlet</th>
              <th className="px-6 py-3 font-medium">Supplier</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(orders ?? []).map((po) => (
              <tr key={po.id} className="cursor-pointer hover:bg-zinc-50">
                <td className="px-6 py-3">
                  <Link href={`/purchase-orders/${po.id}`} className="font-medium text-blue-600 hover:underline">
                    {po.po_number}
                  </Link>
                </td>
                <td className="px-6 py-3 text-zinc-500">{po.order_date}</td>
                <td className="px-6 py-3 text-zinc-500">{outletName.get(po.outlet_id) ?? "—"}</td>
                <td className="px-6 py-3 text-zinc-500">{supplierName.get(po.supplier_id) ?? "—"}</td>
                <td className="px-6 py-3">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize text-zinc-600">{po.status}</span>
                </td>
              </tr>
            ))}
            {(orders ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">
                  No purchase orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
