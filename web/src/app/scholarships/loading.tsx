export default function ScholarshipsLoading() {
  return (
    <>
      {/* Header skeleton */}
      <section className="bg-foreground py-10 text-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-4 w-32 animate-pulse rounded bg-foreground/10" />
          <div className="mt-4 h-8 w-64 animate-pulse rounded bg-foreground/10 sm:w-96" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-foreground/10" />
          <div className="mt-5 max-w-2xl">
            <div className="h-12 w-full animate-pulse rounded-2xl bg-foreground/10" />
          </div>
        </div>
      </section>

      {/* Main content skeleton */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar skeleton */}
          <aside className="lg:col-span-1">
            <div className="space-y-5 rounded-2xl bg-background p-4 border border-border hidden md:block">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="mt-4 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-full animate-pulse rounded bg-muted" />
                  <div className="h-6 w-full animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </aside>

          {/* Cards skeleton */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex h-64 flex-col gap-3 rounded-xl border border-border bg-foreground/10 p-5 shadow-sm"
                >
                  <div className="flex justify-between">
                    <div className="h-6 w-10 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-16 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="mt-auto h-10 w-full animate-pulse rounded-lg bg-teal/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
