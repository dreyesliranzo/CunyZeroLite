"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors cursor-pointer"
    >
      <LogOut size={14} /> Sign Out
    </button>
  );
}
