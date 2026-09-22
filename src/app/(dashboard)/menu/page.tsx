import { createClient } from "@/lib/supabase/server";
import { MenuManager } from "./MenuManager";

export default async function MenuPage() {
  const supabase = await createClient();
  const [{ data: menuItems }, { data: ingredients }, { data: inventoryItems }] = await Promise.all([
    supabase.from("menu_items").select("id, name, category, selling_price").order("category", { nullsFirst: false }).order("name"),
    supabase.from("menu_item_ingredients").select("id, menu_item_id, inventory_item_id, quantity"),
    supabase.from("inventory_items").select("id, name, unit, purchase_cost").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Menu</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Dishes you sell, their price, and the recipe (raw materials from inventory) used to make
          each one — this drives food cost and margin.
        </p>
      </div>

      <MenuManager
        menuItems={menuItems ?? []}
        ingredients={ingredients ?? []}
        inventoryItems={inventoryItems ?? []}
      />
    </div>
  );
}
