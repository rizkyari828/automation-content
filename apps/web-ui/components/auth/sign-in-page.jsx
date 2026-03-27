"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import LanguageSwitcher from "../i18n/language-switcher.jsx";
import { useWebLocale, useWebMessages } from "../i18n/web-locale.jsx";
import AuthShell from "./auth-shell.jsx";
import styles from "./auth-page.module.css";
import SocialAuthActions from "./social-auth-actions.jsx";

const SIGN_IN_SHOWCASE = {
  en: {
    badge: "Workspace access",
    title: "Sign in to the workspace where ideas, drafts, and publishing stay connected.",
    body:
      "Once the team is inside, CreatorFlow keeps campaign context, generated assets, approvals, and next actions closer together so production does not drift.",
    metrics: [
      { value: "12", label: "active drafts" },
      { value: "3", label: "ready channels" },
      { value: "1", label: "shared workflow" }
    ],
    stories: [
      {
        title: "Faster review",
        body: "The team can see what is pending, what is approved, and what still needs adjustment."
      },
      {
        title: "Clearer context",
        body: "Campaign notes, product direction, and asset versions stay closer to the work."
      }
    ],
    statuses: [
      "Product brief collected",
      "Angles and scripts generated",
      "Draft ready for approval"
    ],
    footer: "Better output usually starts with cleaner access to the same workflow."
  },
  id: {
    badge: "Akses workspace",
    title: "Masuk ke workspace tempat ide, draft, dan publish tetap tersambung.",
    body:
      "Begitu tim masuk, CreatorFlow menjaga konteks campaign, aset yang dihasilkan, approval, dan next action tetap berdekatan supaya produksi tidak pecah ke mana-mana.",
    metrics: [
      { value: "12", label: "draft aktif" },
      { value: "3", label: "channel siap" },
      { value: "1", label: "workflow bersama" }
    ],
    stories: [
      {
        title: "Review lebih cepat",
        body: "Tim bisa langsung melihat apa yang masih pending, apa yang sudah disetujui, dan apa yang perlu dirapikan."
      },
      {
        title: "Konteks lebih jelas",
        body: "Catatan campaign, arah produk, dan versi aset tetap menempel dekat dengan pekerjaannya."
      }
    ],
    statuses: [
      "Brief produk sudah terkumpul",
      "Angle dan script sudah digenerate",
      "Draft siap masuk approval"
    ],
    footer: "Output yang lebih baik biasanya dimulai dari akses ke workflow yang lebih rapi."
  }
};

export default function SignInPage({ initialError = "", nextPath = "/dashboard" }) {
  const router = useRouter();
  const copy = useWebMessages().web.signInPage;
  const { locale } = useWebLocale();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState(initialError);
  const showcase = SIGN_IN_SHOWCASE[locale] ?? SIGN_IN_SHOWCASE.en;

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/auth/sign-in", {
        body: JSON.stringify(form),
        credentials: "same-origin",
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? copy.fallbackError);
        return;
      }

      router.push(nextPath);
      router.refresh();
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

              <span className={styles.formEyebrow}>CreatorFlow</span>
              <h1 className={styles.formTitle}>{copy.title}</h1>
              <p className={styles.formSubtitle}>{copy.subtitle}</p>

              <div className={styles.formSection}>
                <SocialAuthActions intent="sign_in" nextPath={nextPath} />
              </div>

              <form role="form" onSubmit={handleSubmit} className={styles.formSection}>
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
                <div className="mb-3">
                  <input
                    type="password"
                    className="form-control"
                    placeholder={copy.password}
                    aria-label={copy.password}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                  />
                </div>
                <div className={styles.linkRow}>
                  <span className={styles.helperText}>{copy.emailDivider}</span>
                  <Link href="/forgot-password" className={styles.inlineLink}>
                    {copy.forgotPassword}
                  </Link>
                </div>
                <div className="mt-3">
                  {error ? <div className={styles.alertError}>{error}</div> : null}
                  <button type="submit" className={styles.submitButton} disabled={isPending}>
                    {isPending ? copy.signingIn : copy.submit}
                  </button>
                </div>
              </form>

              <p className={styles.footerText}>
                {copy.noAccount}
                <Link href="/sign-up" className={styles.footerLink}>
                  {" "}
                  {copy.signUp}
                </Link>
              </p>
            </div>

            <div className={styles.showcase}>
              <div className={styles.showcaseContent}>
                <span className={styles.showcaseBadge}>
                  <i className="ni ni-atom" />
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
