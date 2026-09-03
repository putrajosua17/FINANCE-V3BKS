import { SkeletonBar, SkeletonCard } from "@/components/Skeleton";

// Skeleton khusus dashboard (KPI + grafik) agar bentuknya menyerupai konten asli.
export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2 space-y-3">
          <SkeletonBar className="h-3 w-32" />
          <SkeletonBar className="h-48 w-full" />
        </div>
        <div className="card space-y-3">
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="h-48 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card space-y-3">
            <SkeletonBar className="h-3 w-28" />
            {Array.from({ length: 5 }).map((_, j) => <SkeletonBar key={j} className="h-4 w-full" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
