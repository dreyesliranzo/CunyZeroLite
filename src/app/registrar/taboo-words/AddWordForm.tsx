"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { addTabooWord } from "./actions";

type ActionResult = { success: boolean; error?: string };
const INITIAL: ActionResult = { success: false };

export default function AddWordForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => addTabooWord(formData),
    INITIAL,
  );

  useEffect(() => {
    if (state.success) {
      if (inputRef.current) inputRef.current.value = "";
      inputRef.current?.focus();
    }
  }, [state]);

  return (
    <form action={formAction} className="flex items-stretch gap-2">
      <input
        ref={inputRef}
        name="word"
        placeholder="add a word…"
        required
        maxLength={50}
        autoComplete="off"
        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
      />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg bg-[#0f172a] px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-[#1e293b] disabled:opacity-50"
      >
        <Plus size={14} /> Add
      </button>
      {state.error && (
        <p className="self-center pl-2 text-xs font-bold text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
