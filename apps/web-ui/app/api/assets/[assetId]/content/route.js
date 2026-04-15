import { gatewayFetch } from "../../../../../lib/auth/gateway.js";

export async function GET(_request, context) {
  const resolvedParams = await context.params;
  const gatewayResponse = await gatewayFetch(`/v1/assets/${resolvedParams.assetId}/content`);
  const payload = await gatewayResponse.arrayBuffer();
  const headers = new Headers();
  const contentType = gatewayResponse.headers.get("content-type");
  const cacheControl = gatewayResponse.headers.get("cache-control");
  const contentLength = gatewayResponse.headers.get("content-length");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (cacheControl) {
    headers.set("cache-control", cacheControl);
  }

  if (contentLength) {
    headers.set("content-length", contentLength);
  }

  return new Response(payload, {
    headers,
    status: gatewayResponse.status || 500
  });
}
