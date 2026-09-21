import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function getPurchaseOrderDetail(
  supabase: SupabaseClient<Database>,
  id: number,
) {
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("id, po_number, order_date, status, notes, outlet_id, supplier_id")
    .eq("id", id)
    .maybeSingle();

  if (!po) return null;

  const [{ data: outlet }, { data: supplier }, { data: items }] = await Promise.all([
    supabase.from("outlets").select("name, address, gstin, phone, email").eq("id", po.outlet_id).maybeSingle(),
    supabase.from("suppliers").select("name, address, gstin, phone, email").eq("id", po.supplier_id).maybeSingle(),
    supabase.from("purchase_order_items").select("item_name, quantity, unit").eq("po_id", po.id).order("id"),
  ]);

  if (!outlet || !supplier) return null;

  return { po, outlet, supplier, items: items ?? [] };
}
