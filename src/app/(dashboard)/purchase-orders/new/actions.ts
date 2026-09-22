"use server";

import { createClient } from "@/lib/supabase/server";

export type ComposerItem = {
  itemId: number | null;
  name: string;
  unit: string;
  quantity: number;
  unitCost: number | null;
};

export type CreatePurchaseOrderInput = {
  outletId: number;
  supplierId: number;
  orderDate: string;
  notes: string;
  items: ComposerItem[];
};

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
): Promise<{ error: string } | { id: number; poNumber: string }> {
  if (!input.outletId || !input.supplierId) {
    return { error: "Pick an outlet and a supplier." };
  }
  if (input.items.length === 0) {
    return { error: "Add at least one item." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("create_purchase_order", {
      p_outlet_id: input.outletId,
      p_supplier_id: input.supplierId,
      p_order_date: input.orderDate,
      p_notes: input.notes || null,
      p_items: input.items.map((item) => ({
        item_id: item.itemId,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unit_cost: item.unitCost,
      })),
    })
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id as number, poNumber: data.po_number as string };
}
