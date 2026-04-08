"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { formatWebMessage, useWebMessages } from "../i18n/web-locale.jsx";

const INITIAL_STATE = {
  authenticated: false,
  loading: true,
  message: null,
  user: null,
  workspace: null
};
const SESSION_ERROR_PATTERNS = [
  "missing refresh token",
  "missing bearer token",
  "invalid or expired access token",
  "session expired"
];

function normalizeInactiveMessage(message, fallback) {
  if (typeof message !== "string") {
    return fallback;
  }

  const normalized = message.toLowerCase();
  if (SESSION_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return fallback;
  }

  return message;
}

export default function SessionPanel() {
  const router = useRouter();
  const copy = useWebMessages().web.sessionPanel;
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
          message: normalizeInactiveMessage(payload?.message, copy.inactiveFallback),
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
  }, [copy.inactiveFallback]);

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
        <div className="card cf-surface-card">
          <div className="card-body p-3">
            {state.loading ? (
              <>
                <h6 className="mb-1">{copy.loadingTitle}</h6>
                <p className="text-sm text-secondary mb-0">
                  {copy.loadingBody}
                </p>
              </>
            ) : state.authenticated ? (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h6 className="mb-1">
                    {formatWebMessage(copy.signedInTemplate, {
                      name: state.user?.fullName ? `, ${state.user.fullName}` : ""
                    })}
                  </h6>
                  <p className="text-sm text-secondary mb-0">
                    {copy.workspace}: <span className="font-weight-bold">{state.workspace?.name}</span>
                    {" · "}
                    {copy.role}: <span className="text-dark">{state.workspace?.roleCode}</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm mb-0"
                  disabled={isPending}
                  onClick={handleLogout}
                >
                  {isPending ? copy.signingOut : copy.signOut}
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h6 className="mb-1">{copy.inactiveTitle}</h6>
                  <p className="text-sm text-secondary mb-0">{state.message}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-dark btn-sm mb-0"
                  onClick={() => router.push("/sign-in")}
                >
                  {copy.goToSignIn}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
