import { createHash, randomBytes, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

const textEncoder = new TextEncoder();

function createSecretKey(secret) {
  return textEncoder.encode(secret);
}

export async function issueUserAccessToken(payload, options) {
  return new SignJWT({
    workspaceId: payload.workspaceId,
    tokenType: "user_access"
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setJti(randomUUID())
    .setIssuer(options.issuer)
    .setAudience(options.audience)
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(options.expiresIn)
    .sign(createSecretKey(options.secret));
}

export async function verifyUserAccessToken(token, options) {
  const { payload } = await jwtVerify(token, createSecretKey(options.secret), {
    issuer: options.issuer,
    audience: options.audience
  });

  if (payload.tokenType !== "user_access") {
    throw new Error("Unexpected token type");
  }

  return {
    userId: String(payload.sub),
    workspaceId: String(payload.workspaceId),
    tokenType: String(payload.tokenType)
  };
}

export async function issueServiceAccessToken(payload, options) {
  return new SignJWT({
    scope: payload.scope ?? [],
    tokenType: "service_access"
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setJti(randomUUID())
    .setIssuer(options.issuer)
    .setAudience(options.audience)
    .setSubject(payload.serviceName)
    .setIssuedAt()
    .setExpirationTime(options.expiresIn)
    .sign(createSecretKey(options.secret));
}

export async function verifyServiceAccessToken(token, options) {
  const { payload } = await jwtVerify(token, createSecretKey(options.secret), {
    issuer: options.issuer,
    audience: options.audience
  });

  if (payload.tokenType !== "service_access") {
    throw new Error("Unexpected token type");
  }

  return {
    serviceName: String(payload.sub),
    scope: Array.isArray(payload.scope) ? payload.scope.map(String) : [],
    tokenType: String(payload.tokenType)
  };
}

export function createOpaqueToken(size = 48) {
  return randomBytes(size).toString("base64url");
}

export function hashOpaqueToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
