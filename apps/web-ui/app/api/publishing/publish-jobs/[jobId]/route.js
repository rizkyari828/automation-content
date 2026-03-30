import { NextResponse } from "next/server";

import { gatewayFetchWithSession, syncGatewaySessionToResponse } from "../../../../../lib/auth/gateway-session.js";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const result = await gatewayFetchWithSession(request, `/v1/publishing/publish-jobs/${resolvedParams.jobId}`);
  const body = await result.gatewayResponse.json().catch(() => ({
    message: "Unable to load publish job"
  }));

  const response = NextResponse.json(body, {
    status: result.gatewayResponse.status || 500
  });
  syncGatewaySessionToResponse(response, result);
  return response;
}
