"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

const MIN_ROWS = 1;
const MAX_HEIGHT_PX = 200;

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const h = Math.min(el.scrollHeight, MAX_HEIGHT_PX);
    el.style.height = `${h}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed && !disabled) {
          onSubmit(trimmed);
          setValue("");
        }
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
      <div className="flex items-end gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 shadow-inner focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={MIN_ROWS}
          className="min-h-[2.5rem] max-h-[200px] flex-1 resize-none overflow-y-auto bg-transparent py-2 text-zinc-100 placeholder-zinc-500 outline-none disabled:opacity-50 scrollbar-thin"
          style={{ minHeight: "2.5rem" }}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-700 text-zinc-200 transition-colors hover:bg-zinc-600 disabled:opacity-40 disabled:hover:bg-zinc-700"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.form>
  );
}
