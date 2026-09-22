"use client";

import { useRouter } from "next/navigation";

function addDays(date: string, delta: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function DateNav({ date }: { date: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => router.push(`/accounting?date=${addDays(date, -1)}`)}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
      >
        ← Prev
      </button>
      <input
        type="date"
        value={date}
        onChange={(e) => router.push(`/accounting?date=${e.target.value}`)}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={() => router.push(`/accounting?date=${addDays(date, 1)}`)}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
      >
        Next →
      </button>
      <button
        type="button"
        onClick={() => router.push("/accounting")}
        className="text-sm text-blue-600 hover:underline"
      >
        Today
      </button>
    </div>
  );
}
