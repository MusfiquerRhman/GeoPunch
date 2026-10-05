export default function PageLoading() {
  return (
    <div className="flex min-h-56 w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm" role="status" aria-label="Loading page">
      <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-10 w-full max-w-sm animate-pulse rounded-lg bg-gray-100" />
      <div className="space-y-3 pt-2">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-4">
            <div className="h-8 flex-1 animate-pulse rounded bg-gray-100" />
            <div className="h-8 flex-1 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-20 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
