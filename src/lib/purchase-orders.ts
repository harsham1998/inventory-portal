import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function getPurchaseOrderDetail(
  supabase: SupabaseClient<Database>,
  id: number,
) {
  // Items only depend on `id`, which we already have — fetch them alongside
  // the PO row itself instead of waiting for it, then fan out to
  // outlet/supplier (which do depend on the PO row's foreign keys).
  const [{ data: po }, { data: items }] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id, po_number, order_date, status, notes, outlet_id, supplier_id")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("purchase_order_items").select("item_name, quantity, unit").eq("po_id", id).order("id"),
  ]);

  if (!po) return null;

  const [{ data: outlet }, { data: supplier }] = await Promise.all([
    supabase.from("outlets").select("name, address, gstin, phone, email").eq("id", po.outlet_id).maybeSingle(),
    supabase.from("suppliers").select("name, address, gstin, phone, email").eq("id", po.supplier_id).maybeSingle(),
  ]);

  if (!outlet || !supplier) return null;

  return { po, outlet, supplier, items: items ?? [] };
}
