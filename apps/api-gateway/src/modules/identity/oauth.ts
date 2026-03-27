import { createHash } from "node:crypto";
import { createOpaqueToken } from "@creatorflow/auth";
import { getConfig } from "../../config.js";

export const OAUTH_PROVIDER_CODES = ["google", "facebook", "twitter", "apple"] as const;

export type OAuthProviderCode = (typeof OAUTH_PROVIDER_CODES)[number];

type ProviderSettings = {
  authorizeUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[];
  tokenUrl: string;
  usesPkce: boolean;
};

export type OAuthStartResult = {
  authorizationUrl: string;
  codeVerifier: string | null;
  stateToken: string;
};

export type OAuthProviderProfile = {
  avatarUrl: string | null;
  email: string | null;
  emailVerified: boolean;
  fullName: string | null;
  providerCode: OAuthProviderCode;
  providerUserId: string;
  rawProfile: Record<string, unknown>;
  username: string | null;
};

export function isOAuthProviderCode(value: string): value is OAuthProviderCode {
  return OAUTH_PROVIDER_CODES.includes(value as OAuthProviderCode);
}

export function createOAuthAuthorizationRequest(input: {
  providerCode: OAuthProviderCode;
  redirectUri: string;
}): OAuthStartResult {
  const settings = getProviderSettings(input.providerCode);
  const stateToken = createOpaqueToken();
  const codeVerifier = settings.usesPkce ? createOpaqueToken(64) : null;
  const url = new URL(settings.authorizeUrl);

  url.searchParams.set("client_id", settings.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", settings.scopes.join(" "));
  url.searchParams.set("state", stateToken);

  if (input.providerCode === "apple") {
    url.searchParams.set("response_mode", "form_post");
  }

  if (codeVerifier) {
    url.searchParams.set("code_challenge", createPkceCodeChallenge(codeVerifier));
    url.searchParams.set("code_challenge_method", "S256");
  }

  if (input.providerCode === "google") {
    url.searchParams.set("prompt", "select_account");
  }

  return {
    authorizationUrl: url.toString(),
    codeVerifier,
    stateToken
  };
}

export async function exchangeOAuthCodeForProfile(input: {
  code: string;
  oauthUser?: string | null;
  providerCode: OAuthProviderCode;
  redirectUri: string;
  codeVerifier?: string | null;
}): Promise<OAuthProviderProfile> {
  const settings = getProviderSettings(input.providerCode);
  const tokenResponse = await postForm(settings.tokenUrl, buildTokenRequest(input, settings), {
    accept: "application/json"
  });

  if (!tokenResponse.ok) {
    throw new Error(extractErrorMessage(tokenResponse.payload) ?? "Unable to exchange OAuth code");
  }

  const accessToken = requiredString(
    tokenResponse.payload.access_token,
    "OAuth provider did not return an access token"
  );
  const idToken = requiredString(
    tokenResponse.payload.id_token,
    "OAuth provider did not return an identity token"
  );

  switch (input.providerCode) {
    case "google":
      return readGoogleProfile(accessToken);
    case "facebook":
      return readFacebookProfile(accessToken);
    case "twitter":
      return readTwitterProfile(accessToken);
    case "apple":
      return readAppleProfile(idToken, input.oauthUser);
  }
}

function getProviderSettings(providerCode: OAuthProviderCode): ProviderSettings {
  const config = getConfig();

  switch (providerCode) {
    case "google":
      if (!config.googleOAuthClientId || !config.googleOAuthClientSecret) {
        throw new Error("Google SSO is not configured");
      }
      return {
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        clientId: config.googleOAuthClientId,
        clientSecret: config.googleOAuthClientSecret,
        scopes: ["openid", "email", "profile"],
        tokenUrl: "https://oauth2.googleapis.com/token",
        usesPkce: true
      };
    case "facebook":
      if (!config.facebookOAuthClientId || !config.facebookOAuthClientSecret) {
        throw new Error("Facebook SSO is not configured");
      }
      return {
        authorizeUrl: "https://www.facebook.com/dialog/oauth",
        clientId: config.facebookOAuthClientId,
        clientSecret: config.facebookOAuthClientSecret,
        scopes: ["email", "public_profile"],
        tokenUrl: "https://graph.facebook.com/oauth/access_token",
        usesPkce: false
      };
    case "twitter":
      if (!config.twitterOAuthClientId) {
        throw new Error("Twitter/X SSO is not configured");
      }
      return {
        authorizeUrl: "https://x.com/i/oauth2/authorize",
        clientId: config.twitterOAuthClientId,
        clientSecret: config.twitterOAuthClientSecret || undefined,
        scopes: ["users.read", "tweet.read", "offline.access"],
        tokenUrl: "https://api.x.com/2/oauth2/token",
        usesPkce: true
      };
    case "apple":
      if (!config.appleOAuthClientId || !config.appleOAuthClientSecret) {
        throw new Error("Apple SSO is not configured");
      }
      return {
        authorizeUrl: "https://appleid.apple.com/auth/authorize",
        clientId: config.appleOAuthClientId,
        clientSecret: config.appleOAuthClientSecret,
        scopes: ["name", "email"],
        tokenUrl: "https://appleid.apple.com/auth/token",
        usesPkce: false
      };
  }
}

function buildTokenRequest(
  input: {
    code: string;
    providerCode: OAuthProviderCode;
    redirectUri: string;
    codeVerifier?: string | null;
  },
  settings: ProviderSettings
) {
  const params = new URLSearchParams();
  params.set("client_id", settings.clientId);
  params.set("code", input.code);
  params.set("grant_type", "authorization_code");
  params.set("redirect_uri", input.redirectUri);

  if (settings.clientSecret) {
    params.set("client_secret", settings.clientSecret);
  }

  if (input.codeVerifier) {
    params.set("code_verifier", input.codeVerifier);
  }

  return params;
}

async function readGoogleProfile(accessToken: string) {
  const response = await fetchJson("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(extractErrorMessage(response.payload) ?? "Unable to read Google profile");
  }

  const payload = ensureRecord(response.payload);

  return {
    avatarUrl: readString(payload.picture),
    email: normalizeEmail(readString(payload.email)),
    emailVerified: Boolean(payload.email_verified),
    fullName: readString(payload.name),
    providerCode: "google" as const,
    providerUserId: requiredString(payload.sub, "Missing Google subject"),
    rawProfile: payload,
    username: null
  };
}

async function readFacebookProfile(accessToken: string) {
  const response = await fetchJson(
    "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)",
    {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(extractErrorMessage(response.payload) ?? "Unable to read Facebook profile");
  }

  const payload = ensureRecord(response.payload);
  const picture = ensureRecord(payload.picture);
  const pictureData = ensureRecord(picture.data);

  return {
    avatarUrl: readString(pictureData.url),
    email: normalizeEmail(readString(payload.email)),
    emailVerified: Boolean(payload.email),
    fullName: readString(payload.name),
    providerCode: "facebook" as const,
    providerUserId: requiredString(payload.id, "Missing Facebook account id"),
    rawProfile: payload,
    username: null
  };
}

async function readTwitterProfile(accessToken: string) {
  const response = await fetchJson(
    "https://api.x.com/2/users/me?user.fields=id,name,username,profile_image_url",
    {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(extractErrorMessage(response.payload) ?? "Unable to read Twitter/X profile");
  }

  const payload = ensureRecord(response.payload);
  const data = ensureRecord(payload.data);

  return {
    avatarUrl: readString(data.profile_image_url),
    email: null,
    emailVerified: false,
    fullName: readString(data.name),
    providerCode: "twitter" as const,
    providerUserId: requiredString(data.id, "Missing Twitter/X account id"),
    rawProfile: payload,
    username: readString(data.username)
  };
}

async function readAppleProfile(idToken: string, rawUser?: string | null) {
  const payload = decodeJwtPayload(idToken);
  const appleUser = parseAppleUser(rawUser);

  if (readString(payload.iss) !== "https://appleid.apple.com") {
    throw new Error("Unexpected Apple issuer");
  }

  if (readString(payload.aud) !== getConfig().appleOAuthClientId) {
    throw new Error("Unexpected Apple audience");
  }

  const firstName = readString(ensureRecord(appleUser.name).firstName);
  const lastName = readString(ensureRecord(appleUser.name).lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || readString(payload.name);

  return {
    avatarUrl: null,
    email: normalizeEmail(readString(payload.email) ?? readString(appleUser.email)),
    emailVerified: readString(payload.email_verified) === "true" || payload.email_verified === true,
    fullName: fullName || null,
    providerCode: "apple" as const,
    providerUserId: requiredString(payload.sub, "Missing Apple subject"),
    rawProfile: {
      ...payload,
      user: appleUser
    },
    username: null
  };
}

async function postForm(url: string, body: URLSearchParams, headers: Record<string, string>) {
  return fetchJson(url, {
    body,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...headers
    },
    method: "POST"
  });
}

async function fetchJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const text = await response.text();

  try {
    return {
      ok: response.ok,
      payload: JSON.parse(text) as Record<string, unknown>,
      status: response.status
    };
  } catch {
    return {
      ok: response.ok,
      payload: { message: text },
      status: response.status
    };
  }
}

function parseAppleUser(rawUser?: string | null) {
  if (!rawUser) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawUser) as unknown;
    return ensureRecord(parsed);
  } catch {
    return {};
  }
}

function decodeJwtPayload(token: string) {
  const [, payloadSegment] = token.split(".");

  if (!payloadSegment) {
    throw new Error("Invalid identity token");
  }

  const decoded = Buffer.from(payloadSegment, "base64url").toString("utf8");
  return ensureRecord(JSON.parse(decoded));
}

function createPkceCodeChallenge(codeVerifier: string) {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

function extractErrorMessage(payload: Record<string, unknown>) {
  const message = readString(payload.message);
  if (message) {
    return message;
  }

  const errorDescription = readString(payload.error_description);
  if (errorDescription) {
    return errorDescription;
  }

  const error = payload.error;
  if (typeof error === "string" && error) {
    return error;
  }

  if (error && typeof error === "object") {
    const errorRecord = ensureRecord(error);
    return readString(errorRecord.message) ?? readString(errorRecord.code);
  }

  return null;
}

function ensureRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requiredString(value: unknown, fallbackMessage: string) {
  const result = readString(value);

  if (!result) {
    throw new Error(fallbackMessage);
  }

  return result;
}

function normalizeEmail(value: string | null) {
  return value ? value.toLowerCase() : null;
}
