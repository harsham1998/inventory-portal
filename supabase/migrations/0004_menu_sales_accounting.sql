-- Menu items (dishes you sell) + their recipe (raw materials consumed from
-- inventory per unit sold) for food-cost/margin calculation. Sales records
-- log what was sold each day; inserting a sale line automatically deducts
-- the recipe's raw materials from inventory via the existing stock_movements
-- ledger. Expenses + supplier invoices + sales feed the Accounting page's
-- daily inflow/outflow.

create table public.menu_items (
  id bigint generated always as identity primary key,
  name text not null unique,
  category text,
  selling_price numeric(12, 2),
  created_at timestamptz not null default now()
);

create table public.menu_item_ingredients (
  id bigint generated always as identity primary key,
  menu_item_id bigint not null references public.menu_items (id) on delete cascade,
  inventory_item_id bigint not null references public.inventory_items (id),
  quantity numeric(12, 4) not null check (quantity > 0),
  unique (menu_item_id, inventory_item_id)
);
create index menu_item_ingredients_menu_item_id_idx on public.menu_item_ingredients (menu_item_id);
create index menu_item_ingredients_inventory_item_id_idx on public.menu_item_ingredients (inventory_item_id);

create table public.sales_records (
  id bigint generated always as identity primary key,
  sale_date date not null default current_date,
  outlet_id bigint not null references public.outlets (id),
  source text not null default 'manual' check (source in ('manual', 'pdf_upload')),
  file_path text,
  total_revenue numeric(12, 2) not null default 0,
  created_by uuid references public.staff (id),
  created_at timestamptz not null default now()
);
create index sales_records_outlet_id_idx on public.sales_records (outlet_id);
create index sales_records_sale_date_idx on public.sales_records (sale_date);

create table public.sales_record_items (
  id bigint generated always as identity primary key,
  sale_id bigint not null references public.sales_records (id) on delete cascade,
  menu_item_id bigint not null references public.menu_items (id),
  item_name text not null,
  quantity_sold numeric(12, 3) not null check (quantity_sold > 0),
  unit_price numeric(12, 2) not null default 0,
  amount numeric(12, 2) not null default 0
);
create index sales_record_items_sale_id_idx on public.sales_record_items (sale_id);
create index sales_record_items_menu_item_id_idx on public.sales_record_items (menu_item_id);

create table public.expenses (
  id bigint generated always as identity primary key,
  expense_date date not null default current_date,
  outlet_id bigint references public.outlets (id),
  category text not null,
  description text,
  amount numeric(12, 2) not null check (amount > 0),
  created_by uuid references public.staff (id),
  created_at timestamptz not null default now()
);
create index expenses_outlet_id_idx on public.expenses (outlet_id);
create index expenses_expense_date_idx on public.expenses (expense_date);

-- Extend the stock ledger's reason set to cover recipe-driven consumption.
alter table public.stock_movements drop constraint stock_movements_reason_check;
alter table public.stock_movements add constraint stock_movements_reason_check
  check (reason in ('po_created', 'manual_adjust', 'invoice_received', 'sale_consumption'));

-- Selling a menu item consumes its recipe's raw materials from inventory.
create or replace function private.log_sale_item_consumption()
returns trigger
language plpgsql
as $$
begin
  insert into public.stock_movements (item_id, quantity_delta, reason, reference_type, reference_id, created_by)
  select
    ing.inventory_item_id,
    -1 * ing.quantity * new.quantity_sold,
    'sale_consumption',
    'sale',
    new.sale_id,
    sr.created_by
  from public.menu_item_ingredients ing
  join public.sales_records sr on sr.id = new.sale_id
  where ing.menu_item_id = new.menu_item_id;
  return new;
end;
$$;

create trigger sales_record_items_log_consumption
  after insert on public.sales_record_items
  for each row
  execute function private.log_sale_item_consumption();

-- Atomic sale creation, same shape as create_purchase_order.
create or replace function public.create_sales_record(
  p_outlet_id bigint,
  p_sale_date date,
  p_source text,
  p_file_path text,
  p_items jsonb -- [{menu_item_id, name, quantity, unit_price}, ...]
)
returns table (id bigint)
language plpgsql
as $$
declare
  v_sale_id bigint;
  v_item jsonb;
  v_total numeric(12, 2) := 0;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'A sales record needs at least one item';
  end if;

  insert into public.sales_records (outlet_id, sale_date, source, file_path, created_by)
  values (p_outlet_id, p_sale_date, coalesce(p_source, 'manual'), p_file_path, (select auth.uid()))
  returning sales_records.id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.sales_record_items (sale_id, menu_item_id, item_name, quantity_sold, unit_price, amount)
    values (
      v_sale_id,
      (v_item ->> 'menu_item_id')::bigint,
      v_item ->> 'name',
      (v_item ->> 'quantity')::numeric,
      coalesce(nullif(v_item ->> 'unit_price', '')::numeric, 0),
      (v_item ->> 'quantity')::numeric * coalesce(nullif(v_item ->> 'unit_price', '')::numeric, 0)
    );
    v_total := v_total + (v_item ->> 'quantity')::numeric * coalesce(nullif(v_item ->> 'unit_price', '')::numeric, 0);
  end loop;

  update public.sales_records set total_revenue = v_total where id = v_sale_id;

  return query select v_sale_id;
end;
$$;

grant execute on function public.create_sales_record(bigint, date, text, text, jsonb) to authenticated;

-- ============ RLS ============

alter table public.menu_items enable row level security;
alter table public.menu_item_ingredients enable row level security;
alter table public.sales_records enable row level security;
alter table public.sales_record_items enable row level security;
alter table public.expenses enable row level security;

create policy menu_items_staff_all on public.menu_items for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy menu_item_ingredients_staff_all on public.menu_item_ingredients for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy sales_records_staff_all on public.sales_records for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy sales_record_items_staff_all on public.sales_record_items for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy expenses_staff_all on public.expenses for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

insert into storage.buckets (id, name, public)
values ('sales-reports', 'sales-reports', false)
on conflict (id) do nothing;

create policy sales_report_files_staff_all on storage.objects for all to authenticated
  using (bucket_id = 'sales-reports' and (select private.is_staff()))
  with check (bucket_id = 'sales-reports' and (select private.is_staff()));
