import type { Translations } from "@/lib/translations";

interface DashboardFooterProps {
  readonly t: Translations;
}

export function DashboardFooter({ t }: DashboardFooterProps) {
  return (
    <footer className="flex shrink-0 items-center justify-center border-t border-line bg-surface-2 px-5 py-2">
      <p className="text-center text-[9px] uppercase leading-relaxed tracking-[0.12em] text-ink-dim">
        {t.footer_project} · {t.footer_institution} · {t.footer_sources}
      </p>
    </footer>
  );
}
