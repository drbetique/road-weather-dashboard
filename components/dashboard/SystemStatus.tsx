"use client";

import type { Translations } from "@/lib/translations";

interface SystemStatusProps {
  readonly isLive: boolean;
  readonly loading: boolean;
  readonly lastUpdated: string;
  readonly t: Translations;
}

export function SystemStatus({
  isLive,
  loading,
  lastUpdated,
  t,
}: SystemStatusProps) {
  // "Live feed" rather than "WebSocket": the dashboard polls through the
  // Next.js proxy now, so the old label described a transport that is gone.
  const services = [
    { label: "API", ok: true },
    { label: "Live feed", ok: isLive },
    { label: "Database", ok: !loading },
  ] as const;

  return (
    <div className="shrink-0 border-t border-line p-3">
      <h3 className="mb-1.5 text-[9px] uppercase tracking-[0.12em] text-ink-dim">
        {t.status}
      </h3>

      <ul>
        {services.map((service) => (
          <li
            key={service.label}
            className="mb-1 flex items-center justify-between text-[10px]"
          >
            <span className="flex items-center gap-1.5 text-ink-dim">
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${
                  service.ok ? "bg-urgency-monitor" : "bg-urgency-standard"
                }`}
              />
              {service.label}
            </span>
            <span
              className={`text-[9px] ${
                service.ok ? "text-urgency-monitor" : "text-urgency-standard"
              }`}
            >
              {service.ok ? "ONLINE" : "SYNC"}
            </span>
          </li>
        ))}
      </ul>

      {lastUpdated && (
        <p className="mt-1.5 text-[8px] tracking-[0.08em] text-ink-dim">
          {t.last_updated.toUpperCase()} {lastUpdated}
        </p>
      )}
    </div>
  );
}
