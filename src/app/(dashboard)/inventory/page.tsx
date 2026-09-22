import { createClient } from "@/lib/supabase/server";
import { InventoryManager } from "./InventoryManager";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, name, unit, category, current_stock, reorder_level, purchase_cost, selling_cost")
    .order("category", { nullsFirst: false })
    .order("name");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Inventory</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Master list of items, stock levels, and minimum stock (reorder level). Items are also
          created automatically the first time they appear on a purchase order.
        </p>
      </div>

      <InventoryManager items={items ?? []} />
    </div>
  );
}
