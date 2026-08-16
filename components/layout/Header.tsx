"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/providers/Providers";
import { translations } from "@/lib/translations";
import { User } from "@/types";

interface HeaderProps {
  user: User;
  isLive: boolean;
  lastUpdated: string;
}

export function Header({ user, isLive, lastUpdated }: HeaderProps) {
  const { lang, setLang } = useLang();
  const t = translations[lang];
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  const roleLabel = {
    admin: t.role_admin,
    operator: t.role_operator,
    viewer: t.role_viewer,
  }[user.role];

  const roleColor = {
    admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    operator: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    viewer: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  }[user.role];

  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-700 dark:from-gray-900 dark:to-gray-800 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛣️</span>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t.app_title}</h1>
              <p className="text-blue-200 dark:text-gray-400 text-xs">{t.app_subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isLive && (
              <div className="flex items-center gap-1 text-xs text-green-300">
                <Wifi size={12} className="animate-pulse" />
                <span>{t.live}</span>
              </div>
            )}
            {lastUpdated && (
              <span className="text-xs text-blue-200 hidden sm:block">
                {t.last_updated}: {lastUpdated}
              </span>
            )}

            <div className="flex items-center gap-1 bg-blue-950/50 dark:bg-gray-700/50 rounded-lg p-1">
              <button
                onClick={() => setLang("fi")}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${lang === "fi" ? "bg-white text-blue-900" : "text-blue-200 hover:text-white"}`}
              >
                🇫🇮 FI
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${lang === "en" ? "bg-white text-blue-900" : "text-blue-200 hover:text-white"}`}
              >
                🇬🇧 EN
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-white hover:bg-blue-800 dark:hover:bg-gray-700 h-8 w-8"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium">{user.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-white hover:bg-blue-800 dark:hover:bg-gray-700 h-8 w-8"
                title={t.logout}
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
