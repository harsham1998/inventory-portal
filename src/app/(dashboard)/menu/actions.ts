"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | undefined;

export type MenuItemInput = {
  name: string;
  category: string;
  sellingPrice: number | null;
};

export async function addMenuItem(input: MenuItemInput): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").insert({
    name,
    category: input.category.trim() || null,
    selling_price: input.sellingPrice,
  });

  if (error) {
    if (error.code === "23505") return { error: `"${name}" already exists on the menu.` };
    return { error: error.message };
  }

  revalidatePath("/menu");
}

export async function bulkUpdateMenuItems(
  updates: { id: number; input: MenuItemInput }[],
): Promise<{ errors: Record<number, string> } | undefined> {
  const supabase = await createClient();
  const errors: Record<number, string> = {};

  for (const { id, input } of updates) {
    const name = input.name.trim();
    if (!name) {
      errors[id] = "Name is required.";
      continue;
    }
    const { error } = await supabase
      .from("menu_items")
      .update({ name, category: input.category.trim() || null, selling_price: input.sellingPrice })
      .eq("id", id);

    if (error) {
      errors[id] = error.code === "23505" ? `"${name}" already exists on the menu.` : error.message;
    }
  }

  revalidatePath("/menu");
  if (Object.keys(errors).length > 0) return { errors };
}

export async function deleteMenuItem(id: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { error: "Can't delete — this dish has recorded sales. Remove those first." };
    }
    return { error: error.message };
  }

  revalidatePath("/menu");
}

export async function addIngredient(
  menuItemId: number,
  inventoryItemId: number,
  quantity: number,
): Promise<ActionResult> {
  if (!inventoryItemId || !Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Pick an ingredient and a quantity greater than 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_item_ingredients")
    .insert({ menu_item_id: menuItemId, inventory_item_id: inventoryItemId, quantity });

  if (error) {
    if (error.code === "23505") return { error: "That ingredient is already in the recipe — edit its quantity instead." };
    return { error: error.message };
  }

  revalidatePath("/menu");
}

export async function updateIngredientQuantity(id: number, quantity: number): Promise<ActionResult> {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Quantity must be greater than 0." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("menu_item_ingredients").update({ quantity }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/menu");
}

export async function removeIngredient(id: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_item_ingredients").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/menu");
}
