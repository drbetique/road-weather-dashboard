"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useContext, useState, ReactNode } from "react";
import { Lang } from "@/lib/translations";

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextType>({
  lang: "fi",
  setLang: () => {},
});

export function useLang() {
  return useContext(LangContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fi");

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <LangContext.Provider value={{ lang, setLang }}>
        {children}
      </LangContext.Provider>
    </ThemeProvider>
  );
}
