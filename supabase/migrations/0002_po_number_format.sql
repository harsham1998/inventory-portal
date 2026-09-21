-- PO number format: PO-<DDMMYYYY>-<seq, 3 digits>, e.g. PO-21092026-003.
-- Keeps using the existing po_number_seq (not reset), so numbers keep
-- climbing across days rather than restarting daily.
create or replace function private.set_po_number()
returns trigger
language plpgsql
as $$
begin
  if new.po_number is null then
    new.po_number := 'PO-' || to_char(now(), 'DDMMYYYY') || '-' || lpad(nextval('public.po_number_seq')::text, 3, '0');
  end if;
  return new;
end;
$$;
