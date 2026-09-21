export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div>
        <div className="h-7 w-48 rounded bg-zinc-200" />
        <div className="mt-2 h-4 w-80 rounded bg-zinc-100" />
      </div>
      <div className="h-40 rounded-2xl border border-zinc-200 bg-white" />
      <div className="h-64 rounded-2xl border border-zinc-200 bg-white" />
    </div>
  );
}
