-- Inventory / Purchase Order portal schema

create schema if not exists private;

-- ============ Reference tables ============

create table public.outlets (
  id bigint generated always as identity primary key,
  name text not null,
  address text,
  gstin text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id bigint generated always as identity primary key,
  name text not null,
  gstin text,
  address text,
  phone text,
  email text,
  bank_name text,
  bank_account_holder text,
  bank_account_number text,
  bank_ifsc text,
  bank_branch text,
  created_at timestamptz not null default now()
);

-- One row per authenticated user; ties them to an outlet.
create table public.staff (
  id uuid primary key references auth.users (id) on delete cascade,
  outlet_id bigint references public.outlets (id),
  full_name text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);
create index staff_outlet_id_idx on public.staff (outlet_id);

-- ============ Inventory ============

create table public.inventory_items (
  id bigint generated always as identity primary key,
  name text not null unique,
  unit text not null,
  category text,
  current_stock numeric(12, 3) not null default 0,
  reorder_level numeric(12, 3) not null default 0,
  created_at timestamptz not null default now()
);

-- Append-only ledger; inventory_items.current_stock is a maintained cache of this.
create table public.stock_movements (
  id bigint generated always as identity primary key,
  item_id bigint not null references public.inventory_items (id),
  quantity_delta numeric(12, 3) not null,
  reason text not null check (reason in ('po_created', 'manual_adjust', 'invoice_received')),
  reference_type text,
  reference_id bigint,
  created_by uuid references public.staff (id),
  created_at timestamptz not null default now()
);
create index stock_movements_item_id_idx on public.stock_movements (item_id);
create index stock_movements_created_by_idx on public.stock_movements (created_by);

-- ============ Purchase orders ============

create sequence public.po_number_seq;
grant usage, select on sequence public.po_number_seq to authenticated;

create table public.purchase_orders (
  id bigint generated always as identity primary key,
  po_number text not null unique,
  outlet_id bigint not null references public.outlets (id),
  supplier_id bigint not null references public.suppliers (id),
  order_date date not null default current_date,
  status text not null default 'sent' check (status in ('draft', 'sent')),
  notes text,
  created_by uuid references public.staff (id),
  created_at timestamptz not null default now()
);
create index purchase_orders_outlet_id_idx on public.purchase_orders (outlet_id);
create index purchase_orders_supplier_id_idx on public.purchase_orders (supplier_id);
create index purchase_orders_created_by_idx on public.purchase_orders (created_by);

create table public.purchase_order_items (
  id bigint generated always as identity primary key,
  po_id bigint not null references public.purchase_orders (id) on delete cascade,
  item_id bigint not null references public.inventory_items (id),
  item_name text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit text not null
);
create index purchase_order_items_po_id_idx on public.purchase_order_items (po_id);
create index purchase_order_items_item_id_idx on public.purchase_order_items (item_id);

-- ============ Supplier invoices ============

create table public.supplier_invoices (
  id bigint generated always as identity primary key,
  invoice_number text not null,
  supplier_id bigint not null references public.suppliers (id),
  outlet_id bigint not null references public.outlets (id),
  po_id bigint references public.purchase_orders (id),
  invoice_date date not null,
  due_date date,
  subtotal numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  round_off numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  file_path text,
  created_by uuid references public.staff (id),
  created_at timestamptz not null default now(),
  unique (supplier_id, invoice_number)
);
create index supplier_invoices_supplier_id_idx on public.supplier_invoices (supplier_id);
create index supplier_invoices_outlet_id_idx on public.supplier_invoices (outlet_id);
create index supplier_invoices_po_id_idx on public.supplier_invoices (po_id);

create table public.supplier_invoice_items (
  id bigint generated always as identity primary key,
  invoice_id bigint not null references public.supplier_invoices (id) on delete cascade,
  item_name text not null,
  rate numeric(12, 2),
  qty numeric(12, 3) not null,
  unit text,
  taxable_value numeric(12, 2),
  tax_amount numeric(12, 2) not null default 0,
  amount numeric(12, 2) not null
);
create index supplier_invoice_items_invoice_id_idx on public.supplier_invoice_items (invoice_id);

-- ============ Triggers ============

-- Auto-generate PO numbers: PO-<year>-<seq, zero padded>
create or replace function private.set_po_number()
returns trigger
language plpgsql
as $$
begin
  if new.po_number is null then
    new.po_number := 'PO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.po_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger purchase_orders_set_po_number
  before insert on public.purchase_orders
  for each row
  execute function private.set_po_number();

-- Ledger -> cached stock balance
create or replace function private.apply_stock_movement()
returns trigger
language plpgsql
as $$
begin
  update public.inventory_items
  set current_stock = current_stock + new.quantity_delta
  where id = new.item_id;
  return new;
end;
$$;

create trigger stock_movements_apply
  after insert on public.stock_movements
  for each row
  execute function private.apply_stock_movement();

-- Every PO line item logs a stock movement (this is how "stock increases on PO creation" happens)
create or replace function private.log_po_item_stock()
returns trigger
language plpgsql
as $$
begin
  insert into public.stock_movements (item_id, quantity_delta, reason, reference_type, reference_id, created_by)
  select
    new.item_id,
    new.quantity,
    'po_created',
    'purchase_order',
    new.po_id,
    po.created_by
  from public.purchase_orders po
  where po.id = new.po_id;
  return new;
end;
$$;

create trigger purchase_order_items_log_stock
  after insert on public.purchase_order_items
  for each row
  execute function private.log_po_item_stock();

-- Creates a PO and its line items in one transaction, resolving any
-- unmatched pasted item names into new inventory_items rows as it goes.
-- security invoker (default) — runs as the calling user, so RLS still applies.
create or replace function public.create_purchase_order(
  p_outlet_id bigint,
  p_supplier_id bigint,
  p_order_date date,
  p_notes text,
  p_items jsonb -- [{item_id: bigint|null, name: text, unit: text, quantity: numeric}, ...]
)
returns table (id bigint, po_number text)
language plpgsql
as $$
declare
  v_po_id bigint;
  v_po_number text;
  v_item jsonb;
  v_item_id bigint;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'A purchase order needs at least one item';
  end if;

  insert into public.purchase_orders (outlet_id, supplier_id, order_date, notes, created_by)
  values (p_outlet_id, p_supplier_id, p_order_date, p_notes, (select auth.uid()))
  returning purchase_orders.id, purchase_orders.po_number into v_po_id, v_po_number;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if (v_item ->> 'item_id') is not null then
      v_item_id := (v_item ->> 'item_id')::bigint;
    else
      insert into public.inventory_items (name, unit)
      values (v_item ->> 'name', v_item ->> 'unit')
      on conflict (name) do update set name = excluded.name
      returning inventory_items.id into v_item_id;
    end if;

    insert into public.purchase_order_items (po_id, item_id, item_name, quantity, unit)
    values (v_po_id, v_item_id, v_item ->> 'name', (v_item ->> 'quantity')::numeric, v_item ->> 'unit');
  end loop;

  return query select v_po_id, v_po_number;
end;
$$;

grant execute on function public.create_purchase_order(bigint, bigint, date, text, jsonb) to authenticated;

-- Same idea as create_purchase_order: header + line items in one transaction.
create or replace function public.create_supplier_invoice(
  p_invoice_number text,
  p_supplier_id bigint,
  p_outlet_id bigint,
  p_po_id bigint,
  p_invoice_date date,
  p_due_date date,
  p_subtotal numeric,
  p_tax_amount numeric,
  p_round_off numeric,
  p_total_amount numeric,
  p_file_path text,
  p_items jsonb -- [{item_name, rate, qty, unit, taxable_value, tax_amount, amount}, ...]
)
returns table (id bigint)
language plpgsql
as $$
declare
  v_invoice_id bigint;
  v_item jsonb;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'An invoice needs at least one item';
  end if;

  insert into public.supplier_invoices (
    invoice_number, supplier_id, outlet_id, po_id, invoice_date, due_date,
    subtotal, tax_amount, round_off, total_amount, file_path, created_by
  )
  values (
    p_invoice_number, p_supplier_id, p_outlet_id, p_po_id, p_invoice_date, p_due_date,
    p_subtotal, p_tax_amount, p_round_off, p_total_amount, p_file_path, (select auth.uid())
  )
  returning supplier_invoices.id into v_invoice_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.supplier_invoice_items (invoice_id, item_name, rate, qty, unit, taxable_value, tax_amount, amount)
    values (
      v_invoice_id,
      v_item ->> 'item_name',
      nullif(v_item ->> 'rate', '')::numeric,
      (v_item ->> 'qty')::numeric,
      v_item ->> 'unit',
      nullif(v_item ->> 'taxable_value', '')::numeric,
      coalesce(nullif(v_item ->> 'tax_amount', '')::numeric, 0),
      (v_item ->> 'amount')::numeric
    );
  end loop;

  return query select v_invoice_id;
end;
$$;

grant execute on function public.create_supplier_invoice(text, bigint, bigint, bigint, date, date, numeric, numeric, numeric, numeric, text, jsonb) to authenticated;

-- ============ RLS ============

alter table public.outlets enable row level security;
alter table public.suppliers enable row level security;
alter table public.staff enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.supplier_invoices enable row level security;
alter table public.supplier_invoice_items enable row level security;

-- Helper: is the calling user a row in staff? Kept in `private` so it's not
-- exposed over the API, and it checks auth.uid() itself so it can't be
-- called on someone else's behalf.
create or replace function private.is_staff()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff where id = (select auth.uid())
  );
$$;
revoke execute on function private.is_staff() from public, anon;
grant execute on function private.is_staff() to authenticated;

-- Every table: any signed-in staff member can read/write.
-- (Single small org running multiple outlets; per-outlet isolation isn't
-- needed yet — staff need cross-outlet visibility. Revisit if that changes.)
-- Any signed-in user can read outlets (needed for the onboarding picker,
-- before they exist in `staff`); writes still require staff membership.
create policy outlets_authenticated_select on public.outlets for select to authenticated
  using (true);
create policy outlets_staff_write on public.outlets for insert to authenticated
  with check ((select private.is_staff()));
create policy outlets_staff_update on public.outlets for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy outlets_staff_delete on public.outlets for delete to authenticated
  using ((select private.is_staff()));

create policy suppliers_staff_all on public.suppliers for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy staff_self_select on public.staff for select to authenticated
  using ((select private.is_staff()));
-- Self-service onboarding: a freshly signed-up user has no staff row yet, so
-- is_staff() would be false — this lets them create exactly their own row
-- (id must match their own auth uid) to bootstrap into the app.
create policy staff_self_insert on public.staff for insert to authenticated
  with check (id = (select auth.uid()));
create policy staff_self_update on public.staff for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy inventory_items_staff_all on public.inventory_items for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy stock_movements_staff_all on public.stock_movements for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy purchase_orders_staff_all on public.purchase_orders for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy purchase_order_items_staff_all on public.purchase_order_items for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy supplier_invoices_staff_all on public.supplier_invoices for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy supplier_invoice_items_staff_all on public.supplier_invoice_items for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

-- ============ Storage ============

insert into storage.buckets (id, name, public)
values ('purchase-orders', 'purchase-orders', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('supplier-invoices', 'supplier-invoices', false)
on conflict (id) do nothing;

create policy po_pdfs_staff_all on storage.objects for all to authenticated
  using (bucket_id = 'purchase-orders' and (select private.is_staff()))
  with check (bucket_id = 'purchase-orders' and (select private.is_staff()));

create policy invoice_files_staff_all on storage.objects for all to authenticated
  using (bucket_id = 'supplier-invoices' and (select private.is_staff()))
  with check (bucket_id = 'supplier-invoices' and (select private.is_staff()));
