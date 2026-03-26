"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AuthShell from "./auth-shell.jsx";

export default function SignInPage({ nextPath = "/dashboard" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

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
        setError(payload?.message ?? "Unable to sign in");
        return;
      }

      router.push(nextPath);
      router.refresh();
    });
  }

  return (
    <AuthShell includeStickyContainer>
      <main className="main-content mt-0">
        <section>
          <div className="page-header min-vh-100">
            <div className="container">
              <div className="row">
                <div className="col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0 mx-auto">
                  <div className="card card-plain">
                    <div className="card-header pb-0 text-start">
                      <h4 className="font-weight-bolder">Sign In</h4>
                      <p className="mb-0">Enter your email and password to sign in</p>
                    </div>
                    <div className="card-body">
                      <form role="form" onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <input
                            type="email"
                            className="form-control form-control-lg"
                            placeholder="Email"
                            aria-label="Email"
                            autoComplete="email"
                            value={form.email}
                            onChange={(event) => updateField("email", event.target.value)}
                          />
                        </div>
                        <div className="mb-3">
                          <input
                            type="password"
                            className="form-control form-control-lg"
                            placeholder="Password"
                            aria-label="Password"
                            autoComplete="current-password"
                            value={form.password}
                            onChange={(event) => updateField("password", event.target.value)}
                          />
                        </div>
                        {error ? <p className="text-sm text-danger mb-0">{error}</p> : null}
                        <div className="text-center">
                          <button type="submit" className="btn btn-lg btn-primary w-100 mt-4 mb-0" disabled={isPending}>
                            {isPending ? "Signing in..." : "Sign in"}
                          </button>
                        </div>
                      </form>
                    </div>
                    <div className="card-footer text-center pt-0 px-lg-2 px-1">
                      <p className="mb-4 text-sm mx-auto">
                        Don&apos;t have an account?
                        <Link href="/sign-up" className="text-primary text-gradient font-weight-bold ms-1">
                          Sign up
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-6 d-lg-flex d-none h-100 my-auto pe-0 position-absolute top-0 end-0 text-center justify-content-center flex-column">
                  <div
                    className="position-relative bg-gradient-primary h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center overflow-hidden"
                    style={{
                      backgroundImage:
                        "url('https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-pro/assets/img/signin-ill.jpg')",
                      backgroundSize: "cover"
                    }}
                  >
                    <span className="mask bg-gradient-primary opacity-6" />
                    <h4 className="mt-5 text-white font-weight-bolder position-relative">&quot;Attention is the new currency&quot;</h4>
                    <p className="text-white position-relative">
                      The more effortless the writing looks, the more effort the writer actually put into the process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AuthShell>
  );
}
