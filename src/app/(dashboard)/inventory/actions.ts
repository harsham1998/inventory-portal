"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | undefined;

export type InventoryItemInput = {
  name: string;
  unit: string;
  category: string;
  reorderLevel: number;
  purchaseCost: number | null;
  sellingCost: number | null;
};

export async function addInventoryItem(input: InventoryItemInput): Promise<ActionResult> {
  const name = input.name.trim();
  const unit = input.unit.trim();

  if (!name || !unit) {
    return { error: "Name and unit are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").insert({
    name,
    unit,
    category: input.category.trim() || null,
    reorder_level: Number.isFinite(input.reorderLevel) ? input.reorderLevel : 0,
    purchase_cost: input.purchaseCost,
    selling_cost: input.sellingCost,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `"${name}" already exists in inventory.` };
    }
    return { error: error.message };
  }

  revalidatePath("/inventory");
}

export async function bulkUpdateInventoryItems(
  updates: { id: number; input: InventoryItemInput }[],
): Promise<{ errors: Record<number, string> } | undefined> {
  const supabase = await createClient();
  const errors: Record<number, string> = {};

  for (const { id, input } of updates) {
    const name = input.name.trim();
    const unit = input.unit.trim();

    if (!name || !unit) {
      errors[id] = "Name and unit are required.";
      continue;
    }

    const { error } = await supabase
      .from("inventory_items")
      .update({
        name,
        unit,
        category: input.category.trim() || null,
        reorder_level: Number.isFinite(input.reorderLevel) ? input.reorderLevel : 0,
        purchase_cost: input.purchaseCost,
        selling_cost: input.sellingCost,
      })
      .eq("id", id);

    if (error) {
      errors[id] = error.code === "23505" ? `"${name}" already exists in inventory.` : error.message;
    }
  }

  revalidatePath("/inventory");

  if (Object.keys(errors).length > 0) {
    return { errors };
  }
}

export async function deleteInventoryItem(itemId: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").delete().eq("id", itemId);

  if (error) {
    if (error.code === "23503") {
      return {
        error: "Can't delete — this item is used in a purchase order, invoice, or stock adjustment.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/inventory");
}

export async function adjustStock(itemId: number, delta: number): Promise<ActionResult> {
  if (!itemId || !Number.isFinite(delta) || delta === 0) {
    return { error: "Enter a non-zero quantity." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("stock_movements").insert({
    item_id: itemId,
    quantity_delta: delta,
    reason: "manual_adjust",
    created_by: user?.id ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inventory");
}
