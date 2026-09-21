import { createClient } from "@/lib/supabase/server";
import { addInventoryItem, adjustStock } from "./actions";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, name, unit, category, current_stock, reorder_level")
    .order("name");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Inventory</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Current stock levels. Items are created automatically the first time they appear on a
          purchase order, or you can add one here.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-700">Add item</h2>
        </div>
        <form action={addInventoryItem} className="flex flex-wrap items-end gap-3 px-6 py-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Name</span>
            <input name="name" required className="w-48 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Unit</span>
            <input name="unit" required placeholder="kgs, pcs…" className="w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Category</span>
            <input name="category" className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Reorder level</span>
            <input
              name="reorder_level"
              type="number"
              step="0.01"
              defaultValue={0}
              className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
            Add
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">Item</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Stock</th>
              <th className="px-6 py-3 font-medium">Reorder level</th>
              <th className="px-6 py-3 font-medium">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(items ?? []).map((item) => {
              const low = item.current_stock <= item.reorder_level;
              return (
                <tr key={item.id}>
                  <td className="px-6 py-3 font-medium text-zinc-900">{item.name}</td>
                  <td className="px-6 py-3 text-zinc-500">{item.category ?? "—"}</td>
                  <td className="px-6 py-3">
                    <span className={low ? "font-semibold text-red-600" : "text-zinc-900"}>
                      {item.current_stock} {item.unit}
                    </span>
                    {low ? <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">Low</span> : null}
                  </td>
                  <td className="px-6 py-3 text-zinc-500">
                    {item.reorder_level} {item.unit}
                  </td>
                  <td className="px-6 py-3">
                    <form action={adjustStock} className="flex items-center gap-2">
                      <input type="hidden" name="item_id" value={item.id} />
                      <input
                        name="delta"
                        type="number"
                        step="0.01"
                        placeholder="+/- qty"
                        className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      />
                      <button type="submit" className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100">
                        Apply
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {(items ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">
                  No items yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
