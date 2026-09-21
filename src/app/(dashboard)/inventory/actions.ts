"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addInventoryItem(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const reorderLevel = Number(formData.get("reorder_level") ?? 0);

  if (!name || !unit) {
    throw new Error("Name and unit are required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").insert({
    name,
    unit,
    category: category || null,
    reorder_level: Number.isFinite(reorderLevel) ? reorderLevel : 0,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/inventory");
}

export async function adjustStock(formData: FormData): Promise<void> {
  const itemId = Number(formData.get("item_id"));
  const delta = Number(formData.get("delta"));

  if (!itemId || !Number.isFinite(delta) || delta === 0) {
    throw new Error("Enter a non-zero quantity.");
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
    throw new Error(error.message);
  }

  revalidatePath("/inventory");
}
