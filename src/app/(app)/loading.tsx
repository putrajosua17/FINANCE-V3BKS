import PageSkeleton from "@/components/Skeleton";

// Fallback instan untuk seluruh halaman di grup (app). Muncul seketika saat
// berpindah menu sementara server menyiapkan data — transisi terasa responsif.
export default function Loading() {
  return <PageSkeleton />;
}
