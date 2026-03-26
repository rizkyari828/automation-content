import Link from "next/link";

import DashboardBodyClass from "../dashboard/dashboard-body-class.jsx";

function AuthNavigation({ transparent = false }) {
  return (
    <nav
      className={
        transparent
          ? "navbar navbar-expand-lg position-absolute top-0 z-index-3 w-100 shadow-none my-3 navbar-transparent mt-4"
          : "navbar navbar-expand-lg blur border-radius-lg top-0 z-index-3 shadow position-absolute mt-4 py-2 start-0 end-0 mx-4"
      }
    >
      <div className={transparent ? "container" : "container-fluid"}>
        <Link className={`navbar-brand font-weight-bolder ms-lg-0 ms-3${transparent ? " text-white" : ""}`} href="/dashboard">
          Argon Dashboard 3
        </Link>
        <button className="navbar-toggler shadow-none ms-2" type="button" data-bs-toggle="collapse" data-bs-target="#navigation" aria-controls="navigation" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon mt-2">
            <span className="navbar-toggler-bar bar1" />
            <span className="navbar-toggler-bar bar2" />
            <span className="navbar-toggler-bar bar3" />
          </span>
        </button>
        <div className="collapse navbar-collapse" id="navigation">
          <ul className="navbar-nav mx-auto">
            <li className="nav-item">
              <Link className={`nav-link d-flex align-items-center me-2${transparent ? "" : " active"}`} href="/dashboard">
                <i className={`fa fa-chart-pie opacity-6${transparent ? "" : " text-dark"} me-1`} />
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link me-2" href="/profile">
                <i className={`fa fa-user opacity-6${transparent ? "" : " text-dark"} me-1`} />
                Profile
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link me-2" href="/sign-up">
                <i className={`fas fa-user-circle opacity-6${transparent ? "" : " text-dark"} me-1`} />
                Sign Up
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link me-2" href="/sign-in">
                <i className={`fas fa-key opacity-6${transparent ? "" : " text-dark"} me-1`} />
                Sign In
              </Link>
            </li>
          </ul>
          <ul className="navbar-nav d-lg-block d-none">
            <li className="nav-item">
              <a href="https://www.creative-tim.com/product/argon-dashboard" className={`btn btn-sm mb-0 me-1${transparent ? " bg-gradient-light" : " btn-primary"}`} target="_blank" rel="noreferrer">
                Free Download
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export function AuthFooter() {
  return (
    <footer className="footer py-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mb-4 mx-auto text-center">
            {["Company", "About Us", "Team", "Products", "Blog", "Pricing"].map((item) => (
              <a key={item} href="#!" className="text-secondary me-xl-5 me-3 mb-sm-0 mb-2">
                {item}
              </a>
            ))}
          </div>
          <div className="col-lg-8 mx-auto text-center mb-4 mt-2">
            {["dribbble", "twitter", "instagram", "pinterest", "github"].map((icon) => (
              <a key={icon} href="#!" className="text-secondary me-xl-4 me-4">
                <span className={`text-lg fab fa-${icon}`} />
              </a>
            ))}
          </div>
        </div>
        <div className="row">
          <div className="col-8 mx-auto text-center mt-1">
            <p className="mb-0 text-secondary">Copyright © {new Date().getFullYear()} Soft by Creative Tim.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function AuthShell({ children, transparent = false, includeStickyContainer = false, footer = null }) {
  return (
    <>
      <DashboardBodyClass className="" />
      {includeStickyContainer ? (
        <div className="container position-sticky z-index-sticky top-0">
          <div className="row">
            <div className="col-12">
              <AuthNavigation transparent={transparent} />
            </div>
          </div>
        </div>
      ) : (
        <AuthNavigation transparent={transparent} />
      )}
      {children}
      {footer}
    </>
  );
}
