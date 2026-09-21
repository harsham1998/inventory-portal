import { createClient } from "@/lib/supabase/server";
import { addOutlet } from "./actions";

export default async function OutletsPage() {
  const supabase = await createClient();
  const { data: outlets } = await supabase
    .from("outlets")
    .select("id, name, gstin, phone, address")
    .order("name");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Outlets</h1>
        <p className="mt-1 text-sm text-zinc-500">Your locations that raise purchase orders.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-700">Add outlet</h2>
        </div>
        <form action={addOutlet} className="flex flex-wrap items-end gap-3 px-6 py-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Name</span>
            <input name="name" required className="w-48 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">GSTIN</span>
            <input name="gstin" className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Phone</span>
            <input name="phone" className="w-36 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Address</span>
            <input name="address" className="w-64 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
            Add
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">GSTIN</th>
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(outlets ?? []).map((o) => (
              <tr key={o.id}>
                <td className="px-6 py-3 font-medium text-zinc-900">{o.name}</td>
                <td className="px-6 py-3 text-zinc-500">{o.gstin ?? "—"}</td>
                <td className="px-6 py-3 text-zinc-500">{o.phone ?? "—"}</td>
                <td className="px-6 py-3 text-zinc-500">{o.address ?? "—"}</td>
              </tr>
            ))}
            {(outlets ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-400">
                  No outlets yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
