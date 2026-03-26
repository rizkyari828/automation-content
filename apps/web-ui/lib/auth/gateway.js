import { createApiGatewayUrl } from "./config.js";

export async function gatewayFetch(pathname, init = {}) {
  return fetch(createApiGatewayUrl(pathname), {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...init.headers
    }
  });
}

export async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
