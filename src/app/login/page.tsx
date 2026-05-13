"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  ChevronRight, 
  ShieldCheck, 
  ArrowLeft 
} from "lucide-react";

export default function LoginPage() {
  // 1. Combined Logic: Friend's form state + Our loading state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // 2. Friend's Change Handler
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // 3. Login logic — calls server action and redirects by role
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const { loginUser } = await import("./actions");
    const result = await loginUser(formData.username, formData.password);

    if (!result.success) {
      setErrorMessage(result.error || "Login failed.");
      setIsLoading(false);
      return;
    }

    router.push(result.redirect || "/dashboard");
  };

  return (
    <main className="min-h-screen bg-[#e2e8f0] text-[#0f172a] font-sans selection:bg-blue-100 relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]" 
           style={{ backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />

      {/* Header (Same as before) */}
      <header className="relative z-10 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase leading-none">Cuny<span className="text-blue-500">Zero</span>Lite</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue-300 font-bold opacity-80 mt-1">Institutional Technology</p>
            </div>
          </div>
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Login Container */}
      <section className="relative z-10 flex items-center justify-center px-8 py-20">
        <div className="max-w-[1000px] w-full grid lg:grid-cols-[1fr_450px] gap-8 items-stretch">
          
          {/* Left Panel: The Skyline Image (Kept exactly as is) */}
          <div className="relative hidden lg:flex flex-col justify-end p-12 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-300">
            <Image src="/image-cuny3.jpg" alt="CUNY Skyline" fill sizes="(max-width: 1024px) 0vw, 50vw" className="object-cover" />
            <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-[2px]" />
            <div className="relative z-10 text-white">
              <span className="bg-blue-600 px-3 py-1 rounded text-[9px] font-black tracking-widest uppercase mb-4 inline-block">Secure Gateway</span>
              <h2 className="text-4xl font-black tracking-tighter leading-none mb-4">Official Student <br /> Authentication</h2>
              <p className="text-slate-300 text-sm font-bold opacity-80 leading-relaxed">Connect to the CUNY network and manage your academic future securely.</p>
            </div>
          </div>

          {/* Right Side: The White Login Card (Integrated Friend's Inputs) */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-[2.5rem] bg-blue-600/20 blur-2xl opacity-50 transition-opacity" />
            <div className="relative rounded-[2.5rem] bg-white border border-slate-300 p-10 text-slate-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)]">
              
              <div className="mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tight text-[#0f172a]">Sign In</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Authorized Access Only</p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl uppercase tracking-widest">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      name="username" // Matches friend's state key
                      value={formData.username}
                      onChange={handleChange}
                      required 
                      placeholder="username@cuny.edu"
                      className="w-full rounded-2xl bg-slate-100 border border-slate-200 py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      name="password" // Matches friend's state key
                      value={formData.password}
                      onChange={handleChange}
                      required 
                      placeholder="••••••••"
                      className="w-full rounded-2xl bg-slate-100 border border-slate-200 py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                    />
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
                      Authenticating...
                    </span>
                  ) : (
                    <>Access Dashboard <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" /></>
                  )}
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No account? <Link href="/apply" className="text-blue-700">Apply for Admission</Link></p>
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