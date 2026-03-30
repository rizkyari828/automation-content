import { NextResponse } from "next/server";

import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../../../lib/auth/gateway-session.js";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const range = request.headers.get("range");
  const result = await gatewayFetchWithSession(request, `/v1/media/render-jobs/${resolvedParams.jobId}/output`, {
    headers: {
      ...(range ? { range } : {}),
      accept: "video/mp4"
    }
  });

  const headers = new Headers();
  const contentType = result.gatewayResponse.headers.get("content-type");
  const contentLength = result.gatewayResponse.headers.get("content-length");
  const contentRange = result.gatewayResponse.headers.get("content-range");
  const acceptRanges = result.gatewayResponse.headers.get("accept-ranges");
  const cacheControl = result.gatewayResponse.headers.get("cache-control");

  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (contentLength) {
    headers.set("content-length", contentLength);
  }
  if (contentRange) {
    headers.set("content-range", contentRange);
  }
  if (acceptRanges) {
    headers.set("accept-ranges", acceptRanges);
  }
  if (cacheControl) {
    headers.set("cache-control", cacheControl);
  }

  const body = await result.gatewayResponse.arrayBuffer().catch(() => null);
  const response = new NextResponse(body, {
    headers,
    status: result.gatewayResponse.status || 500
  });

  syncGatewaySessionToResponse(response, result);
  return response;
}
