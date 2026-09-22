-- Fix "column reference id is ambiguous": the function's own `returns table
-- (id bigint)` output column shadowed sales_records.id in the UPDATE.
create or replace function public.create_sales_record(
  p_outlet_id bigint,
  p_sale_date date,
  p_source text,
  p_file_path text,
  p_items jsonb
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

  update public.sales_records set total_revenue = v_total where sales_records.id = v_sale_id;

  return query select v_sale_id;
end;
$$;
