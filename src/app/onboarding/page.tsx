import { createClient } from "@/lib/supabase/server";
import { completeOnboarding } from "./actions";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: outlets } = await supabase.from("outlets").select("id, name").order("name");

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-blue-600">STOCKFLOW</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">One more step</h1>
        <p className="mt-1 text-sm text-zinc-500">Tell us who you are to finish setting up your account.</p>

        <form action={completeOnboarding} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">Your name</span>
            <input
              name="full_name"
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">Outlet</span>
            <select
              name="outlet_id"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No outlet yet / admin</option>
              {(outlets ?? []).map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="mt-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
