"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import LanguageSwitcher from "../i18n/language-switcher.jsx";
import { useWebLocale, useWebMessages } from "../i18n/web-locale.jsx";
import AuthShell from "./auth-shell.jsx";
import styles from "./auth-page.module.css";

const FORGOT_PASSWORD_SHOWCASE = {
  en: {
    badge: "Account recovery",
    title: "Recover access without losing momentum in the content workflow.",
    body:
      "The reset flow is intentionally short so operators can return to their workspace quickly and keep campaign execution moving.",
    metrics: [
      { value: "2", label: "main recovery steps" },
      { value: "1", label: "OTP path via email" },
      { value: "< 1", label: "minute to request" }
    ],
    stories: [
      {
        title: "Less support friction",
        body: "Operators can recover access directly in product instead of waiting on long manual follow-up."
      },
      {
        title: "Clear reset flow",
        body: "Request code, verify, set a fresh password, and return to the workspace with minimal detours."
      }
    ],
    statuses: [
      "Request recovery code",
      "Verify the OTP from email",
      "Set a new password securely"
    ],
    footer: "A clean recovery path is part of a professional product experience."
  },
  id: {
    badge: "Recovery akun",
    title: "Pulihkan akses tanpa kehilangan momentum di workflow konten.",
    body:
      "Flow reset dibuat sesingkat mungkin supaya operator bisa cepat kembali ke workspace dan menjaga eksekusi campaign tetap jalan.",
    metrics: [
      { value: "2", label: "langkah recovery inti" },
      { value: "1", label: "jalur OTP via email" },
      { value: "< 1", label: "menit untuk request" }
    ],
    stories: [
      {
        title: "Friksi support lebih rendah",
        body: "Operator bisa memulihkan akses langsung di produk tanpa menunggu follow-up manual yang panjang."
      },
      {
        title: "Alur reset jelas",
        body: "Minta kode, verifikasi OTP, pasang password baru, lalu kembali ke workspace tanpa banyak muter."
      }
    ],
    statuses: [
      "Minta kode recovery",
      "Verifikasi OTP dari email",
      "Pasang password baru dengan aman"
    ],
    footer: "Jalur recovery yang bersih adalah bagian dari pengalaman produk yang profesional."
  }
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const copy = useWebMessages().web.forgotPasswordPage;
  const { locale } = useWebLocale();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState("request");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    email: "",
    newPassword: ""
  });
  const showcase = FORGOT_PASSWORD_SHOWCASE[locale] ?? FORGOT_PASSWORD_SHOWCASE.en;

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function requestCode(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    startTransition(async () => {
      const response = await fetch("/api/auth/forgot-password/request", {
        body: JSON.stringify({ email: form.email }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? copy.requestFallbackError);
        return;
      }

      setNotice(payload?.message ?? copy.requestSuccess);
      setStep("reset");
    });
  }

  function resetPassword(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    startTransition(async () => {
      const response = await fetch("/api/auth/forgot-password/reset", {
        body: JSON.stringify(form),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? copy.resetFallbackError);
        return;
      }

      setNotice(payload?.message ?? copy.resetSuccess);

      window.setTimeout(() => {
        router.push("/sign-in");
      }, 900);
    });
  }

  return (
    <AuthShell includeStickyContainer>
      <section className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.grid}>
            <div className={styles.formCard}>
              <div className={styles.languageRow}>
                <LanguageSwitcher compact variant="dark" />
              </div>

              <span className={styles.formEyebrow}>{copy.title}</span>
              <h1 className={styles.formTitle}>{copy.sideTitle}</h1>
              <p className={styles.formSubtitle}>{copy.subtitle}</p>

              <form
                onSubmit={step === "request" ? requestCode : resetPassword}
                className={styles.formSection}
              >
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder={copy.email}
                    aria-label={copy.email}
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                  />
                </div>
                {step === "reset" ? (
                  <>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={copy.code}
                        aria-label={copy.code}
                        inputMode="numeric"
                        value={form.code}
                        onChange={(event) => updateField("code", event.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="password"
                        className="form-control"
                        placeholder={copy.newPassword}
                        aria-label={copy.newPassword}
                        autoComplete="new-password"
                        value={form.newPassword}
                        onChange={(event) => updateField("newPassword", event.target.value)}
                      />
                    </div>
                  </>
                ) : null}

                {notice ? <div className={styles.alertSuccess}>{notice}</div> : null}
                {error ? <div className={styles.alertError}>{error}</div> : null}

                <div className={styles.stackedButtons}>
                  <button type="submit" className={styles.submitButton} disabled={isPending}>
                    {step === "request"
                      ? isPending
                        ? copy.requesting
                        : copy.requestCode
                      : isPending
                        ? copy.resetting
                        : copy.resetPassword}
                  </button>
                  {step === "reset" ? (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={isPending}
                      onClick={() => {
                        setStep("request");
                        setError("");
                        setNotice("");
                      }}
                    >
                      {copy.requestAnotherCode}
                    </button>
                  ) : null}
                </div>
              </form>

              <p className={styles.footerText}>
                <Link href="/sign-in" className={styles.footerLink}>
                  {copy.backToSignIn}
                </Link>
              </p>
            </div>

            <div className={styles.showcase}>
              <div className={styles.showcaseContent}>
                <span className={styles.showcaseBadge}>
                  <i className="ni ni-lock-circle-open" />
                  {showcase.badge}
                </span>
                <h2 className={styles.showcaseTitle}>{showcase.title}</h2>
                <p className={styles.showcaseText}>{showcase.body}</p>

                <div className={styles.metricGrid}>
                  {showcase.metrics.map((item) => (
                    <div key={item.label} className={styles.metricCard}>
                      <span className={styles.metricValue}>{item.value}</span>
                      <span className={styles.metricLabel}>{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.storyGrid}>
                  {showcase.stories.map((item) => (
                    <div key={item.title} className={styles.storyCard}>
                      <h3 className={styles.storyTitle}>{item.title}</h3>
                      <p className={styles.storyText}>{item.body}</p>
                    </div>
                  ))}
                </div>

                <div className={styles.statusList}>
                  {showcase.statuses.map((item) => (
                    <div key={item} className={styles.statusItem}>
                      <span className={styles.statusDot}>
                        <i className="ni ni-check-bold" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <p className={styles.showcaseFooter}>{showcase.footer}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AuthShell>
  );
}
