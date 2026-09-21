import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type PurchaseOrderPdfData = {
  poNumber: string;
  orderDate: string;
  outlet: {
    name: string;
    address: string | null;
    gstin: string | null;
    phone: string | null;
    email: string | null;
  };
  supplier: {
    name: string;
    address: string | null;
    gstin: string | null;
    phone: string | null;
    email: string | null;
  };
  items: { name: string; quantity: number; unit: string }[];
  notes: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  eyebrow: { fontSize: 9, letterSpacing: 2, color: "#2563eb", fontFamily: "Helvetica-Bold" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 2, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  metaBlock: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, marginBottom: 14 },
  label: { color: "#6b7280", fontSize: 8, marginBottom: 2 },
  value: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  partyBlock: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  partyCol: { width: "48%" },
  partyHeading: { fontSize: 8, color: "#6b7280", marginBottom: 4, letterSpacing: 1 },
  partyName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  partyLine: { fontSize: 9, color: "#374151", marginBottom: 1 },
  table: { marginTop: 6, borderTopWidth: 1, borderTopColor: "#2563eb" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  colIdx: { width: "8%" },
  colName: { width: "62%" },
  colQty: { width: "15%", textAlign: "right" },
  colUnit: { width: "15%", textAlign: "right" },
  notes: { marginTop: 16, fontSize: 9, color: "#374151" },
  signatureRow: { marginTop: 56, flexDirection: "row", justifyContent: "space-between" },
  signatureBox: { width: "40%", borderTopWidth: 1, borderTopColor: "#9ca3af", paddingTop: 4, fontSize: 8, color: "#6b7280" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 8, color: "#9ca3af", textAlign: "center" },
});

export function PurchaseOrderDocument({ data }: { data: PurchaseOrderPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>PURCHASE ORDER</Text>
        <Text style={styles.title}>{data.outlet.name}</Text>

        <View style={styles.metaBlock}>
          <View>
            <Text style={styles.label}>PO Number</Text>
            <Text style={styles.value}>{data.poNumber}</Text>
          </View>
          <View>
            <Text style={styles.label}>Order Date</Text>
            <Text style={styles.value}>{data.orderDate}</Text>
          </View>
        </View>

        <View style={styles.partyBlock}>
          <View style={styles.partyCol}>
            <Text style={styles.partyHeading}>ORDERED BY</Text>
            <Text style={styles.partyName}>{data.outlet.name}</Text>
            {data.outlet.address ? <Text style={styles.partyLine}>{data.outlet.address}</Text> : null}
            {data.outlet.gstin ? <Text style={styles.partyLine}>GSTIN: {data.outlet.gstin}</Text> : null}
            {data.outlet.phone ? <Text style={styles.partyLine}>Phone: {data.outlet.phone}</Text> : null}
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.partyHeading}>SUPPLIER</Text>
            <Text style={styles.partyName}>{data.supplier.name}</Text>
            {data.supplier.address ? <Text style={styles.partyLine}>{data.supplier.address}</Text> : null}
            {data.supplier.gstin ? <Text style={styles.partyLine}>GSTIN: {data.supplier.gstin}</Text> : null}
            {data.supplier.phone ? <Text style={styles.partyLine}>Phone: {data.supplier.phone}</Text> : null}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colIdx}>#</Text>
            <Text style={styles.colName}>Item</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnit}>Unit</Text>
          </View>
          {data.items.map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.colIdx}>{idx + 1}</Text>
              <Text style={styles.colName}>{item.name}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
            </View>
          ))}
        </View>

        {data.notes ? (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        ) : null}

        <View style={styles.signatureRow}>
          <Text style={styles.signatureBox}>Authorized Signatory ({data.outlet.name})</Text>
          <Text style={styles.signatureBox}>Received By ({data.supplier.name})</Text>
        </View>

        <Text style={styles.footer}>Generated purchase order request — not a tax invoice.</Text>
      </Page>
    </Document>
  );
}
