"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const INITIAL_STATE = {
  authenticated: false,
  loading: true,
  message: null,
  user: null,
  workspace: null
};

export default function SessionPanel() {
  const router = useRouter();
  const [state, setState] = useState(INITIAL_STATE);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const response = await fetch("/api/auth/session", {
        credentials: "same-origin"
      });

      const payload = await response.json().catch(() => null);

      if (!active) {
        return;
      }

      if (!response.ok || !payload?.authenticated) {
        setState({
          authenticated: false,
          loading: false,
          message: payload?.message ?? "Sign in to unlock workspace data.",
          user: null,
          workspace: null
        });
        return;
      }

      setState({
        authenticated: true,
        loading: false,
        message: null,
        user: payload.user,
        workspace: payload.workspace
      });
    }

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", {
        credentials: "same-origin",
        method: "POST"
      });

      router.push("/sign-in");
      router.refresh();
    });
  }

  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card">
          <div className="card-body p-3">
            {state.loading ? (
              <>
                <h6 className="mb-1">Checking session</h6>
                <p className="text-sm text-secondary mb-0">
                  Syncing access token and workspace context from CreatorFlow API.
                </p>
              </>
            ) : state.authenticated ? (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h6 className="mb-1">
                    Welcome back{state.user?.fullName ? `, ${state.user.fullName}` : ""}.
                  </h6>
                  <p className="text-sm text-secondary mb-0">
                    Workspace: <span className="font-weight-bold">{state.workspace?.name}</span>
                    {" · "}
                    Role: <span className="text-dark">{state.workspace?.roleCode}</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-dark mb-0"
                  disabled={isPending}
                  onClick={handleLogout}
                >
                  {isPending ? "Signing out..." : "Sign out"}
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h6 className="mb-1">Session not active</h6>
                  <p className="text-sm text-secondary mb-0">{state.message}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-dark mb-0"
                  onClick={() => router.push("/sign-in")}
                >
                  Go to sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
