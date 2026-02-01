"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface DraggableResizerProps {
  /** Current width of the panel being resized (px) */
  width: number;
  /** Called with new width during drag */
  onResize: (width: number) => void;
  minWidth: number;
  maxWidth: number;
  /** If true, dragging right shrinks the panel (e.g. right sidebar) */
  invert?: boolean;
  className?: string;
}

export function DraggableResizer({
  width,
  onResize,
  minWidth,
  maxWidth,
  invert = false,
  className = "",
}: DraggableResizerProps) {
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      setDragging(true);
    },
    [width]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const sign = invert ? -1 : 1;
      const next = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + sign * delta));
      onResize(next);
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, invert, minWidth, maxWidth, onResize]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onMouseDown={handleMouseDown}
      className={`shrink-0 cursor-col-resize select-none border-zinc-800 bg-zinc-800 transition-colors hover:bg-zinc-600 active:bg-zinc-500 ${dragging ? "bg-zinc-600" : ""} ${className}`}
      style={{ width: "4px", minHeight: "100%" }}
      title="Drag to resize"
    />
  );
}
