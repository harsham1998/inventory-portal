import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getPurchaseOrderDetail } from "@/lib/purchase-orders";
import { PurchaseOrderDocument } from "@/lib/pdf/PurchaseOrderDocument";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const detail = await getPurchaseOrderDetail(supabase, Number(id));
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { po, outlet, supplier, items } = detail;

  const buffer = await renderToBuffer(
    <PurchaseOrderDocument
      data={{
        poNumber: po.po_number,
        orderDate: po.order_date,
        outlet,
        supplier,
        items: items.map((i) => ({ name: i.item_name, quantity: i.quantity, unit: i.unit })),
        notes: po.notes,
      }}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${po.po_number}.pdf"`,
    },
  });
}
