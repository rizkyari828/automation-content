"use client";

function callGlobal(functionName, element) {
  if (typeof window === "undefined") {
    return;
  }

  const fn = window[functionName];

  if (typeof fn === "function") {
    fn(element);
  }
}

const SIDEBAR_COLORS = ["primary", "dark", "info", "success", "warning", "danger"];

export default function DashboardConfigurator({ showNavbarFixed = true }) {
  return (
    <div className="fixed-plugin">
      <button className="fixed-plugin-button text-dark position-fixed px-3 py-2 border-0 bg-transparent" type="button">
        <i className="fa fa-cog py-2" />
      </button>
      <div className="card shadow-lg">
        <div className="card-header pb-0 pt-3">
          <div className="float-start">
            <h5 className="mt-3 mb-0">Argon Configurator</h5>
            <p>See our dashboard options.</p>
          </div>
          <div className="float-end mt-4">
            <button className="btn btn-link text-dark p-0 fixed-plugin-close-button" type="button">
              <i className="fa fa-close" />
            </button>
          </div>
        </div>
        <hr className="horizontal dark my-1" />
        <div className="card-body pt-sm-3 pt-0 overflow-auto">
          <div>
            <h6 className="mb-0">Sidebar Colors</h6>
          </div>
          <a href="#!" className="switch-trigger background-color" onClick={(event) => event.preventDefault()}>
            <div className="badge-colors my-2 text-start">
              {SIDEBAR_COLORS.map((color, index) => (
                <span
                  key={color}
                  className={`badge filter bg-gradient-${color}${index === 0 ? " active" : ""}`}
                  data-color={color}
                  onClick={(event) => callGlobal("sidebarColor", event.currentTarget)}
                />
              ))}
            </div>
          </a>
          <div className="mt-3">
            <h6 className="mb-0">Sidenav Type</h6>
            <p className="text-sm">Choose between 2 different sidenav types.</p>
          </div>
          <div className="d-flex">
            <button
              className="btn bg-gradient-primary w-100 px-3 mb-2 active me-2"
              data-class="bg-white"
              type="button"
              onClick={(event) => callGlobal("sidebarType", event.currentTarget)}
            >
              White
            </button>
            <button
              className="btn bg-gradient-primary w-100 px-3 mb-2"
              data-class="bg-default"
              type="button"
              onClick={(event) => callGlobal("sidebarType", event.currentTarget)}
            >
              Dark
            </button>
          </div>
          <p className="text-sm d-xl-none d-block mt-2">
            You can change the sidenav type just on desktop view.
          </p>
          {showNavbarFixed ? (
            <>
              <div className="d-flex my-3">
                <h6 className="mb-0">Navbar Fixed</h6>
                <div className="form-check form-switch ps-0 ms-auto my-auto">
                  <input
                    className="form-check-input mt-1 ms-auto"
                    type="checkbox"
                    id="navbarFixed"
                    onClick={(event) => callGlobal("navbarFixed", event.currentTarget)}
                  />
                </div>
              </div>
              <hr className="horizontal dark my-sm-4" />
            </>
          ) : (
            <hr className="horizontal dark my-sm-4" />
          )}
          <div className="mt-2 mb-5 d-flex">
            <h6 className="mb-0">Light / Dark</h6>
            <div className="form-check form-switch ps-0 ms-auto my-auto">
              <input
                className="form-check-input mt-1 ms-auto"
                type="checkbox"
                id="dark-version"
                onClick={(event) => callGlobal("darkMode", event.currentTarget)}
              />
            </div>
          </div>
          <a
            className="btn bg-gradient-dark w-100"
            href="https://www.creative-tim.com/product/argon-dashboard"
            target="_blank"
            rel="noreferrer"
          >
            Free Download
          </a>
          <a
            className="btn btn-outline-dark w-100"
            href="https://www.creative-tim.com/learning-lab/bootstrap/license/argon-dashboard"
            target="_blank"
            rel="noreferrer"
          >
            View documentation
          </a>
          <div className="w-100 text-center">
            <a
              className="github-button"
              href="https://github.com/creativetimofficial/argon-dashboard"
              data-icon="octicon-star"
              data-size="large"
              data-show-count="true"
              aria-label="Star creativetimofficial/argon-dashboard on GitHub"
            >
              Star
            </a>
            <h6 className="mt-3">Thank you for sharing!</h6>
            <a
              href="https://twitter.com/intent/tweet?text=Check%20Argon%20Dashboard%20made%20by%20%40CreativeTim%20%23webdesign%20%23dashboard%20%23bootstrap5&url=https%3A%2F%2Fwww.creative-tim.com%2Fproduct%2Fargon-dashboard"
              className="btn btn-dark mb-0 me-2"
              target="_blank"
              rel="noreferrer"
            >
              <i className="fab fa-twitter me-1" aria-hidden="true" />
              Tweet
            </a>
            <a
              href="https://www.facebook.com/sharer/sharer.php?u=https://www.creative-tim.com/product/argon-dashboard"
              className="btn btn-dark mb-0 me-2"
              target="_blank"
              rel="noreferrer"
            >
              <i className="fab fa-facebook-square me-1" aria-hidden="true" />
              Share
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
