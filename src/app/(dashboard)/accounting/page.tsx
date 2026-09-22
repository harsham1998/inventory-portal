import { createClient } from "@/lib/supabase/server";
import { DateNav } from "./DateNav";
import { AddExpenseForm } from "./AddExpenseForm";
import { deleteExpense } from "./actions";

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ?? new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const [{ data: sales }, { data: invoices }, { data: expenses }, { data: outlets }, { data: suppliers }] =
    await Promise.all([
      supabase.from("sales_records").select("id, outlet_id, total_revenue, source").eq("sale_date", date),
      supabase
        .from("supplier_invoices")
        .select("id, supplier_id, invoice_number, total_amount")
        .eq("invoice_date", date),
      supabase.from("expenses").select("id, outlet_id, category, description, amount").eq("expense_date", date),
      supabase.from("outlets").select("id, name"),
      supabase.from("suppliers").select("id, name"),
    ]);

  const outletName = new Map((outlets ?? []).map((o) => [o.id, o.name]));
  const supplierName = new Map((suppliers ?? []).map((s) => [s.id, s.name]));

  const totalInflow = (sales ?? []).reduce((sum, s) => sum + s.total_revenue, 0);
  const invoiceOutflow = (invoices ?? []).reduce((sum, i) => sum + i.total_amount, 0);
  const expenseOutflow = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  const totalOutflow = invoiceOutflow + expenseOutflow;
  const netProfit = totalInflow - totalOutflow;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Accounting</h1>
          <p className="mt-1 text-sm text-zinc-500">Daily inflow (sales) vs. outflow (invoices + expenses).</p>
        </div>
        <DateNav date={date} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-xs font-medium text-zinc-500">Inflow (sales)</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">₹{totalInflow.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-xs font-medium text-zinc-500">Outflow (invoices + expenses)</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">₹{totalOutflow.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-xs font-medium text-zinc-500">Net profit / loss</p>
          <p className={`mt-2 text-2xl font-semibold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {netProfit >= 0 ? "+" : "−"}₹{Math.abs(netProfit).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-zinc-700">Inflow — sales</h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {(sales ?? []).map((s) => (
              <li key={s.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <span className="text-zinc-700">
                  {outletName.get(s.outlet_id) ?? "—"} <span className="text-xs text-zinc-400 capitalize">({s.source})</span>
                </span>
                <span className="font-medium text-zinc-900">₹{s.total_revenue.toFixed(2)}</span>
              </li>
            ))}
            {(sales ?? []).length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-zinc-400">No sales logged for this day.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-zinc-700">Outflow — supplier invoices</h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {(invoices ?? []).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <span className="text-zinc-700">
                  {inv.invoice_number} · {supplierName.get(inv.supplier_id) ?? "—"}
                </span>
                <span className="font-medium text-zinc-900">₹{inv.total_amount.toFixed(2)}</span>
              </li>
            ))}
            {(invoices ?? []).length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-zinc-400">No invoices dated this day.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-700">Other expenses</h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {(expenses ?? []).map((e) => (
            <li key={e.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <span className="text-zinc-700">
                {e.category}
                {e.description ? ` — ${e.description}` : ""}
                {e.outlet_id ? ` · ${outletName.get(e.outlet_id) ?? ""}` : ""}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-medium text-zinc-900">₹{e.amount.toFixed(2)}</span>
                <form action={deleteExpense.bind(null, e.id)}>
                  <button type="submit" className="text-xs text-zinc-400 hover:text-red-600">
                    Remove
                  </button>
                </form>
              </span>
            </li>
          ))}
          {(expenses ?? []).length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-zinc-400">No other expenses logged for this day.</li>
          ) : null}
        </ul>
        <div className="border-t border-zinc-100 px-6 py-4">
          <AddExpenseForm date={date} outlets={outlets ?? []} />
        </div>
      </div>
    </div>
  );
}
