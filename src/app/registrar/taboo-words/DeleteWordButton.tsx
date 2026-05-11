"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTabooWord } from "./actions";

export default function DeleteWordButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const fd = new FormData();
          fd.set("id", String(id));
          await deleteTabooWord(fd);
        });
      }}
      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      aria-label="Delete"
    >
      <Trash2 size={14} />
    </button>
  );
}
