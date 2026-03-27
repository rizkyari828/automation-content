"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import LanguageSwitcher from "../i18n/language-switcher.jsx";
import { useWebLocale, useWebMessages } from "../i18n/web-locale.jsx";
import AuthShell, { AuthFooter } from "./auth-shell.jsx";
import styles from "./auth-page.module.css";
import SocialAuthActions from "./social-auth-actions.jsx";

const SIGN_UP_SHOWCASE = {
  en: {
    badge: "Onboarding",
    title: "Create a workspace that keeps your content operation cleaner from day one.",
    body:
      "Start with a simple setup so your team can move from campaign brief to generated assets and review flow without rebuilding the process later.",
    metrics: [
      { value: "1", label: "shared workspace" },
      { value: "3", label: "core stages connected" },
      { value: "7", label: "days to test the flow" }
    ],
    stories: [
      {
        title: "Centralize production",
        body: "Bring briefs, generated content, and approvals into one environment from the beginning."
      },
      {
        title: "Reduce setup friction",
        body: "The team can start with the core workflow first and expand the operating system over time."
      }
    ],
    statuses: [
      "Create workspace identity",
      "Invite the first operator later",
      "Start producing with a cleaner baseline"
    ],
    footer: "The earlier the team shares one workflow, the easier it is to scale output without confusion."
  },
  id: {
    badge: "Onboarding",
    title: "Buat workspace yang menjaga operasional konten tetap rapi sejak hari pertama.",
    body:
      "Mulai dari setup yang sederhana supaya tim bisa bergerak dari brief campaign ke aset hasil generate dan alur review tanpa harus membangun ulang prosesnya nanti.",
    metrics: [
      { value: "1", label: "workspace bersama" },
      { value: "3", label: "tahap inti tersambung" },
      { value: "7", label: "hari untuk uji flow" }
    ],
    stories: [
      {
        title: "Sentralisasi produksi",
        body: "Satukan brief, aset hasil generate, dan approval ke satu environment sejak awal."
      },
      {
        title: "Kurangi friksi setup",
        body: "Tim bisa mulai dari workflow inti dulu lalu memperluas operating system-nya seiring waktu."
      }
    ],
    statuses: [
      "Buat identitas workspace",
      "Tambahkan operator pertama nanti",
      "Mulai produksi dari baseline yang lebih bersih"
    ],
    footer: "Semakin cepat tim memakai satu workflow bersama, semakin mudah scale output tanpa kebingungan."
  }
};

export default function SignUpPage({ initialError = "" }) {
  const router = useRouter();
  const copy = useWebMessages().web.signUpPage;
  const { locale } = useWebLocale();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    workspaceName: ""
  });
  const [error, setError] = useState(initialError);
  const showcase = SIGN_UP_SHOWCASE[locale] ?? SIGN_UP_SHOWCASE.en;

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
      const response = await fetch("/api/auth/sign-up", {
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

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <AuthShell transparent footer={<AuthFooter />}>
      <section className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.grid}>
            <div className={styles.formCard}>
              <div className={styles.languageRow}>
                <LanguageSwitcher compact variant="dark" />
              </div>

              <span className={styles.formEyebrow}>{copy.welcome}</span>
              <h1 className={styles.formTitle}>{copy.createWorkspace}</h1>
              <p className={styles.formSubtitle}>{copy.intro}</p>

              <div className={styles.formSection}>
                <SocialAuthActions intent="register" />
              </div>

              <form role="form" onSubmit={handleSubmit} className={styles.formSection}>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={copy.fullName}
                    aria-label={copy.fullName}
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={copy.workspaceName}
                    aria-label={copy.workspaceName}
                    value={form.workspaceName}
                    onChange={(event) => updateField("workspaceName", event.target.value)}
                  />
                </div>
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
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                  />
                </div>

                <p className={styles.helperText}>{copy.emailDivider}</p>
                {error ? <div className={styles.alertError}>{error}</div> : null}

                <button type="submit" className={styles.submitButton} disabled={isPending}>
                  {isPending ? copy.creating : copy.signUp}
                </button>
              </form>

              <p className={styles.footerText}>
                {copy.alreadyHaveAccount}
                <Link href="/sign-in" className={styles.footerLink}>
                  {" "}
                  {copy.signIn}
                </Link>
              </p>
            </div>

            <div className={styles.showcase}>
              <div className={styles.showcaseContent}>
                <span className={styles.showcaseBadge}>
                  <i className="ni ni-world-2" />
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
