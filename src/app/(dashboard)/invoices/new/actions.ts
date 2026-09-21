"use server";

import { createClient } from "@/lib/supabase/server";

export type InvoiceItemInput = {
  itemName: string;
  rate: number | null;
  qty: number;
  unit: string;
  taxableValue: number | null;
  taxAmount: number;
  amount: number;
};

export type CreateSupplierInvoiceInput = {
  invoiceNumber: string;
  supplierId: number;
  outletId: number;
  poId: number | null;
  invoiceDate: string;
  dueDate: string | null;
  subtotal: number;
  taxAmount: number;
  roundOff: number;
  totalAmount: number;
  filePath: string | null;
  items: InvoiceItemInput[];
};

export async function createSupplierInvoice(
  input: CreateSupplierInvoiceInput,
): Promise<{ error: string } | { id: number }> {
  if (!input.invoiceNumber || !input.supplierId || !input.outletId) {
    return { error: "Invoice number, supplier and outlet are required." };
  }
  if (input.items.length === 0) {
    return { error: "Add at least one line item." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("create_supplier_invoice", {
      p_invoice_number: input.invoiceNumber,
      p_supplier_id: input.supplierId,
      p_outlet_id: input.outletId,
      p_po_id: input.poId,
      p_invoice_date: input.invoiceDate,
      p_due_date: input.dueDate,
      p_subtotal: input.subtotal,
      p_tax_amount: input.taxAmount,
      p_round_off: input.roundOff,
      p_total_amount: input.totalAmount,
      p_file_path: input.filePath,
      p_items: input.items.map((item) => ({
        item_name: item.itemName,
        rate: item.rate,
        qty: item.qty,
        unit: item.unit,
        taxable_value: item.taxableValue,
        tax_amount: item.taxAmount,
        amount: item.amount,
      })),
    })
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id as number };
}
