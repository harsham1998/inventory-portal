"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ExpenseInput = {
  expenseDate: string;
  outletId: number | null;
  category: string;
  description: string;
  amount: number;
};

export async function addExpense(input: ExpenseInput): Promise<{ error: string } | undefined> {
  if (!input.category.trim()) return { error: "Category is required." };
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { error: "Amount must be greater than 0." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("expenses").insert({
    expense_date: input.expenseDate,
    outlet_id: input.outletId,
    category: input.category.trim(),
    description: input.description.trim() || null,
    amount: input.amount,
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/accounting");
}

export async function deleteExpense(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
}
