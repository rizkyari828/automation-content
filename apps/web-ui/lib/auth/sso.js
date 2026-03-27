export const SSO_PROVIDERS = [
  {
    iconClassName: "fa-google",
    id: "google",
    labelKey: "google"
  },
  {
    iconClassName: "fa-twitter",
    id: "twitter",
    labelKey: "twitter"
  },
  {
    iconClassName: "fa-facebook-f",
    id: "facebook",
    labelKey: "facebook"
  },
  {
    iconClassName: "fa-apple",
    id: "apple",
    labelKey: "apple"
  }
];

export const SSO_CONTEXT_COOKIE_NAME = "creatorflow_sso_context";

export function isSupportedSsoProvider(value) {
  return SSO_PROVIDERS.some((provider) => provider.id === value);
}

export function encodeSsoContext(context) {
  return Buffer.from(JSON.stringify(context), "utf8").toString("base64url");
}

export function decodeSsoContext(value) {
  if (!value) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      intent: parsed.intent === "register" ? "register" : "sign_in",
      nextPath:
        typeof parsed.nextPath === "string" && parsed.nextPath.startsWith("/")
          ? parsed.nextPath
          : "/dashboard"
    };
  } catch {
    return null;
  }
}
