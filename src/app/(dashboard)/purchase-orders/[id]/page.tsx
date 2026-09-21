import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPurchaseOrderDetail } from "@/lib/purchase-orders";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const detail = await getPurchaseOrderDetail(supabase, Number(id));

  if (!detail) notFound();

  const { po, outlet, supplier, items } = detail;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-blue-600">PURCHASE ORDER</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{po.po_number}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {po.order_date} · {outlet.name} → {supplier.name}
          </p>
        </div>
        <a
          href={`/api/purchase-orders/${po.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Download PDF
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-xs font-medium text-zinc-500">Ordered by</p>
          <p className="mt-1 font-semibold text-zinc-900">{outlet.name}</p>
          {outlet.address ? <p className="text-sm text-zinc-500">{outlet.address}</p> : null}
          {outlet.gstin ? <p className="text-sm text-zinc-500">GSTIN: {outlet.gstin}</p> : null}
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-xs font-medium text-zinc-500">Supplier</p>
          <p className="mt-1 font-semibold text-zinc-900">{supplier.name}</p>
          {supplier.address ? <p className="text-sm text-zinc-500">{supplier.address}</p> : null}
          {supplier.gstin ? <p className="text-sm text-zinc-500">GSTIN: {supplier.gstin}</p> : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">#</th>
              <th className="px-6 py-3 font-medium">Item</th>
              <th className="px-6 py-3 font-medium">Qty</th>
              <th className="px-6 py-3 font-medium">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="px-6 py-3 text-zinc-500">{idx + 1}</td>
                <td className="px-6 py-3 font-medium text-zinc-900">{item.item_name}</td>
                <td className="px-6 py-3 text-zinc-500">{item.quantity}</td>
                <td className="px-6 py-3 text-zinc-500">{item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {po.notes ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-xs font-medium text-zinc-500">Notes</p>
          <p className="mt-1 text-sm text-zinc-700">{po.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
