"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AuthShell, { AuthFooter } from "./auth-shell.jsx";

export default function SignUpPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    workspaceName: ""
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
        setError(payload?.message ?? "Unable to create account");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

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
                  <h5>Create CreatorFlow workspace</h5>
                </div>
                <div className="card-body">
                  <form role="form" onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Full name"
                        aria-label="Name"
                        autoComplete="name"
                        value={form.fullName}
                        onChange={(event) => updateField("fullName", event.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Workspace name"
                        aria-label="Workspace name"
                        value={form.workspaceName}
                        onChange={(event) => updateField("workspaceName", event.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="email"
                        className="form-control"
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
                        className="form-control"
                        placeholder="Password"
                        aria-label="Password"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(event) => updateField("password", event.target.value)}
                      />
                    </div>
                    {error ? <p className="text-sm text-danger mb-0">{error}</p> : null}
                    <div className="text-center">
                      <button type="submit" className="btn bg-gradient-dark w-100 my-4 mb-2" disabled={isPending}>
                        {isPending ? "Creating workspace..." : "Sign up"}
                      </button>
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
