"use client";

import { SSO_PROVIDERS } from "../../lib/auth/sso.js";
import { useWebMessages } from "../i18n/web-locale.jsx";

function createAuthHref(providerId, intent, nextPath) {
  const params = new URLSearchParams({
    intent,
    next: nextPath
  });

  return `/api/auth/sso/${providerId}?${params.toString()}`;
}

export default function SocialAuthActions({
  intent = "sign_in",
  nextPath = "/dashboard"
}) {
  const copy = useWebMessages().web.socialAuth;
  const heading = intent === "register" ? copy.registerTitle : copy.signInTitle;

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center mb-3">
        <div className="flex-grow-1 border-top" />
        <span className="text-xs text-uppercase text-secondary font-weight-bold px-3">
          {heading}
        </span>
        <div className="flex-grow-1 border-top" />
      </div>
      <div className="row g-2">
        {SSO_PROVIDERS.map((provider) => (
          <div key={provider.id} className="col-12 col-sm-6">
            <a
              href={createAuthHref(provider.id, intent, nextPath)}
              className="btn btn-outline-dark mb-0 w-100 d-flex align-items-center justify-content-center gap-2 text-nowrap"
            >
              <i className={`${provider.iconClassName} text-sm`} aria-hidden="true" />
              <span>{copy.providers[provider.labelKey]}</span>
            </a>
          </div>
        ))}
      </div>
      <p className="text-xs text-secondary mb-0 mt-3">{copy.provisioningHint}</p>
    </div>
  );
}
