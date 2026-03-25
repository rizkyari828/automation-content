import Link from "next/link";

import AuthShell, { AuthFooter } from "./auth-shell.jsx";

function SocialButton({ children }) {
  return (
    <a className="btn btn-outline-light w-100" href="#!">
      {children}
    </a>
  );
}

export default function SignUpPage() {
  return (
    <AuthShell transparent footer={<AuthFooter />}>
      <main className="main-content mt-0">
        <div
          className="page-header align-items-start min-vh-50 pt-5 pb-11 m-3 border-radius-lg"
          style={{
            backgroundImage:
              "url('https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-pro/assets/img/signup-cover.jpg')",
            backgroundPosition: "top"
          }}
        >
          <span className="mask bg-gradient-dark opacity-6" />
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-5 text-center mx-auto">
                <h1 className="text-white mb-2 mt-5">Welcome!</h1>
                <p className="text-lead text-white">Use these awesome forms to login or create new account in your project for free.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="row mt-lg-n10 mt-md-n11 mt-n10 justify-content-center">
            <div className="col-xl-4 col-lg-5 col-md-7 mx-auto">
              <div className="card z-index-0">
                <div className="card-header text-center pt-4">
                  <h5>Register with</h5>
                </div>
                <div className="row px-xl-5 px-sm-4 px-3">
                  <div className="col-3 ms-auto px-1"><SocialButton><i className="fab fa-facebook-f" /></SocialButton></div>
                  <div className="col-3 px-1"><SocialButton><i className="fab fa-apple" /></SocialButton></div>
                  <div className="col-3 me-auto px-1"><SocialButton><i className="fab fa-google" /></SocialButton></div>
                  <div className="mt-2 position-relative text-center">
                    <p className="text-sm font-weight-bold mb-2 text-secondary text-border d-inline z-index-2 bg-white px-3">or</p>
                  </div>
                </div>
                <div className="card-body">
                  <form role="form">
                    <div className="mb-3">
                      <input type="text" className="form-control" placeholder="Name" aria-label="Name" />
                    </div>
                    <div className="mb-3">
                      <input type="email" className="form-control" placeholder="Email" aria-label="Email" />
                    </div>
                    <div className="mb-3">
                      <input type="password" className="form-control" placeholder="Password" aria-label="Password" />
                    </div>
                    <div className="form-check form-check-info text-start">
                      <input className="form-check-input" type="checkbox" id="flexCheckDefault" defaultChecked />
                      <label className="form-check-label" htmlFor="flexCheckDefault">
                        I agree the <a href="#!" className="text-dark font-weight-bolder">Terms and Conditions</a>
                      </label>
                    </div>
                    <div className="text-center">
                      <button type="button" className="btn bg-gradient-dark w-100 my-4 mb-2">Sign up</button>
                    </div>
                    <p className="text-sm mt-3 mb-0">
                      Already have an account?
                      <Link href="/sign-in" className="text-dark font-weight-bolder ms-1">
                        Sign in
                      </Link>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AuthShell>
  );
}
