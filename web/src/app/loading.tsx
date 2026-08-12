export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-navy/10 border-t-teal"
        role="status"
        aria-label="Loading"
      />
      <p className="text-sm font-semibold uppercase tracking-widest text-navy/50 animate-pulse">
        Loading...
      </p>
    </div>
  );
}
