"use client";

import Link from "next/link";

import DashboardBodyClass from "../dashboard/dashboard-body-class.jsx";
import LanguageSwitcher from "../i18n/language-switcher.jsx";
import { useWebLocale } from "../i18n/web-locale.jsx";
import styles from "./site-shell.module.css";

const SITE_COPY = {
  en: {
    brandTagline: "AI Content Commerce OS",
    footerDescription:
      "CreatorFlow helps sellers, affiliates, and small teams turn product context into promo content and commerce workflow that is faster to produce and easier to scale.",
    footerLegal: "Built for teams that want more output without more chaos.",
    header: {
      home: "Home",
      features: "Features",
      workflow: "Workflow",
      pricing: "Pricing",
      signIn: "Sign in",
      startFree: "Start free"
    },
    footer: {
      product: "Product",
      company: "Company",
      features: "Features",
      workflow: "Workflow",
      pricing: "Pricing",
      signIn: "Sign in",
      signUp: "Create workspace",
      dashboard: "Dashboard",
      profile: "Profile"
    }
  },
  id: {
    brandTagline: "AI Content Commerce OS",
    footerDescription:
      "CreatorFlow membantu seller, affiliate, dan tim kecil mengubah konteks produk menjadi konten promo dan alur commerce yang lebih cepat dibuat serta lebih mudah diskalakan.",
    footerLegal: "Dibangun untuk tim yang ingin output lebih tinggi tanpa operasional yang berantakan.",
    header: {
      home: "Beranda",
      features: "Fitur",
      workflow: "Alur kerja",
      pricing: "Harga",
      signIn: "Masuk",
      startFree: "Mulai gratis"
    },
    footer: {
      product: "Produk",
      company: "Akses",
      features: "Fitur",
      workflow: "Alur kerja",
      pricing: "Harga",
      signIn: "Masuk",
      signUp: "Buat workspace",
      dashboard: "Dashboard",
      profile: "Profil"
    }
  }
};

function getSiteCopy(locale) {
  return SITE_COPY[locale] ?? SITE_COPY.en;
}

export function SiteHeader({
  primaryCtaHref = "/sign-up",
  primaryCtaLabel,
  secondaryCtaHref = "/sign-in",
  secondaryCtaLabel,
  navItems
}) {
  const { locale } = useWebLocale();
  const copy = getSiteCopy(locale);
  const resolvedNavItems = navItems ?? [
    { href: "/", label: copy.header.home },
    { href: "/#features", label: copy.header.features },
    { href: "/#workflow", label: copy.header.workflow },
    { href: "/#pricing", label: copy.header.pricing }
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>CF</span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>CreatorFlow</span>
            <span className={styles.brandTagline}>{copy.brandTagline}</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {resolvedNavItems.map((item) => (
            <Link key={`${item.href}-${item.label}`} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <LanguageSwitcher compact variant="light" />
          <Link href={secondaryCtaHref} className={styles.ghostButton}>
            {secondaryCtaLabel ?? copy.header.signIn}
          </Link>
          <Link href={primaryCtaHref} className={styles.primaryButton}>
            {primaryCtaLabel ?? copy.header.startFree}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { locale } = useWebLocale();
  const copy = getSiteCopy(locale);

  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div>
          <div className={styles.footerTitle}>CreatorFlow</div>
          <p className={styles.footerDescription}>{copy.footerDescription}</p>
        </div>
        <div>
          <div className={styles.footerTitle}>{copy.footer.product}</div>
          <div className={styles.footerList}>
            <Link href="/#features" className={styles.footerLink}>
              {copy.footer.features}
            </Link>
            <Link href="/#workflow" className={styles.footerLink}>
              {copy.footer.workflow}
            </Link>
            <Link href="/#pricing" className={styles.footerLink}>
              {copy.footer.pricing}
            </Link>
            <Link href="/dashboard" className={styles.footerLink}>
              {copy.footer.dashboard}
            </Link>
          </div>
        </div>
        <div>
          <div className={styles.footerTitle}>{copy.footer.company}</div>
          <div className={styles.footerList}>
            <Link href="/sign-in" className={styles.footerLink}>
              {copy.footer.signIn}
            </Link>
            <Link href="/sign-up" className={styles.footerLink}>
              {copy.footer.signUp}
            </Link>
            <Link href="/profile" className={styles.footerLink}>
              {copy.footer.profile}
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} CreatorFlow</span>
        <span>{copy.footerLegal}</span>
      </div>
    </footer>
  );
}

export default function SiteShell({
  children,
  bodyClassName = "creatorflow-public-shell",
  footer = <SiteFooter />,
  headerProps
}) {
  return (
    <>
      <DashboardBodyClass className={bodyClassName} />
      <div className={styles.siteFrame}>
        <SiteHeader {...headerProps} />
        <main className={styles.main}>{children}</main>
        {footer}
      </div>
    </>
  );
}
