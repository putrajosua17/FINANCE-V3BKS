import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import NavProgress from "@/components/NavProgress";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-ink-950">
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Suspense fallback={<div className="h-14 border-b border-white/5" />}>
          <Header userName={session.nama} showPeriod />
        </Suspense>
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
