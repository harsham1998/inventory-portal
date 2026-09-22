"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addIngredient,
  addMenuItem,
  bulkUpdateMenuItems,
  deleteMenuItem,
  removeIngredient,
  updateIngredientQuantity,
  type MenuItemInput,
} from "./actions";

type MenuItem = { id: number; name: string; category: string | null; selling_price: number | null };
type Ingredient = { id: number; menu_item_id: number; inventory_item_id: number; quantity: number };
type InventoryItem = { id: number; name: string; unit: string; purchase_cost: number | null };

const emptyForm: MenuItemInput = { name: "", category: "", sellingPrice: null };

function foodCost(
  menuItemId: number,
  ingredients: Ingredient[],
  itemsById: Map<number, InventoryItem>,
): { cost: number; unknown: boolean } {
  let cost = 0;
  let unknown = false;
  for (const ing of ingredients) {
    if (ing.menu_item_id !== menuItemId) continue;
    const item = itemsById.get(ing.inventory_item_id);
    if (!item || item.purchase_cost === null) {
      unknown = true;
      continue;
    }
    cost += ing.quantity * item.purchase_cost;
  }
  return { cost, unknown };
}

export function MenuManager({
  menuItems,
  ingredients,
  inventoryItems,
}: {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  inventoryItems: InventoryItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [addForm, setAddForm] = useState<MenuItemInput>(emptyForm);
  const [addError, setAddError] = useState<string | null>(null);

  const [bulkEditing, setBulkEditing] = useState(false);
  const [bulkForms, setBulkForms] = useState<Record<number, MenuItemInput>>({});
  const [rowError, setRowError] = useState<Record<number, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newIngredientItemId, setNewIngredientItemId] = useState<string>("");
  const [newIngredientQty, setNewIngredientQty] = useState<string>("");
  const [recipeError, setRecipeError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const itemsById = useMemo(() => new Map(inventoryItems.map((i) => [i.id, i])), [inventoryItems]);

  const categories = useMemo(
    () => Array.from(new Set(menuItems.map((m) => m.category).filter((c): c is string => Boolean(c)))).sort(),
    [menuItems],
  );

  const visibleItems = selectedCategory ? menuItems.filter((m) => m.category === selectedCategory) : menuItems;

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
      const result = await addMenuItem(addForm);
      if (result?.error) {
        setAddError(result.error);
        return;
      }
      setAddForm(emptyForm);
      router.refresh();
    });
  }

  function startBulkEdit() {
    const seeded: Record<number, MenuItemInput> = {};
    for (const item of menuItems) {
      seeded[item.id] = { name: item.name, category: item.category ?? "", sellingPrice: item.selling_price };
    }
    setBulkForms(seeded);
    setRowError({});
    setSaveError(null);
    setBulkEditing(true);
  }

  function cancelBulkEdit() {
    setBulkEditing(false);
    setBulkForms({});
    setRowError({});
    setSaveError(null);
  }

  function updateBulkField(id: number, patch: Partial<MenuItemInput>) {
    setBulkForms((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function saveBulkEdit() {
    setSaveError(null);
    const changed = menuItems
      .filter((item) => {
        const form = bulkForms[item.id];
        if (!form) return false;
        return (
          form.name !== item.name ||
          form.category !== (item.category ?? "") ||
          form.sellingPrice !== item.selling_price
        );
      })
      .map((item) => ({ id: item.id, input: bulkForms[item.id] }));

    if (changed.length === 0) {
      setBulkEditing(false);
      return;
    }

    startTransition(async () => {
      const result = await bulkUpdateMenuItems(changed);
      if (result?.errors) {
        setRowError(result.errors);
        setSaveError(`${Object.keys(result.errors).length} item(s) couldn't be saved — see below.`);
        return;
      }
      setBulkEditing(false);
      setBulkForms({});
      router.refresh();
    });
  }

  function handleDelete(item: MenuItem) {
    if (!confirm(`Delete "${item.name}" from the menu?`)) return;
    startTransition(async () => {
      const result = await deleteMenuItem(item.id);
      if (result?.error) {
        setRowErrorFor(item.id, result.error);
        return;
      }
      router.refresh();
    });
  }

  function toggleRecipe(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
    setNewIngredientItemId("");
    setNewIngredientQty("");
    setRecipeError(null);
  }

  function handleAddIngredient(menuItemId: number) {
    setRecipeError(null);
    startTransition(async () => {
      const result = await addIngredient(menuItemId, Number(newIngredientItemId), Number(newIngredientQty));
      if (result?.error) {
        setRecipeError(result.error);
        return;
      }
      setNewIngredientItemId("");
      setNewIngredientQty("");
      router.refresh();
    });
  }

  function handleUpdateIngredientQty(id: number, quantity: string) {
    startTransition(async () => {
      const result = await updateIngredientQuantity(id, Number(quantity));
      if (result?.error) {
        setRecipeError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRemoveIngredient(id: number) {
    startTransition(async () => {
      await removeIngredient(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-700">Add dish</h2>
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
            <span className="text-xs font-medium text-zinc-500">Category</span>
            <input
              value={addForm.category}
              onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
              className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-zinc-500">Selling price</span>
            <input
              type="number"
              step="0.01"
              value={addForm.sellingPrice ?? ""}
              onChange={(e) => setAddForm((f) => ({ ...f, sellingPrice: e.target.value ? Number(e.target.value) : null }))}
              className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handleAdd}
            disabled={pending || !addForm.name.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {addError ? <p className="px-6 pb-4 text-sm text-red-600">{addError}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
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
            {visibleItems.length} of {menuItems.length} dishes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {bulkEditing ? (
            <>
              {saveError ? <span className="text-xs text-red-600">{saveError}</span> : null}
              <button
                type="button"
                onClick={cancelBulkEdit}
                disabled={pending}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveBulkEdit}
                disabled={pending}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save all"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startBulkEdit}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Edit dishes
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-medium">Dish</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Price</th>
              <th className="px-6 py-3 font-medium">Food cost</th>
              <th className="px-6 py-3 font-medium">Margin</th>
              <th className="px-6 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {visibleItems.map((item) => {
              const form = bulkForms[item.id];
              if (bulkEditing && form) {
                return (
                  <tr key={item.id} className="bg-blue-50/40">
                    <td className="px-6 py-2">
                      <input
                        value={form.name}
                        onChange={(e) => updateBulkField(item.id, { name: e.target.value })}
                        className="w-40 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        value={form.category}
                        onChange={(e) => updateBulkField(item.id, { category: e.target.value })}
                        className="w-32 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={form.sellingPrice ?? ""}
                        onChange={(e) =>
                          updateBulkField(item.id, { sellingPrice: e.target.value ? Number(e.target.value) : null })
                        }
                        className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-2 text-zinc-300">—</td>
                    <td className="px-6 py-2 text-zinc-300">—</td>
                    <td className="px-6 py-2">
                      {rowError[item.id] ? <p className="text-xs text-red-600">{rowError[item.id]}</p> : null}
                    </td>
                  </tr>
                );
              }

              const { cost, unknown } = foodCost(item.id, ingredients, itemsById);
              const margin = item.selling_price !== null ? item.selling_price - cost : null;
              const marginPct =
                margin !== null && item.selling_price ? ` (${((margin / item.selling_price) * 100).toFixed(0)}%)` : "";
              const expanded = expandedId === item.id;
              const dishIngredients = ingredients.filter((i) => i.menu_item_id === item.id);

              return (
                <Fragment key={item.id}>
                  <tr>
                    <td className="px-6 py-3 font-medium text-zinc-900">{item.name}</td>
                    <td className="px-6 py-3 text-zinc-500">{item.category ?? "—"}</td>
                    <td className="px-6 py-3 text-zinc-500">
                      {item.selling_price !== null ? `₹${item.selling_price.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-6 py-3 text-zinc-500">
                      ₹{cost.toFixed(2)}
                      {unknown ? <span className="ml-1 text-amber-600">*</span> : null}
                    </td>
                    <td className="px-6 py-3 text-zinc-500">
                      {margin !== null ? `₹${margin.toFixed(2)}${marginPct}` : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => toggleRecipe(item.id)} className="text-xs text-blue-600 hover:underline">
                          {expanded ? "Hide recipe" : "Recipe"}
                        </button>
                        <button type="button" onClick={() => handleDelete(item)} className="text-xs text-zinc-400 hover:text-red-600">
                          Delete
                        </button>
                      </div>
                      {rowError[item.id] ? <p className="mt-1 text-xs text-red-600">{rowError[item.id]}</p> : null}
                    </td>
                  </tr>
                  {expanded ? (
                    <tr>
                      <td colSpan={6} className="bg-zinc-50 px-6 py-4">
                        <p className="mb-2 text-xs font-medium text-zinc-500">
                          Recipe — raw materials used to make one {item.name}
                          {unknown ? " (* some ingredients have no purchase cost set on Inventory)" : ""}
                        </p>
                        <table className="w-full max-w-2xl text-left text-sm">
                          <tbody className="divide-y divide-zinc-200">
                            {dishIngredients.map((ing) => {
                              const invItem = itemsById.get(ing.inventory_item_id);
                              return (
                                <tr key={ing.id}>
                                  <td className="py-1.5 pr-3">{invItem?.name ?? "Unknown item"}</td>
                                  <td className="py-1.5 pr-3">
                                    <input
                                      type="number"
                                      step="0.001"
                                      defaultValue={ing.quantity}
                                      onBlur={(e) => handleUpdateIngredientQty(ing.id, e.target.value)}
                                      className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                                    />
                                  </td>
                                  <td className="py-1.5 pr-3 text-zinc-500">{invItem?.unit}</td>
                                  <td className="py-1.5 pr-3 text-zinc-500">
                                    {invItem?.purchase_cost !== null && invItem?.purchase_cost !== undefined
                                      ? `₹${(ing.quantity * invItem.purchase_cost).toFixed(2)}`
                                      : "—"}
                                  </td>
                                  <td className="py-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveIngredient(ing.id)}
                                      className="text-xs text-zinc-400 hover:text-red-600"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {dishIngredients.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-2 text-xs text-zinc-400">
                                  No ingredients yet.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                        <div className="mt-3 flex flex-wrap items-end gap-2">
                          <label className="flex flex-col gap-1 text-xs">
                            <span className="font-medium text-zinc-500">Ingredient</span>
                            <select
                              value={newIngredientItemId}
                              onChange={(e) => setNewIngredientItemId(e.target.value)}
                              className="w-40 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                            >
                              <option value="">Select…</option>
                              {inventoryItems.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1 text-xs">
                            <span className="font-medium text-zinc-500">Quantity</span>
                            <input
                              type="number"
                              step="0.001"
                              value={newIngredientQty}
                              onChange={(e) => setNewIngredientQty(e.target.value)}
                              className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddIngredient(item.id)}
                            disabled={pending}
                            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                          >
                            + Add ingredient
                          </button>
                        </div>
                        {recipeError ? <p className="mt-2 text-xs text-red-600">{recipeError}</p> : null}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {visibleItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-zinc-400">
                  {menuItems.length === 0 ? "No dishes yet." : "No dishes in this category."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
