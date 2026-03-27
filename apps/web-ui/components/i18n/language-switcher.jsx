"use client";

import { useWebLocale, useWebMessages } from "./web-locale.jsx";

const VARIANTS = {
  dark: {
    iconBackground: "rgba(52, 71, 103, 0.08)",
    iconColor: "#344767",
    labelColor: "#6b7a99",
    switchBackground: "rgba(255, 255, 255, 0.96)",
    switchBorder: "rgba(52, 71, 103, 0.14)",
    shadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    selectedBackground: "#344767",
    selectedColor: "#ffffff",
    unselectedColor: "#344767"
  },
  light: {
    iconBackground: "rgba(255, 255, 255, 0.14)",
    iconColor: "#ffffff",
    labelColor: "rgba(255, 255, 255, 0.78)",
    switchBackground: "rgba(255, 255, 255, 0.12)",
    switchBorder: "rgba(255, 255, 255, 0.2)",
    shadow: "0 18px 38px rgba(15, 23, 42, 0.18)",
    selectedBackground: "#ffffff",
    selectedColor: "#344767",
    unselectedColor: "#ffffff"
  }
};

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "block", height: "1rem", width: "1rem" }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M12 3c2.3 2.4 3.7 5.6 3.7 9s-1.4 6.6-3.7 9c-2.3-2.4-3.7-5.6-3.7-9S9.7 5.4 12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocaleButton({ active, code, colorScheme, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      style={{
        border: 0,
        borderRadius: 999,
        background: active ? colorScheme.selectedBackground : "transparent",
        color: active ? colorScheme.selectedColor : colorScheme.unselectedColor,
        cursor: "pointer",
        fontSize: "0.8rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        minWidth: 46,
        padding: "0.48rem 0.9rem",
        transition: "all 160ms ease"
      }}
    >
      {code}
    </button>
  );
}

export default function LanguageSwitcher({
  className = "",
  compact = false,
  variant = "dark"
}) {
  const { locale, setLocale } = useWebLocale();
  const labels = useWebMessages().common.languageSwitcher;
  const colorScheme = VARIANTS[variant] ?? VARIANTS.dark;

  return (
    <div
      className={`d-flex align-items-center${className ? ` ${className}` : ""}`}
      style={{ gap: compact ? "0.5rem" : "0.65rem" }}
    >
      <div
        aria-hidden="true"
        style={{
          alignItems: "center",
          background: colorScheme.iconBackground,
          borderRadius: 999,
          color: colorScheme.iconColor,
          display: "inline-flex",
          height: compact ? 34 : 38,
          justifyContent: "center",
          width: compact ? 34 : 38
        }}
      >
        <GlobeIcon />
      </div>
      {!compact ? (
        <span
          style={{
            color: colorScheme.labelColor,
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase"
          }}
        >
          {labels.language}
        </span>
      ) : null}
      <div
        role="group"
        aria-label={labels.language}
        style={{
          backdropFilter: "blur(14px)",
          background: colorScheme.switchBackground,
          border: `1px solid ${colorScheme.switchBorder}`,
          borderRadius: 999,
          boxShadow: colorScheme.shadow,
          display: "inline-flex",
          padding: compact ? 4 : 5
        }}
      >
        <LocaleButton
          active={locale === "id"}
          code="ID"
          colorScheme={colorScheme}
          title={labels.indonesian}
          onClick={() => setLocale("id")}
        />
        <LocaleButton
          active={locale === "en"}
          code="EN"
          colorScheme={colorScheme}
          title={labels.english}
          onClick={() => setLocale("en")}
        />
      </div>
    </div>
  );
}
