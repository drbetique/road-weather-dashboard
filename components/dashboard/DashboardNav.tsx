"use client";

import type { Lang, Translations } from "@/lib/translations";
import type { User } from "@/types";

export type DashboardTab = "live" | "history";

interface DashboardNavProps {
  readonly user: User;
  readonly roleLabel: string;
  readonly activeTab: DashboardTab;
  readonly onTabChange: (tab: DashboardTab) => void;
  readonly lang: Lang;
  readonly onLangChange: (lang: Lang) => void;
  readonly isLive: boolean;
  readonly criticalCount: number;
  readonly clock: string;
  readonly onLogout: () => void;
  readonly t: Translations;
}

const SEGMENT_BASE =
  "px-3.5 py-1 text-[9px] uppercase tracking-[0.15em] cursor-pointer border-0 border-b transition-colors";

/**
 * Top navigation.
 *
 * Wraps onto a second row below `md` rather than shrinking: at 52px tall the
 * controls would otherwise collide on a phone.
 */
export function DashboardNav({
  user,
  roleLabel,
  activeTab,
  onTabChange,
  lang,
  onLangChange,
  isLive,
  criticalCount,
  clock,
  onLogout,
  t,
}: DashboardNavProps) {
  return (
    <nav className="sticky top-0 z-100 flex shrink-0 flex-wrap items-center justify-between gap-y-2 border-b border-line bg-surface-2 px-3 py-2 md:h-13 md:flex-nowrap md:px-5 md:py-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center border border-accent">
          <span className="text-base" aria-hidden="true">
            🛣️
          </span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-extrabold tracking-[0.05em] text-ink-bright">
            {t.app_title.toUpperCase()}
          </div>
          <div className="truncate text-[9px] uppercase tracking-[0.1em] text-ink-dim">
            {t.app_subtitle}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <div
          className="flex gap-0.5 border border-line bg-surface-3 p-[3px]"
          role="tablist"
          aria-label={t.app_title}
        >
          {(["live", "history"] as const).map((tab) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onTabChange(tab)}
                className={`${SEGMENT_BASE} ${
                  selected
                    ? "border-b-accent bg-accent-soft text-accent"
                    : "border-b-transparent bg-transparent text-ink-dim hover:text-ink"
                }`}
              >
                {tab === "live" ? `⚡ ${t.live}` : `📊 ${t.history}`}
              </button>
            );
          })}
        </div>

        <div className="flex gap-0.5 border border-line bg-surface-3 p-[3px]">
          {(["en", "fi"] as const).map((option) => {
            const selected = lang === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => onLangChange(option)}
                className={`px-2 py-[3px] text-[9px] uppercase tracking-[0.1em] cursor-pointer border-0 transition-colors ${
                  selected
                    ? "bg-accent-soft text-accent"
                    : "bg-transparent text-ink-dim hover:text-ink"
                }`}
              >
                {option.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/*
          Feed health, not transport. The dashboard always polls, so labelling
          the failure state "POLLING" described the normal mechanism as though
          it were the fault. Stale means the last refresh did not come back,
          and it wears a warning colour so it does not read as ordinary
          dimmed text.
        */}
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-1.5 text-[9px] ${
            isLive ? "text-urgency-monitor" : "text-urgency-standard"
          }`}
        >
          <span
            aria-hidden="true"
            className={`size-[5px] rounded-full ${
              isLive
                ? "animate-pulse bg-urgency-monitor"
                : "bg-urgency-standard"
            }`}
          />
          {(isLive ? t.live : t.status_stale).toUpperCase()}
        </div>

        {criticalCount > 0 && (
          <div
            role="status"
            className="flex items-center gap-1.5 border border-urgency-critical bg-urgency-critical-soft px-2.5 py-1 text-[10px] tracking-[0.1em] text-urgency-critical"
          >
            <span
              aria-hidden="true"
              className="size-1.5 animate-pulse rounded-full bg-urgency-critical"
            />
            {criticalCount} {t.urgency_CRITICAL.toUpperCase()}
          </div>
        )}

        <div className="hidden text-[11px] tracking-[0.08em] text-accent lg:block">
          {clock}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <div className="text-[10px] text-ink-dim">{user.name}</div>
            <div className="text-[8px] text-ink-dim opacity-60">{roleLabel}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="cursor-pointer border border-line bg-transparent px-2 py-[3px] text-[9px] tracking-[0.1em] text-ink-dim transition-colors hover:border-accent hover:text-accent"
          >
            {t.logout.toUpperCase()}
          </button>
        </div>
      </div>
    </nav>
  );
}
