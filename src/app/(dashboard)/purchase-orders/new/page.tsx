import { createClient } from "@/lib/supabase/server";
import { PurchaseOrderComposer } from "./PurchaseOrderComposer";

export default async function NewPurchaseOrderPage() {
  const supabase = await createClient();
  const [{ data: items }, { data: suppliers }, { data: outlets }] = await Promise.all([
    supabase.from("inventory_items").select("id, name, unit, category, current_stock, reorder_level").order("name"),
    supabase.from("suppliers").select("id, name").order("name"),
    supabase.from("outlets").select("id, name").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">New purchase order</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Paste your item list or predict one from low stock, review the items, then generate the PO
          and its PDF.
        </p>
      </div>

      <PurchaseOrderComposer
        inventoryItems={(items ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          category: item.category,
          currentStock: item.current_stock,
          reorderLevel: item.reorder_level,
        }))}
        suppliers={suppliers ?? []}
        outlets={outlets ?? []}
      />
    </div>
  );
}
