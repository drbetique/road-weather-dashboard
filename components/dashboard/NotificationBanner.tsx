"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X } from "lucide-react";
import { useState } from "react";

interface NotificationBannerProps {
  permission: NotificationPermission;
  onRequest: () => void;
}

export function NotificationBanner({ permission, onRequest }: NotificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (permission === "granted" || permission === "denied" || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl"
        style={{
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.25)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <Bell size={14} style={{ color: "#60a5fa" }} />
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Enable browser notifications to receive alerts when roads need immediate attention.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRequest}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", color: "#60a5fa" }}
          >
            Enable alerts
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg transition-all"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={12} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
