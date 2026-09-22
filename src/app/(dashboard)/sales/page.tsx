import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SalesPage() {
  const supabase = await createClient();
  const [{ data: records }, { data: outlets }] = await Promise.all([
    supabase
      .from("sales_records")
      .select("id, sale_date, outlet_id, source, total_revenue")
      .order("sale_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("outlets").select("id, name"),
  ]);

  const outletName = new Map((outlets ?? []).map((o) => [o.id, o.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Sales</h1>
          <p className="mt-1 text-sm text-zinc-500">Daily sales records — each one deducts recipe ingredients from inventory.</p>
        </div>
        <Link href="/sales/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
          + Log sales
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Outlet</th>
              <th className="px-6 py-3 font-medium">Source</th>
              <th className="px-6 py-3 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(records ?? []).map((r) => (
              <tr key={r.id}>
                <td className="px-6 py-3 font-medium text-zinc-900">{r.sale_date}</td>
                <td className="px-6 py-3 text-zinc-500">{outletName.get(r.outlet_id) ?? "—"}</td>
                <td className="px-6 py-3 text-zinc-500 capitalize">{r.source}</td>
                <td className="px-6 py-3 text-zinc-500">₹{r.total_revenue.toFixed(2)}</td>
              </tr>
            ))}
            {(records ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-400">
                  No sales logged yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
