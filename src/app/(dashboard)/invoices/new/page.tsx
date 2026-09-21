import { createClient } from "@/lib/supabase/server";
import { InvoiceComposer } from "./InvoiceComposer";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const [{ data: suppliers }, { data: outlets }, { data: purchaseOrders }] = await Promise.all([
    supabase.from("suppliers").select("id, name").order("name"),
    supabase.from("outlets").select("id, name").order("name"),
    supabase.from("purchase_orders").select("id, po_number, supplier_id").order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Log supplier invoice</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Record an invoice you received from a supplier, optionally linked to a purchase order.
        </p>
      </div>

      <InvoiceComposer
        suppliers={suppliers ?? []}
        outlets={outlets ?? []}
        purchaseOrders={purchaseOrders ?? []}
      />
    </div>
  );
}
