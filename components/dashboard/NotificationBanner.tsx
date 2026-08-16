"use client";

import { Bell, X } from "lucide-react";
import { useState } from "react";

interface NotificationBannerProps {
  readonly permission: NotificationPermission;
  readonly onRequest: () => void;
}

export function NotificationBanner({
  permission,
  onRequest,
}: NotificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (permission === "granted" || permission === "denied" || dismissed) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-urgency-monitor bg-urgency-monitor-soft px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Bell size={14} className="shrink-0 text-urgency-monitor" aria-hidden="true" />
        <p className="text-xs text-ink">
          Enable browser notifications to receive alerts when roads need
          immediate attention.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onRequest}
          className="cursor-pointer border border-urgency-monitor bg-urgency-monitor-soft px-3 py-1 text-xs font-medium text-urgency-monitor transition-colors hover:bg-surface-3"
        >
          Enable alerts
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="cursor-pointer p-1 text-ink-dim transition-colors hover:text-ink"
        >
          <X size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
