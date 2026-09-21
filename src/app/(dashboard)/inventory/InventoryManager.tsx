"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addInventoryItem,
  adjustStock,
  deleteInventoryItem,
  updateInventoryItem,
  type InventoryItemInput,
} from "./actions";

type InventoryItem = {
  id: number;
  name: string;
  unit: string;
  category: string | null;
  current_stock: number;
  reorder_level: number;
};

const emptyForm: InventoryItemInput = { name: "", unit: "", category: "", reorderLevel: 0 };

export function InventoryManager({ items }: { items: InventoryItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [addForm, setAddForm] = useState<InventoryItemInput>(emptyForm);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<InventoryItemInput>(emptyForm);
  const [rowError, setRowError] = useState<Record<number, string>>({});
  const [adjustQty, setAdjustQty] = useState<Record<number, string>>({});

  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const categories = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.category).filter((c): c is string => Boolean(c)))).sort(),
    [items],
  );

  const visibleItems = selectedCategory ? items.filter((i) => i.category === selectedCategory) : items;

  function setRowErrorFor(id: number, message: string | null) {
    setRowError((prev) => {
      const next = { ...prev };
      if (message) next[id] = message;
      else delete next[id];
      return next;
    });
  }

  function handleAdd() {
    setAddError(null);
    startTransition(async () => {
      const result = await addInventoryItem(addForm);
      if (result?.error) {
        setAddError(result.error);
        return;
      }
      setAddForm(emptyForm);
      router.refresh();
    });
  }

  function startEdit(item: InventoryItem) {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      unit: item.unit,
      category: item.category ?? "",
      reorderLevel: item.reorder_level,
    });
    setRowErrorFor(item.id, null);
  }

  function saveEdit(id: number) {
    startTransition(async () => {
      const result = await updateInventoryItem(id, editForm);
      if (result?.error) {
        setRowErrorFor(id, result.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  function handleDelete(item: InventoryItem) {
    if (!confirm(`Delete "${item.name}" from inventory?`)) return;
    startTransition(async () => {
      const result = await deleteInventoryItem(item.id);
      if (result?.error) {
        setRowErrorFor(item.id, result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleAdjust(id: number) {
    const delta = Number(adjustQty[id]);
    setRowErrorFor(id, null);
    startTransition(async () => {
      const result = await adjustStock(id, delta);
      if (result?.error) {
        setRowErrorFor(id, result.error);
        return;
      }
      setAdjustQty((prev) => ({ ...prev, [id]: "" }));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-700">Add item</h2>
        </div>
        <div className="flex flex-wrap items-end gap-3 px-6 py-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Name</span>
            <input
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              className="w-48 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Unit</span>
            <input
              value={addForm.unit}
              onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))}
              placeholder="kgs, pcs…"
              className="w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Category</span>
            <input
              value={addForm.category}
              onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
              className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Min stock (reorder level)</span>
            <input
              type="number"
              step="0.01"
              value={addForm.reorderLevel}
              onChange={(e) => setAddForm((f) => ({ ...f, reorderLevel: Number(e.target.value) }))}
              className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handleAdd}
            disabled={pending || !addForm.name.trim() || !addForm.unit.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {addError ? <p className="px-6 pb-4 text-sm text-red-600">{addError}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-xs font-medium text-zinc-500">Section</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-zinc-400">
          {visibleItems.length} of {items.length} items
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">Item</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Unit</th>
              <th className="px-6 py-3 font-medium">Stock</th>
              <th className="px-6 py-3 font-medium">Min stock</th>
              <th className="px-6 py-3 font-medium">Adjust</th>
              <th className="px-6 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {visibleItems.map((item) => {
              const low = item.current_stock <= item.reorder_level;
              const editing = editingId === item.id;

              if (editing) {
                return (
                  <tr key={item.id} className="bg-blue-50/40">
                    <td className="px-6 py-2">
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-36 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        value={editForm.category}
                        onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                        className="w-32 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        value={editForm.unit}
                        onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                        className="w-16 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-2 text-zinc-500">
                      {item.current_stock} {item.unit}
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.reorderLevel}
                        onChange={(e) => setEditForm((f) => ({ ...f, reorderLevel: Number(e.target.value) }))}
                        className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-2 text-zinc-400">—</td>
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(item.id)}
                          disabled={pending}
                          className="rounded-lg bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                        >
                          Cancel
                        </button>
                      </div>
                      {rowError[item.id] ? <p className="mt-1 text-xs text-red-600">{rowError[item.id]}</p> : null}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={item.id}>
                  <td className="px-6 py-3 font-medium text-zinc-900">{item.name}</td>
                  <td className="px-6 py-3 text-zinc-500">{item.category ?? "—"}</td>
                  <td className="px-6 py-3 text-zinc-500">{item.unit}</td>
                  <td className="px-6 py-3">
                    <span className={low ? "font-semibold text-red-600" : "text-zinc-900"}>
                      {item.current_stock} {item.unit}
                    </span>
                    {low ? <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">Low</span> : null}
                  </td>
                  <td className="px-6 py-3 text-zinc-500">
                    {item.reorder_level} {item.unit}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={adjustQty[item.id] ?? ""}
                        onChange={(e) => setAdjustQty((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="+/- qty"
                        className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleAdjust(item.id)}
                        disabled={pending}
                        className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => startEdit(item)} className="text-xs text-blue-600 hover:underline">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(item)} className="text-xs text-zinc-400 hover:text-red-600">
                        Delete
                      </button>
                    </div>
                    {rowError[item.id] ? <p className="mt-1 text-xs text-red-600">{rowError[item.id]}</p> : null}
                  </td>
                </tr>
              );
            })}
            {visibleItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-zinc-400">
                  {items.length === 0 ? "No items yet." : "No items in this category."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
