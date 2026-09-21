"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addSupplier(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    name,
    gstin: String(formData.get("gstin") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    bank_name: String(formData.get("bank_name") ?? "").trim() || null,
    bank_account_holder: String(formData.get("bank_account_holder") ?? "").trim() || null,
    bank_account_number: String(formData.get("bank_account_number") ?? "").trim() || null,
    bank_ifsc: String(formData.get("bank_ifsc") ?? "").trim() || null,
    bank_branch: String(formData.get("bank_branch") ?? "").trim() || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/suppliers");
}
