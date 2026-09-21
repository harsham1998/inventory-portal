// Hand-written to match supabase/migrations/0001_init.sql.
// Once the project is linked, regenerate with:
//   supabase gen types typescript --linked > src/lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      outlets: {
        Row: {
          id: number;
          name: string;
          address: string | null;
          gstin: string | null;
          phone: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["outlets"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["outlets"]["Row"]>;
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: number;
          name: string;
          gstin: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          bank_name: string | null;
          bank_account_holder: string | null;
          bank_account_number: string | null;
          bank_ifsc: string | null;
          bank_branch: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["suppliers"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Row"]>;
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          outlet_id: number | null;
          full_name: string;
          role: "admin" | "staff";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["staff"]["Row"]> & {
          id: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Row"]>;
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: number;
          name: string;
          unit: string;
          category: string | null;
          current_stock: number;
          reorder_level: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory_items"]["Row"]> & {
          name: string;
          unit: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Row"]>;
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: number;
          item_id: number;
          quantity_delta: number;
          reason: "po_created" | "manual_adjust" | "invoice_received";
          reference_type: string | null;
          reference_id: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["stock_movements"]["Row"]> & {
          item_id: number;
          quantity_delta: number;
          reason: "po_created" | "manual_adjust" | "invoice_received";
        };
        Update: Partial<Database["public"]["Tables"]["stock_movements"]["Row"]>;
        Relationships: [];
      };
      purchase_orders: {
        Row: {
          id: number;
          po_number: string;
          outlet_id: number;
          supplier_id: number;
          order_date: string;
          status: "draft" | "sent";
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["purchase_orders"]["Row"]> & {
          outlet_id: number;
          supplier_id: number;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_orders"]["Row"]>;
        Relationships: [];
      };
      purchase_order_items: {
        Row: {
          id: number;
          po_id: number;
          item_id: number;
          item_name: string;
          quantity: number;
          unit: string;
        };
        Insert: Partial<Database["public"]["Tables"]["purchase_order_items"]["Row"]> & {
          po_id: number;
          item_id: number;
          item_name: string;
          quantity: number;
          unit: string;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_order_items"]["Row"]>;
        Relationships: [];
      };
      supplier_invoices: {
        Row: {
          id: number;
          invoice_number: string;
          supplier_id: number;
          outlet_id: number;
          po_id: number | null;
          invoice_date: string;
          due_date: string | null;
          subtotal: number;
          tax_amount: number;
          round_off: number;
          total_amount: number;
          file_path: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["supplier_invoices"]["Row"]> & {
          invoice_number: string;
          supplier_id: number;
          outlet_id: number;
          invoice_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["supplier_invoices"]["Row"]>;
        Relationships: [];
      };
      supplier_invoice_items: {
        Row: {
          id: number;
          invoice_id: number;
          item_name: string;
          rate: number | null;
          qty: number;
          unit: string | null;
          taxable_value: number | null;
          tax_amount: number;
          amount: number;
        };
        Insert: Partial<Database["public"]["Tables"]["supplier_invoice_items"]["Row"]> & {
          invoice_id: number;
          item_name: string;
          qty: number;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["supplier_invoice_items"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_purchase_order: {
        Args: {
          p_outlet_id: number;
          p_supplier_id: number;
          p_order_date: string;
          p_notes: string | null;
          p_items: {
            item_id: number | null;
            name: string;
            unit: string;
            quantity: number;
          }[];
        };
        Returns: { id: number; po_number: string }[];
      };
      create_supplier_invoice: {
        Args: {
          p_invoice_number: string;
          p_supplier_id: number;
          p_outlet_id: number;
          p_po_id: number | null;
          p_invoice_date: string;
          p_due_date: string | null;
          p_subtotal: number;
          p_tax_amount: number;
          p_round_off: number;
          p_total_amount: number;
          p_file_path: string | null;
          p_items: {
            item_name: string;
            rate: number | null;
            qty: number;
            unit: string | null;
            taxable_value: number | null;
            tax_amount: number;
            amount: number;
          }[];
        };
        Returns: { id: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
