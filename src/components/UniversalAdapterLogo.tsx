"use client";

interface UniversalAdapterLogoProps {
  className?: string;
  size?: number;
}

/**
 * Logo mark for Universal Adapter: two nodes (APIs / agents) connected by an adapter bridge.
 * Works on dark backgrounds; amber accent for brand.
 */
export function UniversalAdapterLogo({ className = "", size = 36 }: UniversalAdapterLogoProps) {
  const pad = size * 0.14;
  const nodeR = size * 0.2;
  const cx1 = pad + nodeR;
  const cx2 = size - pad - nodeR;
  const cy = size / 2;
  const bridgeW = cx2 - cx1 - nodeR * 2;
  const bridgeH = size * 0.2;
  const bridgeX = cx1 + nodeR;
  const bridgeY = cy - bridgeH / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Left node — API / system (white) */}
      <circle cx={cx1} cy={cy} r={nodeR} fill="currentColor" className="text-white" />
      {/* Right node — agent / consumer (white) */}
      <circle cx={cx2} cy={cy} r={nodeR} fill="currentColor" className="text-white" />
      {/* Adapter bridge (rounded bar) */}
      <rect
        x={bridgeX}
        y={bridgeY}
        width={bridgeW}
        height={bridgeH}
        rx={bridgeH / 2}
        fill="currentColor"
        className="text-zinc-400"
      />
    </svg>
  );
}
