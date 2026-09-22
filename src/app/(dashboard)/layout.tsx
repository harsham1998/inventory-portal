import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/NavLink";
import { signOut } from "./actions";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/menu", label: "Menu" },
  { href: "/sales", label: "Sales" },
  { href: "/accounting", label: "Accounting" },
  { href: "/purchase-orders", label: "Purchase Orders" },
  { href: "/invoices", label: "Supplier Invoices" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/outlets", label: "Outlets" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Middleware already network-validated the session for this request and
  // forwarded the user id via a trusted header — re-checking with another
  // supabase.auth.getUser() call here would just double the auth round-trip
  // on every navigation for no extra safety (middleware already redirects
  // unauthenticated requests before they reach this layout).
  const userId = (await headers()).get("x-user-id");

  if (!userId) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("staff")
    .select("full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (!staff) {
    redirect("/onboarding");
  }

  return (
    <div className="flex flex-1">
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white px-4 py-6">
        <p className="px-2 text-xs font-semibold tracking-widest text-blue-600">STOCKFLOW</p>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-zinc-100 pt-4">
          <p className="px-2 text-sm font-medium text-zinc-700">{staff.full_name}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
