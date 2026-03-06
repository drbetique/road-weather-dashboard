"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useLang } from "@/components/providers/Providers";
import { translations } from "@/lib/translations";
import { DashboardSummary } from "@/types";

interface AlertBannerProps {
  summary: DashboardSummary | null;
}

export function AlertBanner({ summary }: AlertBannerProps) {
  const { lang } = useLang();
  const t = translations[lang];

  const show = summary && summary.critical_count > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-red-50 dark:bg-red-950 border-l-4 border-red-500 rounded-r-lg p-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={22} />
            <div>
              <p className="font-bold text-red-700 dark:text-red-400">
                {t.priority_alert}
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                {summary.critical_count} {t.stations_require_attention}.{" "}
                {summary.priority_station && (
                  <>
                    {t.priority}: {summary.priority_station}
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
