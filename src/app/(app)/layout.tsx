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
    <div className="v3-shell flex min-h-screen bg-transparent">
      <div className="v3-orb -top-32 right-[8%] h-72 w-72 bg-brand-green/10" />
      <div className="v3-orb bottom-[10%] left-[18%] h-64 w-64 bg-[#d9ff55]/[0.035]" />
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>
      <Sidebar role={session.role} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Suspense fallback={<div className="h-16 border-b border-white/[0.06]" />}>
          <Header userName={session.nama} role={session.role} showPeriod />
        </Suspense>
        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-24">
          <div className="mx-auto w-full max-w-[1680px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
