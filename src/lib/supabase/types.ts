// Generated via `supabase gen types typescript --linked`, then hand-patched
// to add `| null` to a few nullable RPC args the generator can't infer
// (search "nullable plpgsql arg" below). Redo that patch after regenerating.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: number
          outlet_id: number | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: never
          outlet_id?: number | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: never
          outlet_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          current_stock: number
          id: number
          name: string
          purchase_cost: number | null
          reorder_level: number
          selling_cost: number | null
          unit: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_stock?: number
          id?: never
          name: string
          purchase_cost?: number | null
          reorder_level?: number
          selling_cost?: number | null
          unit: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_stock?: number
          id?: never
          name?: string
          purchase_cost?: number | null
          reorder_level?: number
          selling_cost?: number | null
          unit?: string
        }
        Relationships: []
      }
      menu_item_ingredients: {
        Row: {
          id: number
          inventory_item_id: number
          menu_item_id: number
          quantity: number
        }
        Insert: {
          id?: never
          inventory_item_id: number
          menu_item_id: number
          quantity: number
        }
        Update: {
          id?: never
          inventory_item_id?: number
          menu_item_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_ingredients_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string | null
          created_at: string
          id: number
          name: string
          selling_price: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: never
          name: string
          selling_price?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: never
          name?: string
          selling_price?: number | null
        }
        Relationships: []
      }
      outlets: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: number
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: never
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: never
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          estimated_unit_cost: number | null
          id: number
          item_id: number
          item_name: string
          po_id: number
          quantity: number
          unit: string
        }
        Insert: {
          estimated_unit_cost?: number | null
          id?: never
          item_id: number
          item_name: string
          po_id: number
          quantity: number
          unit: string
        }
        Update: {
          estimated_unit_cost?: number | null
          id?: never
          item_id?: number
          item_name?: string
          po_id?: number
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          notes: string | null
          order_date: string
          outlet_id: number
          po_number: string
          status: string
          supplier_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: never
          notes?: string | null
          order_date?: string
          outlet_id: number
          po_number: string
          status?: string
          supplier_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: never
          notes?: string | null
          order_date?: string
          outlet_id?: number
          po_number?: string
          status?: string
          supplier_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_record_items: {
        Row: {
          amount: number
          id: number
          item_name: string
          menu_item_id: number
          quantity_sold: number
          sale_id: number
          unit_price: number
        }
        Insert: {
          amount?: number
          id?: never
          item_name: string
          menu_item_id: number
          quantity_sold: number
          sale_id: number
          unit_price?: number
        }
        Update: {
          amount?: number
          id?: never
          item_name?: string
          menu_item_id?: number
          quantity_sold?: number
          sale_id?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_record_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_record_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales_records"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_records: {
        Row: {
          created_at: string
          created_by: string | null
          file_path: string | null
          id: number
          outlet_id: number
          sale_date: string
          source: string
          total_revenue: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: never
          outlet_id: number
          sale_date?: string
          source?: string
          total_revenue?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          id?: never
          outlet_id?: number
          sale_date?: string
          source?: string
          total_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_records_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          full_name: string
          id: string
          outlet_id: number | null
          role: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          outlet_id?: number | null
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          outlet_id?: number | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          item_id: number
          quantity_delta: number
          reason: string
          reference_id: number | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: never
          item_id: number
          quantity_delta: number
          reason: string
          reference_id?: number | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: never
          item_id?: number
          quantity_delta?: number
          reason?: string
          reference_id?: number | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoice_items: {
        Row: {
          amount: number
          id: number
          invoice_id: number
          item_name: string
          qty: number
          rate: number | null
          tax_amount: number
          taxable_value: number | null
          unit: string | null
        }
        Insert: {
          amount: number
          id?: never
          invoice_id: number
          item_name: string
          qty: number
          rate?: number | null
          tax_amount?: number
          taxable_value?: number | null
          unit?: string | null
        }
        Update: {
          amount?: number
          id?: never
          invoice_id?: number
          item_name?: string
          qty?: number
          rate?: number | null
          tax_amount?: number
          taxable_value?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          created_at: string
          created_by: string | null
          due_date: string | null
          file_path: string | null
          id: number
          invoice_date: string
          invoice_number: string
          outlet_id: number
          po_id: number | null
          round_off: number
          subtotal: number
          supplier_id: number
          tax_amount: number
          total_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          file_path?: string | null
          id?: never
          invoice_date: string
          invoice_number: string
          outlet_id: number
          po_id?: number | null
          round_off?: number
          subtotal?: number
          supplier_id: number
          tax_amount?: number
          total_amount?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          file_path?: string | null
          id?: never
          invoice_date?: string
          invoice_number?: string
          outlet_id?: number
          po_id?: number | null
          round_off?: number
          subtotal?: number
          supplier_id?: number
          tax_amount?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: number
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: never
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: never
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_purchase_order: {
        // p_notes is a nullable plpgsql arg; the generator can't see that
        // from Postgres's catalog (only table columns carry nullability),
        // so `| null` is added by hand here.
        Args: {
          p_items: Json
          p_notes: string | null
          p_order_date: string
          p_outlet_id: number
          p_supplier_id: number
        }
        Returns: {
          id: number
          po_number: string
        }[]
      }
      create_sales_record: {
        // p_file_path and p_source are nullable plpgsql args.
        Args: {
          p_file_path: string | null
          p_items: Json
          p_outlet_id: number
          p_sale_date: string
          p_source: string | null
        }
        Returns: {
          id: number
        }[]
      }
      create_supplier_invoice: {
        // Same as above: p_due_date, p_file_path, p_po_id are nullable in
        // the function body but the generator emits them as non-null.
        Args: {
          p_due_date: string | null
          p_file_path: string | null
          p_invoice_date: string
          p_invoice_number: string
          p_items: Json
          p_outlet_id: number
          p_po_id: number | null
          p_round_off: number
          p_subtotal: number
          p_supplier_id: number
          p_tax_amount: number
          p_total_amount: number
        }
        Returns: {
          id: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
