"use server";

import { createClient } from "@/lib/supabase/server";

export type SaleItemInput = {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type CreateSalesRecordInput = {
  outletId: number;
  saleDate: string;
  items: SaleItemInput[];
};

export async function createSalesRecord(
  input: CreateSalesRecordInput,
): Promise<{ error: string } | { id: number }> {
  if (!input.outletId) {
    return { error: "Pick an outlet." };
  }
  if (input.items.length === 0) {
    return { error: "Add at least one item sold." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("create_sales_record", {
      p_outlet_id: input.outletId,
      p_sale_date: input.saleDate,
      p_source: "manual",
      p_file_path: null,
      p_items: input.items.map((item) => ({
        menu_item_id: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    })
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id as number };
}
