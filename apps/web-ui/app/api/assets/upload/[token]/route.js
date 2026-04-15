import { gatewayFetch } from "../../../../../lib/auth/gateway.js";

export async function PUT(request, context) {
  const resolvedParams = await context.params;
  const contentType = request.headers.get("content-type") ?? "application/octet-stream";
  const body = await request.arrayBuffer();
  const gatewayResponse = await gatewayFetch(`/v1/assets/uploads/${resolvedParams.token}`, {
    body,
    headers: {
      "content-type": contentType
    },
    method: "PUT"
  });
  const payload = await gatewayResponse.arrayBuffer();

  return new Response(payload, {
    headers: {
      "content-type": gatewayResponse.headers.get("content-type") ?? "application/json"
    },
    status: gatewayResponse.status || 500
  });
}
