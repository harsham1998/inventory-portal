import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const [{ data: items }, { data: recentOrders }] = await Promise.all([
    supabase.from("inventory_items").select("id, name, unit, current_stock, reorder_level").order("name"),
    supabase
      .from("purchase_orders")
      .select("id, po_number, order_date, status")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const lowStock = (items ?? []).filter((i) => i.current_stock <= i.reorder_level);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Stock health and recent purchase order activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tracked items" value={String((items ?? []).length)} />
        <StatCard label="Low stock" value={String(lowStock.length)} accent={lowStock.length > 0} />
        <StatCard label="Purchase orders" value={String((recentOrders ?? []).length ? "See list" : "0")} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-zinc-700">Low stock</h2>
            <Link href="/inventory" className="text-xs text-blue-600 hover:underline">
              View inventory
            </Link>
          </div>
          <ul className="divide-y divide-zinc-100">
            {lowStock.slice(0, 8).map((item) => (
              <li key={item.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <span className="font-medium text-zinc-900">{item.name}</span>
                <span className="text-red-600">
                  {item.current_stock} {item.unit} (reorder at {item.reorder_level})
                </span>
              </li>
            ))}
            {lowStock.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-zinc-400">Everything is above reorder level.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-zinc-700">Recent purchase orders</h2>
            <Link href="/purchase-orders" className="text-xs text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-zinc-100">
            {(recentOrders ?? []).map((po) => (
              <li key={po.id} className="px-6 py-3 text-sm">
                <Link href={`/purchase-orders/${po.id}`} className="font-medium text-blue-600 hover:underline">
                  {po.po_number}
                </Link>
                <span className="ml-2 text-zinc-500">{po.order_date}</span>
              </li>
            ))}
            {(recentOrders ?? []).length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-zinc-400">No purchase orders yet.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accent ? "text-red-600" : "text-zinc-900"}`}>{value}</p>
    </div>
  );
}
