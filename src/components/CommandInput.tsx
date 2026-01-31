"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

interface CommandInputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CommandInput({
  onSubmit,
  placeholder = "Enter a request…",
  disabled = false,
}: CommandInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed && !disabled) {
        onSubmit(trimmed);
        setValue("");
      }
    },
    [value, disabled, onSubmit]
  );

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 shadow-inner focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-700 text-zinc-200 transition-colors hover:bg-zinc-600 disabled:opacity-40 disabled:hover:bg-zinc-700"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.form>
  );
}
