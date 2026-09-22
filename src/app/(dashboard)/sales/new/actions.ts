"use server";

import { createClient } from "@/lib/supabase/server";
import { parseSalesReportPdf, type ParsedSalesReport } from "@/lib/sales-report-pdf";

export type SaleItemInput = {
  menuItemId: number | null;
  name: string;
  category: string | null;
  quantity: number;
  unitPrice: number;
};

export type CreateSalesRecordInput = {
  outletId: number;
  saleDate: string;
  source: "manual" | "pdf_upload";
  filePath: string | null;
  items: SaleItemInput[];
};

export async function createSalesRecord(
  input: CreateSalesRecordInput,
): Promise<{ error: string } | { id: number }> {
  if (!input.outletId) {
    return { error: "Pick an outlet." };
  }
  if (input.items.length === 0) {
    return { error: "Add at least one item sold." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("create_sales_record", {
      p_outlet_id: input.outletId,
      p_sale_date: input.saleDate,
      p_source: input.source,
      p_file_path: input.filePath,
      p_items: input.items.map((item) => ({
        menu_item_id: item.menuItemId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    })
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id as number };
}

export async function parseSalesReportFile(
  formData: FormData,
): Promise<{ error: string } | ParsedSalesReport> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No file received." };
  }
  if (file.type !== "application/pdf") {
    return { error: "Only PDF files can be auto-extracted right now — enter this one manually." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const parsed = await parseSalesReportPdf(buffer);
    if (parsed.items.length === 0) {
      return {
        error: "Couldn't find a recognizable item table in this PDF — enter the items manually.",
      };
    }
    return parsed;
  } catch {
    return { error: "Couldn't read this PDF — enter the items manually." };
  }
}
