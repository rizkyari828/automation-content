"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { GENERATED_MESSAGES } from "./generated-messages.js";

const STORAGE_KEY = "automation-content.web.locale";
const SUPPORTED_LOCALES = ["en", "id"];

const WebLocaleContext = createContext(null);

function normalizeLocale(value) {
  if (typeof value !== "string") {
    return "en";
  }

  const normalized = value.toLowerCase();

  if (normalized.startsWith("id")) {
    return "id";
  }

  return "en";
}

export function WebLocaleProvider({ children }) {
  const [locale, setLocaleState] = useState("en");

  useEffect(() => {
    const savedLocale = normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
    const browserLocale = normalizeLocale(window.navigator.language);
    const nextLocale = SUPPORTED_LOCALES.includes(savedLocale) ? savedLocale : browserLocale;

    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale(nextLocale) {
        setLocaleState(normalizeLocale(nextLocale));
      }
    }),
    [locale]
  );

  return <WebLocaleContext.Provider value={value}>{children}</WebLocaleContext.Provider>;
}

export function useWebLocale() {
  const context = useContext(WebLocaleContext);

  if (!context) {
    throw new Error("useWebLocale must be used within WebLocaleProvider");
  }

  return context;
}

export function useWebMessages() {
  const { locale } = useWebLocale();
  return GENERATED_MESSAGES[locale];
}

export function formatWebMessage(template, values = {}) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{{${key}}}`, String(value)),
    template
  );
}
