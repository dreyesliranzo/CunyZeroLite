"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock } from "lucide-react";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: password }),
    });

    const data = await res.json();
    if (data.success) {
      router.push(data.redirect);
    } else {
      setError(data.error || "Failed to change password.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e2e8f0] flex items-center justify-center px-8 font-sans">
      <div className="w-full max-w-md">
        <div className="rounded-[2.5rem] bg-white border border-slate-300 p-10 text-slate-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-[#0f172a]">
                Change Password
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                Required for first login
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl uppercase tracking-widest">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="w-full rounded-2xl bg-slate-100 border border-slate-200 py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="w-full rounded-2xl bg-slate-100 border border-slate-200 py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                "Set New Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
