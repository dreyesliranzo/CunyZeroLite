
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquareText,
  User as UserIcon, // Renamed to avoid conflict with potential User type
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { fileComplaint } from "@/src/app/complaints/file_complaint"; // Assuming this path

export default function StudentToolsPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // TODO: Replace with actual authenticated user's ID and role from session
  const currentUserId = 1; // Placeholder for authenticated student's ID
  const currentUserRole = "STUDENT"; // Placeholder for authenticated student's role

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    if (!description.trim()) {
      setErrorMessage("Complaint description cannot be empty.");
      setIsLoading(false);
      return;
    }

    const parsedTargetId = parseInt(targetUserId, 10);
    if (isNaN(parsedTargetId)) {
      setErrorMessage("Target User ID must be a valid number.");
      setIsLoading(false);
      return;
    }

    if (currentUserId === parsedTargetId) {
      setErrorMessage("You cannot file a complaint against yourself.");
      setIsLoading(false);
      return;
    }

    const result = await fileComplaint(
      currentUserId,
      parsedTargetId,
      description,
      currentUserRole,
    );

    if (result.success && result.message) {
      setSuccessMessage(result.message);
      setDescription("");
      setTargetUserId("");
      // Optionally, refresh the page or redirect
      // router.refresh();
    } else {
      setErrorMessage(result.error || "An unknown error occurred.");
    }
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#e2e8f0] text-[#0f172a] font-sans selection:bg-blue-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]"
           style={{ backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />

      {/* Header (Similar to login page) */}
      <header className="relative z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
              <MessageSquareText size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase leading-none">Cuny<span className="text-blue-500">Zero</span>Lite</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue-300 font-bold opacity-80 mt-1">Student Complaints</p>
            </div>
          </div>
          <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Complaint Form Container */}
      <section className="relative z-10 flex items-center justify-center px-8 py-20">
        <div className="max-w-[600px] w-full">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-[2.5rem] bg-blue-600/20 blur-2xl opacity-50 transition-opacity" />
            <div className="relative rounded-[2.5rem] bg-white border border-slate-300 p-10 text-slate-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)]">

              <div className="mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tight text-[#0f172a]">File a Complaint</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Your concerns matter</p>
              </div>

              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-xl uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle size={16} /> {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl uppercase tracking-widest flex items-center gap-2">
                  <XCircle size={16} /> {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="targetUserId" className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">
                    Complaint Against User ID
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      id="targetUserId"
                      type="text" // Using text for now, will parse to int
                      name="targetUserId"
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      required
                      placeholder="e.g., 123 for an instructor or student"
                      className="w-full rounded-2xl bg-slate-100 border border-slate-200 py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">
                    Complaint Description
                  </label>
                  <div className="relative">
                    <textarea
                      id="description"
                      name="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={6}
                      placeholder="Clearly describe your complaint here..."
                      className="w-full rounded-2xl bg-slate-100 border border-slate-200 py-4 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm resize-y"
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-70 disabled:translate-y-0"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <>Submit Complaint <Send size={16} className="transition-transform group-hover:translate-x-1" /></>
                  )}
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Need help? <Link href="/support" className="text-blue-700">Contact Support</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 bg-[#e2e8f0] py-12 px-8 border-t border-slate-300">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
          <p>© 2026 CUNYZEROLITE — Institutional Technology</p>
          <div className="flex gap-10 mt-6 md:mt-0">
             <Link href="#" className="hover:text-[#0f172a] transition-colors">Privacy</Link>
             <Link href="#" className="hover:text-[#0f172a] transition-colors">Security</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}