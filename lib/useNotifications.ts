"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardSummary } from "@/types";

/** Reads the current browser grant. Returns "default" during server render. */
function readPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }
  return Notification.permission;
}

export function useNotifications(summary: DashboardSummary | null) {
  // Initialised lazily rather than assigned inside an effect: a synchronous
  // setState in an effect body triggers a second render pass on every mount.
  const [permission, setPermission] =
    useState<NotificationPermission>(readPermission);
  const lastCriticalCount = useRef<number>(0);
  const lastPriorityStation = useRef<string | null>(null);

  // Only the prompt needs an effect; its result arrives asynchronously.
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission().then(setPermission);
    }
  }, []);

  // Watch for new critical situations
  useEffect(() => {
    if (!summary) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const currentCritical = summary.critical_count;
    const currentStation = summary.priority_station;

    // Fire notification only when critical count increases
    if (
      currentCritical > lastCriticalCount.current ||
      (currentCritical > 0 && currentStation !== lastPriorityStation.current)
    ) {
      const title = currentCritical >= 3
        ? `🚨 ${currentCritical} roads need immediate attention`
        : `🚨 Road alert: ${currentStation}`;

      const body = currentCritical >= 3
        ? `${currentCritical} stations require urgent treatment. Open the dashboard to act.`
        : `${currentStation} requires immediate salt treatment. Act before conditions worsen.`;

      try {
        const notification = new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "road-weather-alert",
          requireInteraction: true,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto close after 15s if not interacted
        setTimeout(() => notification.close(), 15000);
      } catch {
        // Notification API not available in this context
      }
    }

    lastCriticalCount.current = currentCritical;
    lastPriorityStation.current = currentStation;
  }, [summary]);

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  return { permission, requestPermission };
}
