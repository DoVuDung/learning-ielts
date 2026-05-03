"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { messages, type Locale, type Messages } from "./i18n";

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Messages;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  t: messages.en,
});

export function LocaleProvider({
  children,
  initialLocale = "en",
}: Readonly<{ children: React.ReactNode; initialLocale?: Locale }>) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    const stored = localStorage.getItem("app-locale") as Locale | null;
    if (stored === "en" || stored === "vi") setLocale(stored);
  }, []);

  function handleSetLocale(l: Locale) {
    setLocale(l);
    localStorage.setItem("app-locale", l);
  }

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale: handleSetLocale, t: messages[locale] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
