"use client";
import { useState } from "react";
import Link from "next/link";
import { GraduationCap, ChevronRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="relative z-50 bg-[#0f172a] text-white shadow-xl border-b border-white/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase leading-none">Cuny<span className="text-blue-500">Zero</span>Lite</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-blue-300 font-bold opacity-80 mt-1">Institutional Technology</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-10 md:flex">
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Home</Link>
          <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Catalog</Link>
          <Link href="/login" className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-black uppercase text-blue-950 transition-all hover:scale-[1.02] shadow-lg">
            Student Login <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-slate-400 hover:text-white">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-[#0f172a] border-b border-white/10 p-8 flex flex-col gap-6 md:hidden shadow-2xl"
          >
            <Link href="/" onClick={() => setIsOpen(false)} className="text-sm font-bold uppercase tracking-widest">Home</Link>
            <Link href="/login" onClick={() => setIsOpen(false)} className="text-sm font-bold uppercase tracking-widest">Catalog</Link>
            <Link href="/login" onClick={() => setIsOpen(false)} className="rounded-xl bg-blue-600 px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-white shadow-lg">
              Student Login
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}