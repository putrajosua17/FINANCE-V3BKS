// Skeleton primitives untuk fallback loading.tsx — memberi umpan balik instan
// saat berpindah menu (halaman dinamis) sehingga transisi tidak terasa "beku".

export function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-ink-800 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <SkeletonBar className="h-3 w-24" />
      <SkeletonBar className="h-6 w-32" />
      <SkeletonBar className="h-2 w-20" />
    </div>
  );
}

/** Skeleton generik: judul + grid kartu + tabel. Cocok untuk mayoritas halaman. */
export default function PageSkeleton({ cards = 4, rows = 6 }: { cards?: number; rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SkeletonBar className="h-5 w-48" />
        <SkeletonBar className="h-3 w-64" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: cards }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="card space-y-3">
        <SkeletonBar className="h-3 w-32" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <SkeletonBar className="h-4 flex-1" />
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
