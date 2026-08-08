"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ActionButton({
  url, label, confirmText, className,
}: { url: string; label: string; confirmText?: string; className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function go() {
    if (confirmText && !confirm(confirmText)) return;
    setLoading(true);
    await fetch(url, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={go} disabled={loading} className={className ?? "btn-ghost text-xs"}>
      {loading ? "..." : label}
    </button>
  );
}
