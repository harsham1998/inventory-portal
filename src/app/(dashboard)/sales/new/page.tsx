import { createClient } from "@/lib/supabase/server";
import { SalesComposer } from "./SalesComposer";

export default async function NewSalesRecordPage() {
  const supabase = await createClient();
  const [{ data: menuItems }, { data: outlets }] = await Promise.all([
    supabase.from("menu_items").select("id, name, selling_price").order("name"),
    supabase.from("outlets").select("id, name").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Log daily sales</h1>
        <p className="mt-1 text-sm text-zinc-500">
          What sold today. Each dish&apos;s recipe automatically deducts its raw materials from
          inventory.
        </p>
      </div>

      <SalesComposer menuItems={menuItems ?? []} outlets={outlets ?? []} />
    </div>
  );
}
