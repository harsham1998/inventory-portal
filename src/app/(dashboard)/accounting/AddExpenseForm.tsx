"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addExpense } from "./actions";

export function AddExpenseForm({
  date,
  outlets,
}: {
  date: string;
  outlets: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [outletId, setOutletId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    const result = await addExpense({
      expenseDate: date,
      outletId: outletId ? Number(outletId) : null,
      category,
      description,
      amount: Number(amount),
    });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setCategory("");
    setDescription("");
    setAmount("");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-zinc-500">Category</span>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Rent, salaries, utilities…"
          className="w-36 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-zinc-500">Description</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-40 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-zinc-500">Outlet</span>
        <select
          value={outletId}
          onChange={(e) => setOutletId(e.target.value)}
          className="w-32 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        >
          <option value="">Any</option>
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-zinc-500">Amount</span>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </label>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving || !category.trim() || !amount}
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        + Add expense
      </button>
      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
