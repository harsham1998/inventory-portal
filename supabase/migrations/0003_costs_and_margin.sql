-- Purchase/selling cost per inventory item (margin is derived client-side,
-- not stored). Estimated unit cost is snapshotted onto each PO line item
-- (same pattern as item_name) so a later change to an item's purchase cost
-- doesn't retroactively change the estimated total on past POs.

alter table public.inventory_items
  add column purchase_cost numeric(12, 2),
  add column selling_cost numeric(12, 2);

alter table public.purchase_order_items
  add column estimated_unit_cost numeric(12, 2);

-- Recreate create_purchase_order to also accept + store estimated_unit_cost
-- per line item.
create or replace function public.create_purchase_order(
  p_outlet_id bigint,
  p_supplier_id bigint,
  p_order_date date,
  p_notes text,
  p_items jsonb -- [{item_id, name, unit, quantity, unit_cost}, ...]
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

    insert into public.purchase_order_items (po_id, item_id, item_name, quantity, unit, estimated_unit_cost)
    values (
      v_po_id,
      v_item_id,
      v_item ->> 'name',
      (v_item ->> 'quantity')::numeric,
      v_item ->> 'unit',
      nullif(v_item ->> 'unit_cost', '')::numeric
    );
  end loop;

  return query select v_po_id, v_po_number;
end;
$$;
