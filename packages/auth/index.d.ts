export type UserAccessTokenPayload = {
  userId: string;
  workspaceId: string;
};

export type UserAccessTokenOptions = {
  audience: string;
  expiresIn: string;
  issuer: string;
  secret: string;
};

export type VerifiedUserAccessToken = {
  userId: string;
  workspaceId: string;
  tokenType: string;
};

export type ServiceAccessTokenPayload = {
  serviceName: string;
  scope?: string[];
};

export type ServiceAccessTokenOptions = {
  audience: string;
  expiresIn: string;
  issuer: string;
  secret: string;
};

export type VerifiedServiceAccessToken = {
  serviceName: string;
  scope: string[];
  tokenType: string;
};

export function issueUserAccessToken(
  payload: UserAccessTokenPayload,
  options: UserAccessTokenOptions
): Promise<string>;

export function verifyUserAccessToken(
  token: string,
  options: UserAccessTokenOptions
): Promise<VerifiedUserAccessToken>;

export function issueServiceAccessToken(
  payload: ServiceAccessTokenPayload,
  options: ServiceAccessTokenOptions
): Promise<string>;

export function verifyServiceAccessToken(
  token: string,
  options: ServiceAccessTokenOptions
): Promise<VerifiedServiceAccessToken>;

export function createOpaqueToken(size?: number): string;

export function hashOpaqueToken(token: string): string;
