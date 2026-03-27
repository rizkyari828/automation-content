"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";

import DashboardBodyClass from "../dashboard/dashboard-body-class.jsx";
import LanguageSwitcher from "../i18n/language-switcher.jsx";
import { useWebMessages } from "../i18n/web-locale.jsx";

const MAIN_NAV_ITEMS = [
  { href: "/dashboard", icon: "ni ni-shop", key: "dashboard", routeKey: "dashboard" },
  { href: "/tables", icon: "ni ni-bullet-list-67", key: "tables", routeKey: "tables" },
  { href: "/billing", icon: "ni ni-money-coins", key: "billing", routeKey: "billing" },
  { href: "/virtual-reality", icon: "ni ni-chart-pie-35", key: "virtualReality", routeKey: "virtual-reality" }
];

const ACCOUNT_NAV_ITEMS = [
  { href: "/profile", icon: "ni ni-single-02", key: "profile", routeKey: "profile" }
];

const NAV_ACCESS_RULES = {
  billing: {
    feature: "billing",
    permission: "billing.read"
  }
};

function canAccessNavItem(item, session) {
  if (!session?.authenticated || !session.authorization) {
    return true;
  }

  if (session.authorization.platformRoleCode === "superadmin") {
    return true;
  }

  const rule = NAV_ACCESS_RULES[item.routeKey];
  if (!rule) {
    return true;
  }

  if (
    rule.feature &&
    !session.authorization.enabledFeatureCodes?.includes(rule.feature)
  ) {
    return false;
  }

  if (
    rule.permission &&
    !session.authorization.permissions?.includes(rule.permission)
  ) {
    return false;
  }

  return true;
}

function SidebarNavItem({ item, activeRoute, labels }) {
  const active = item.routeKey === activeRoute;

  return (
    <li className="nav-item">
      <Link
        className={`nav-link creatorflow-sidenav-link${active ? " active shadow-sm" : ""}`}
        href={item.href}
        style={active ? { background: "#f4f7fb" } : undefined}
      >
        <div
          className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center"
          style={
            active
              ? {
                  background: "linear-gradient(135deg, #102c45 0%, #0f8590 60%, #f59a53 100%)"
                }
              : {
                  background: "#edf2f7"
                }
          }
        >
          <i className={`${item.icon} ${active ? "text-white" : "text-dark"} text-sm opacity-10`} />
        </div>
        <span className="nav-link-text ms-1">{labels[item.key]}</span>
      </Link>
    </li>
  );
}

function ArgonSidebar({ activeRoute }) {
  const copy = useWebMessages().web.layout;
  const [session, setSession] = useState({
    authenticated: false,
    authorization: null
  });

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active || !response.ok || !payload) {
          return;
        }

        setSession({
          authenticated: Boolean(payload.authenticated),
          authorization: payload.authorization ?? null
        });
      } catch {
        if (!active) {
          return;
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  const mainNavItems = MAIN_NAV_ITEMS.filter((item) => canAccessNavItem(item, session));

  return (
    <aside
      className="sidenav navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3 fixed-start ms-4 d-flex flex-column creatorflow-internal-sidenav"
      id="sidenav-main"
      style={{
        background: "rgba(255, 255, 255, 0.96)",
        boxShadow: "0 28px 60px rgba(16, 44, 69, 0.12)"
      }}
    >
      <div className="sidenav-header">
        <i
          className="fas fa-times p-3 cursor-pointer text-secondary opacity-5 position-absolute end-0 top-0 d-none d-xl-none"
          aria-hidden="true"
          id="iconSidenav"
        />
        <Link className="navbar-brand m-0 d-flex align-items-center" href="/">
          <span
            aria-hidden="true"
            style={{
              alignItems: "center",
              background: "linear-gradient(135deg, #102c45 0%, #0f8590 58%, #f59a53 100%)",
              borderRadius: 14,
              boxShadow: "0 14px 30px rgba(16, 44, 69, 0.18)",
              color: "#ffffff",
              display: "inline-flex",
              fontFamily: "\"Plus Jakarta Sans\", sans-serif",
              fontSize: "0.72rem",
              fontWeight: 800,
              height: 32,
              justifyContent: "center",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              width: 32
            }}
          >
            CF
          </span>
          <span className="ms-2">
            <span className="d-block font-weight-bold">CreatorFlow</span>
            <span className="text-xs text-uppercase text-secondary" style={{ letterSpacing: "0.14em" }}>
              Commerce OS
            </span>
          </span>
        </Link>
      </div>
      <hr className="horizontal dark mt-0" />
      <div className="creatorflow-sidenav-body d-flex flex-column flex-grow-1">
        <ul className="navbar-nav">
          {mainNavItems.map((item) => (
            <SidebarNavItem key={item.href} item={item} activeRoute={activeRoute} labels={copy.nav} />
          ))}
          <li className="nav-item mt-3">
            <h6 className="ps-4 ms-2 text-uppercase text-xs font-weight-bolder opacity-6">
              {copy.nav.accountPages}
            </h6>
          </li>
          {ACCOUNT_NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href} item={item} activeRoute={activeRoute} labels={copy.nav} />
          ))}
        </ul>
        <div className="sidenav-footer mt-auto px-3 pb-3 pt-3">
          <div
            className="border-radius-lg p-3 creatorflow-sidenav-promo"
            style={{
              background: "linear-gradient(135deg, rgba(16, 44, 69, 0.98), rgba(15, 133, 144, 0.92))",
              color: "#ffffff"
            }}
          >
            <p className="text-xs text-uppercase mb-2 opacity-8" style={{ letterSpacing: "0.16em" }}>
              {copy.sidebar.eyebrow}
            </p>
            <h6 className="text-white mb-2">{copy.sidebar.title}</h6>
            <p className="text-sm mb-3 opacity-8 creatorflow-sidenav-promo-body">{copy.sidebar.body}</p>
            <Link href="/billing" className="btn btn-sm bg-white text-dark mb-0 w-100 creatorflow-sidenav-promo-cta">
              {copy.sidebar.cta}
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ArgonTopbar({
  pageTitle,
  className = "navbar navbar-main navbar-expand-lg px-0 mx-4 border-radius-xl creatorflow-internal-topbar",
  containerClassName = "container-fluid py-3 px-3",
  titleClassName = "font-weight-bolder text-white mb-0 creatorflow-topbar-page-title",
  dropdownMenuClassName = "me-sm-n4",
  mobileNavItemClassName = "nav-item d-xl-none ps-3 d-flex align-items-center",
  dataScroll = "false"
}) {
  const copy = useWebMessages().web.layout;

  return (
    <nav className={className} id="navbarBlur" data-scroll={dataScroll}>
      <div className={containerClassName}>
        <div className="creatorflow-topbar-heading">
          <p className="text-xs text-uppercase text-white opacity-7 mb-1" style={{ letterSpacing: "0.14em" }}>
            {copy.topbar.pages}
          </p>
          <h6 className={titleClassName}>{pageTitle}</h6>
        </div>
        <div className="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
          <div className="ms-md-auto d-none d-lg-flex align-items-center gap-2 creatorflow-topbar-chips">
            <div className="badge bg-white text-dark border px-3 py-2 creatorflow-topbar-chip">
              {copy.topbar.workspaceLabel}: {copy.topbar.workspaceValue}
            </div>
            <div className="badge bg-gradient-dark px-3 py-2 creatorflow-topbar-chip creatorflow-topbar-chip-secondary">
              {copy.topbar.outputLabel}: {copy.topbar.outputValue}
            </div>
          </div>
          <ul className="navbar-nav justify-content-end align-items-center ms-auto">
            <li className="nav-item d-flex align-items-center me-2">
              <LanguageSwitcher compact variant="light" />
            </li>
            <li className="nav-item dropdown pe-2 d-flex align-items-center me-2">
              <button
                type="button"
                className="nav-link text-white p-0 border-0 bg-transparent"
                id="dropdownMenuButton"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label={copy.topbar.notificationsTitle}
              >
                <span
                  className="d-inline-flex align-items-center justify-content-center border-radius-md"
                  style={{
                    background: "rgba(255, 255, 255, 0.14)",
                    height: 40,
                    width: 40
                  }}
                >
                  <i className="ni ni-bell-55 text-sm" />
                </span>
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end px-2 py-3 creatorflow-notify-menu${dropdownMenuClassName ? ` ${dropdownMenuClassName}` : ""}`}
                aria-labelledby="dropdownMenuButton"
                style={{ minWidth: 320 }}
              >
                <li className="px-3 pb-2">
                  <p className="text-xs text-uppercase text-secondary mb-1" style={{ letterSpacing: "0.16em" }}>
                    {copy.topbar.notificationsTitle}
                  </p>
                  <h6 className="text-sm mb-0">{copy.topbar.notificationsSubtitle}</h6>
                </li>
                {copy.topbar.notifications.map((item, index) => (
                  <li key={item.time} className={index < copy.topbar.notifications.length - 1 ? "mb-1" : undefined}>
                    <span className="dropdown-item border-radius-md">
                      <div className="d-flex py-1">
                        <div
                          className="icon icon-shape icon-sm text-center rounded-circle me-3"
                          style={{
                            background: item.tone === "warning" ? "#fff3e8" : item.tone === "success" ? "#ebfbf6" : "#eef4fb"
                          }}
                        >
                          <i
                            className={`${item.icon} text-sm`}
                            style={{
                              color: item.tone === "warning" ? "#f59a53" : item.tone === "success" ? "#0f8590" : "#102c45"
                            }}
                          />
                        </div>
                        <div className="d-flex flex-column justify-content-center">
                          <h6 className="text-sm font-weight-normal mb-1">{item.title}</h6>
                          <p className="text-xs text-secondary mb-0">
                            <i className="fa fa-clock me-1" />
                            {item.time}
                          </p>
                        </div>
                      </div>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
            <li className="nav-item d-flex align-items-center">
              <Link href="/profile" className="btn btn-sm bg-white text-dark mb-0 creatorflow-topbar-profile-btn">
                {copy.topbar.profileCta}
              </Link>
            </li>
            <li className={mobileNavItemClassName}>
              <button type="button" className="nav-link text-white p-0 border-0 bg-transparent" id="iconNavbarSidenav">
                <div className="sidenav-toggler-inner">
                  <i className="sidenav-toggler-line bg-white" />
                  <i className="sidenav-toggler-line bg-white" />
                  <i className="sidenav-toggler-line bg-white" />
                </div>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export function ArgonFooter() {
  const copy = useWebMessages().web.layout.footer;

  return (
    <footer className="footer pt-4">
      <div className="container-fluid">
        <div className="row align-items-center justify-content-lg-between gy-3">
          <div className="col-lg-5">
            <div className="copyright text-center text-sm text-muted text-lg-start">
              © {new Date().getFullYear()} CreatorFlow
            </div>
            <p className="text-sm text-muted mb-0 mt-2 text-center text-lg-start">
              {copy.tagline}
            </p>
          </div>
          <div className="col-lg-7">
            <ul className="nav nav-footer justify-content-center justify-content-lg-end gap-1">
              <li className="nav-item">
                <Link href="/" className="nav-link text-muted">
                  {copy.home}
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/#workflow" className="nav-link text-muted">
                  {copy.workflow}
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/#pricing" className="nav-link text-muted">
                  {copy.pricing}
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/profile" className="nav-link pe-0 text-muted">
                  {copy.profile}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function ArgonPage({
  pageTitle,
  activeRoute,
  children,
  bodyClass = "g-sidenav-show bg-gray-100",
  background = (
    <div
      className="position-absolute w-100"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 18%, rgba(15, 133, 144, 0.18), transparent 18%), radial-gradient(circle at 88% 16%, rgba(245, 154, 83, 0.14), transparent 16%), linear-gradient(180deg, #081420 0%, #0d2235 33%, #f3f6fa 33%, #f6f8fb 100%)",
        minHeight: "19rem"
      }}
    />
  ),
  mainClassName = "main-content position-relative border-radius-lg creatorflow-internal-main",
  topbarProps,
  includeChartJs = false
}) {
  return (
    <>
      <DashboardBodyClass className={bodyClass} />
      {includeChartJs ? <Script src="/assets/js/plugins/chartjs.min.js" strategy="afterInteractive" /> : null}
      {background}
      <ArgonSidebar activeRoute={activeRoute} />
      <main className={mainClassName}>
        <ArgonTopbar pageTitle={pageTitle} {...topbarProps} />
        {children}
      </main>
    </>
  );
}
