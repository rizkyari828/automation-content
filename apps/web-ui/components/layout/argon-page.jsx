import Link from "next/link";
import Script from "next/script";

import DashboardBodyClass from "../dashboard/dashboard-body-class.jsx";
import DashboardConfigurator from "../dashboard/dashboard-configurator.jsx";

const MAIN_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "ni ni-tv-2", routeKey: "dashboard" },
  { href: "/tables", label: "Tables", icon: "ni ni-calendar-grid-58", routeKey: "tables" },
  { href: "/billing", label: "Billing", icon: "ni ni-credit-card", routeKey: "billing" },
  { href: "/virtual-reality", label: "Virtual Reality", icon: "ni ni-app", routeKey: "virtual-reality" },
  { href: "/rtl", label: "RTL", icon: "ni ni-world-2", routeKey: "rtl" }
];

const ACCOUNT_NAV_ITEMS = [
  { href: "/profile", label: "Profile", icon: "ni ni-single-02", routeKey: "profile" },
  { href: "/sign-in", label: "Sign In", icon: "ni ni-single-copy-04", routeKey: "sign-in" },
  { href: "/sign-up", label: "Sign Up", icon: "ni ni-collection", routeKey: "sign-up" }
];

const NOTIFICATIONS = [
  {
    image: "/assets/img/team-2.jpg",
    imageClassName: "avatar avatar-sm me-3",
    title: (
      <>
        <span className="font-weight-bold">New message</span> from Laur
      </>
    ),
    time: "13 minutes ago"
  },
  {
    image: "/assets/img/small-logos/logo-spotify.svg",
    imageClassName: "avatar avatar-sm bg-gradient-dark me-3",
    title: (
      <>
        <span className="font-weight-bold">New album</span> by Travis Scott
      </>
    ),
    time: "1 day"
  },
  {
    iconClassName: "avatar avatar-sm bg-gradient-secondary me-3 my-auto",
    icon: "ni ni-credit-card text-white",
    title: "Payment successfully completed",
    time: "2 days"
  }
];

function SidebarNavItem({ item, activeRoute }) {
  return (
    <li className="nav-item">
      <Link className={`nav-link${item.routeKey === activeRoute ? " active" : ""}`} href={item.href}>
        <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
          <i className={`${item.icon} text-dark text-sm opacity-10`} />
        </div>
        <span className="nav-link-text ms-1">{item.label}</span>
      </Link>
    </li>
  );
}

function ArgonSidebar({ activeRoute }) {
  return (
    <aside
      className="sidenav bg-white navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3 fixed-start ms-4"
      id="sidenav-main"
    >
      <div className="sidenav-header">
        <i
          className="fas fa-times p-3 cursor-pointer text-secondary opacity-5 position-absolute end-0 top-0 d-none d-xl-none"
          aria-hidden="true"
          id="iconSidenav"
        />
        <a
          className="navbar-brand m-0"
          href="https://demos.creative-tim.com/argon-dashboard/pages/dashboard.html"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src="/assets/img/logo-ct-dark.png"
            width="26"
            height="26"
            className="navbar-brand-img h-100"
            alt="main logo"
          />
          <span className="ms-1 font-weight-bold">Creative Tim</span>
        </a>
      </div>
      <hr className="horizontal dark mt-0" />
      <div className="collapse navbar-collapse w-auto" id="sidenav-collapse-main">
        <ul className="navbar-nav">
          {MAIN_NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href} item={item} activeRoute={activeRoute} />
          ))}
          <li className="nav-item mt-3">
            <h6 className="ps-4 ms-2 text-uppercase text-xs font-weight-bolder opacity-6">
              Account pages
            </h6>
          </li>
          {ACCOUNT_NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.href} item={item} activeRoute={activeRoute} />
          ))}
        </ul>
      </div>
      <div className="sidenav-footer mx-3">
        <div className="card card-plain shadow-none" id="sidenavCard">
          <img
            className="w-50 mx-auto"
            src="/assets/img/illustrations/icon-documentation.svg"
            alt="sidebar illustration"
          />
          <div className="card-body text-center p-3 w-100 pt-0">
            <div className="docs-info">
              <h6 className="mb-0">Need help?</h6>
              <p className="text-xs font-weight-bold mb-0">Please check our docs</p>
            </div>
          </div>
        </div>
        <a
          href="https://www.creative-tim.com/learning-lab/bootstrap/license/argon-dashboard"
          target="_blank"
          rel="noreferrer"
          className="btn btn-dark btn-sm w-100 mb-3"
        >
          Documentation
        </a>
        <a
          className="btn btn-primary btn-sm mb-0 w-100"
          href="https://www.creative-tim.com/product/argon-dashboard-pro?ref=sidebarfree"
          target="_blank"
          rel="noreferrer"
        >
          Upgrade to pro
        </a>
      </div>
    </aside>
  );
}

function ArgonTopbar({
  pageTitle,
  className = "navbar navbar-main navbar-expand-lg px-0 mx-4 shadow-none border-radius-xl",
  containerClassName = "container-fluid py-1 px-3",
  breadcrumbClassName = "breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5",
  titleClassName = "font-weight-bolder text-white mb-0",
  dropdownMenuClassName = "me-sm-n4",
  mobileNavItemClassName = "nav-item d-xl-none ps-3 d-flex align-items-center",
  dataScroll = "false"
}) {
  return (
    <nav className={className} id="navbarBlur" data-scroll={dataScroll}>
      <div className={containerClassName}>
        <nav aria-label="breadcrumb">
          <ol className={breadcrumbClassName}>
            <li className="breadcrumb-item text-sm">
              <span className="opacity-5 text-white">Pages</span>
            </li>
            <li className="breadcrumb-item text-sm text-white active" aria-current="page">
              {pageTitle}
            </li>
          </ol>
          <h6 className={titleClassName}>{pageTitle}</h6>
        </nav>
        <div className="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
          <div className="ms-md-auto pe-md-3 d-flex align-items-center">
            <div className="input-group">
              <span className="input-group-text text-body">
                <i className="fas fa-search" aria-hidden="true" />
              </span>
              <input type="text" className="form-control" placeholder="Type here..." />
            </div>
          </div>
          <ul className="navbar-nav justify-content-end">
            <li className="nav-item d-flex align-items-center">
              <Link href="/sign-in" className="nav-link text-white font-weight-bold px-0">
                <i className="fa fa-user me-sm-1" />
                <span className="d-sm-inline d-none">Sign In</span>
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
            <li className="nav-item px-3 d-flex align-items-center">
              <button type="button" className="nav-link text-white p-0 fixed-plugin-button-nav border-0 bg-transparent">
                <i className="fa fa-cog cursor-pointer" />
              </button>
            </li>
            <li className="nav-item dropdown pe-2 d-flex align-items-center">
              <button
                type="button"
                className="nav-link text-white p-0"
                id="dropdownMenuButton"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fa fa-bell cursor-pointer" />
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end px-2 py-3${dropdownMenuClassName ? ` ${dropdownMenuClassName}` : ""}`}
                aria-labelledby="dropdownMenuButton"
              >
                {NOTIFICATIONS.map((item, index) => (
                  <li key={item.time} className={index < NOTIFICATIONS.length - 1 ? "mb-2" : undefined}>
                    <a className="dropdown-item border-radius-md" href="#!">
                      <div className="d-flex py-1">
                        <div className="my-auto">
                          {item.image ? (
                            <img src={item.image} className={item.imageClassName} alt="notification avatar" />
                          ) : (
                            <div className={item.iconClassName}>
                              <i className={item.icon} aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="d-flex flex-column justify-content-center">
                          <h6 className="text-sm font-weight-normal mb-1">{item.title}</h6>
                          <p className="text-xs text-secondary mb-0">
                            <i className="fa fa-clock me-1" />
                            {item.time}
                          </p>
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export function ArgonFooter() {
  return (
    <footer className="footer pt-3">
      <div className="container-fluid">
        <div className="row align-items-center justify-content-lg-between">
          <div className="col-lg-6 mb-lg-0 mb-4">
            <div className="copyright text-center text-sm text-muted text-lg-start">
              © {new Date().getFullYear()}, made with <i className="fa fa-heart" /> by{" "}
              <a
                href="https://www.creative-tim.com"
                className="font-weight-bold"
                target="_blank"
                rel="noreferrer"
              >
                Creative Tim
              </a>{" "}
              for a better web.
            </div>
          </div>
          <div className="col-lg-6">
            <ul className="nav nav-footer justify-content-center justify-content-lg-end">
              <li className="nav-item">
                <a
                  href="https://www.creative-tim.com"
                  className="nav-link text-muted"
                  target="_blank"
                  rel="noreferrer"
                >
                  Creative Tim
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="https://www.creative-tim.com/presentation"
                  className="nav-link text-muted"
                  target="_blank"
                  rel="noreferrer"
                >
                  About Us
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="https://www.creative-tim.com/blog"
                  className="nav-link text-muted"
                  target="_blank"
                  rel="noreferrer"
                >
                  Blog
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="https://www.creative-tim.com/license"
                  className="nav-link pe-0 text-muted"
                  target="_blank"
                  rel="noreferrer"
                >
                  License
                </a>
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
  background = <div className="min-height-300 bg-dark position-absolute w-100" />,
  mainClassName = "main-content position-relative border-radius-lg",
  topbarProps,
  includeChartJs = false,
  showNavbarFixed = true
}) {
  return (
    <>
      <DashboardBodyClass className={bodyClass} />
      {includeChartJs ? <Script src="/assets/js/plugins/chartjs.min.js" strategy="afterInteractive" /> : null}
      <Script src="https://buttons.github.io/buttons.js" strategy="afterInteractive" />
      {background}
      <ArgonSidebar activeRoute={activeRoute} />
      <main className={mainClassName}>
        <ArgonTopbar pageTitle={pageTitle} {...topbarProps} />
        {children}
      </main>
      <DashboardConfigurator showNavbarFixed={showNavbarFixed} />
    </>
  );
}
