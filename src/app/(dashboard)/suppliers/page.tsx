import { createClient } from "@/lib/supabase/server";
import { addSupplier } from "./actions";

export default async function SuppliersPage() {
  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, gstin, phone, email")
    .order("name");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Suppliers</h1>
        <p className="mt-1 text-sm text-zinc-500">Vendors you raise purchase orders against.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-700">Add supplier</h2>
        </div>
        <form action={addSupplier} className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name" name="name" required />
          <Field label="GSTIN" name="gstin" />
          <Field label="Phone" name="phone" />
          <Field label="Email" name="email" type="email" />
          <Field label="Address" name="address" className="sm:col-span-2 lg:col-span-3" />
          <Field label="Bank name" name="bank_name" />
          <Field label="Account holder" name="bank_account_holder" />
          <Field label="Account number" name="bank_account_number" />
          <Field label="IFSC" name="bank_ifsc" />
          <Field label="Branch" name="bank_branch" />
          <div className="flex items-end">
            <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
              Add supplier
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">GSTIN</th>
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(suppliers ?? []).map((s) => (
              <tr key={s.id}>
                <td className="px-6 py-3 font-medium text-zinc-900">{s.name}</td>
                <td className="px-6 py-3 text-zinc-500">{s.gstin ?? "—"}</td>
                <td className="px-6 py-3 text-zinc-500">{s.phone ?? "—"}</td>
                <td className="px-6 py-3 text-zinc-500">{s.email ?? "—"}</td>
              </tr>
            ))}
            {(suppliers ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-400">
                  No suppliers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className ?? ""}`}>
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
    </label>
  );
}
