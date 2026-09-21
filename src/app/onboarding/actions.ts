"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(formData: FormData): Promise<void> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const outletIdRaw = formData.get("outlet_id");
  const outletId = outletIdRaw ? Number(outletIdRaw) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!fullName) {
    throw new Error("Name is required.");
  }

  const { error } = await supabase.from("staff").insert({
    id: user.id,
    full_name: fullName,
    outlet_id: outletId,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/");
}
