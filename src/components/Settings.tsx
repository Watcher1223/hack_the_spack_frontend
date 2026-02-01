"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  KeyRound,
  Bell,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { ApiAccess } from "./ApiAccess";

/** Mock doc-update event for timeline slider (replace with API when available) */
export interface DocUpdateEvent {
  id: string;
  toolName: string;
  label: string;
  date: string;
  type: "api_update" | "docs_update" | "new_version";
}

const MOCK_DOC_UPDATES: DocUpdateEvent[] = [
  { id: "1", toolName: "OpenWeatherMap", label: "API docs updated", date: "2025-01-28", type: "docs_update" },
  { id: "2", toolName: "Stripe", label: "New API version", date: "2025-01-27", type: "api_update" },
  { id: "3", toolName: "GitHub", label: "REST API changelog", date: "2025-01-25", type: "docs_update" },
  { id: "4", toolName: "Slack", label: "Methods reference updated", date: "2025-01-24", type: "docs_update" },
  { id: "5", toolName: "USGS Streamflow", label: "Documentation refreshed", date: "2025-01-22", type: "docs_update" },
  { id: "6", toolName: "Firecrawl", label: "New endpoints", date: "2025-01-20", type: "new_version" },
];

const SECTION_IDS = ["api", "alerts", "timeline"] as const;

export function Settings() {
  const [activeSection, setActiveSection] = useState<(typeof SECTION_IDS)[number]>("api");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [alertsToolUpdates, setAlertsToolUpdates] = useState(true);
  const [alertsDocUpdates, setAlertsDocUpdates] = useState(true);
  const [alertsNewTools, setAlertsNewTools] = useState(false);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const scrollTimeline = (dir: "left" | "right") => {
    const el = timelineScrollRef.current;
    if (!el) return;
    const step = 280;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-12">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 ring-1 ring-zinc-700">
          <SettingsIcon className="h-5 w-5 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
          <p className="text-sm text-zinc-500">API access, alerts, and documentation timeline</p>
        </div>
      </div>

      {/* In-page nav */}
      <nav className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        {[
          { id: "api" as const, label: "API access", icon: KeyRound },
          { id: "alerts" as const, label: "Subscribe for alerts", icon: Bell },
          { id: "timeline" as const, label: "Doc timeline", icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActiveSection(id);
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeSection === id
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Section: API access */}
      <section id="api" className="scroll-mt-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-200">
          <KeyRound className="h-5 w-5 text-zinc-400" />
          API access
        </h2>
        <ApiAccess />
      </section>

      {/* Section: Subscribe for alerts */}
      <section id="alerts" className="scroll-mt-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-200">
          <Bell className="h-5 w-5 text-zinc-400" />
          Subscribe for alerts
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          Get email when tool APIs or documentation change so you can track live updates.
        </p>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          {!subscribed ? (
            <>
              <label className="block text-sm font-medium text-zinc-300">Email</label>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (email.trim()) setSubscribed(true);
                  }}
                  disabled={!email.trim()}
                  className="rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-50"
                >
                  Subscribe
                </button>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-zinc-500">Notify me about</p>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={alertsToolUpdates}
                    onChange={(e) => setAlertsToolUpdates(e.target.checked)}
                    className="rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  Tool API updates
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={alertsDocUpdates}
                    onChange={(e) => setAlertsDocUpdates(e.target.checked)}
                    className="rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  Documentation changes
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={alertsNewTools}
                    onChange={(e) => setAlertsNewTools(e.target.checked)}
                    className="rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  New tools added to marketplace
                </label>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-800/50 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-300">
              <Check className="h-4 w-4 shrink-0" />
              <span>Subscribed with {email}. We’ll email you about tool API and doc updates.</span>
              <button
                type="button"
                onClick={() => setSubscribed(false)}
                className="ml-auto text-xs text-zinc-400 hover:text-zinc-300"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Section: Documentation updated timeline (slider) */}
      <section id="timeline" className="scroll-mt-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-200">
          <FileText className="h-5 w-5 text-zinc-400" />
          Documentation updated timeline
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          Browse recent API and documentation updates. Slide to see more.
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollTimeline("left")}
            aria-label="Scroll timeline left"
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg hover:bg-zinc-800 hover:text-zinc-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollTimeline("right")}
            aria-label="Scroll timeline right"
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg hover:bg-zinc-800 hover:text-zinc-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div
            ref={timelineScrollRef}
            className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 pt-1"
            style={{ scrollSnapType: "x proximity" }}
          >
            {MOCK_DOC_UPDATES.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="min-w-[260px] shrink-0 snap-start rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-500">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      event.type === "api_update"
                        ? "bg-amber-500/20 text-amber-400"
                        : event.type === "new_version"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {event.type === "api_update" ? "API" : event.type === "new_version" ? "New" : "Docs"}
                  </span>
                </div>
                <p className="mt-2 font-mono text-sm font-medium text-zinc-200">{event.toolName}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{event.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
