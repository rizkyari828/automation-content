import type { FastifyBaseLogger } from "fastify";
import { getConfig } from "../../config.js";

type AuthEmailPurpose = "reset_password" | "verify_email";

type SendAuthCodeEmailInput = {
  code: string;
  purpose: AuthEmailPurpose;
  recipientEmail: string;
};

export async function sendAuthCodeEmail(
  logger: FastifyBaseLogger,
  input: SendAuthCodeEmailInput
) {
  const config = getConfig();
  const email = buildAuthEmail(input);

  if (!config.resendApiKey) {
    logger.info(
      {
        authEmailFallback: true,
        purpose: input.purpose,
        recipientEmail: input.recipientEmail,
        verificationCode: input.code
      },
      "auth email provider not configured; code logged for local development"
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: config.authEmailFrom,
      html: email.html,
      subject: email.subject,
      text: email.text,
      to: [input.recipientEmail]
    }),
    headers: {
      authorization: `Bearer ${config.resendApiKey}`,
      "content-type": "application/json"
    },
    method: "POST",
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    const payload = await safeReadJson(response);

    logger.error(
      {
        purpose: input.purpose,
        recipientEmail: input.recipientEmail,
        resendStatusCode: response.status,
        resendPayload: payload
      },
      "failed to send auth email"
    );

    throw new Error("Unable to deliver authentication email");
  }
}

function buildAuthEmail(input: SendAuthCodeEmailInput) {
  const config = getConfig();
  const expiresInMinutes = String(
    Math.round(
      (input.purpose === "verify_email"
        ? config.authOtpMaxAgeSeconds
        : config.passwordResetOtpMaxAgeSeconds) / 60
    )
  );

  if (input.purpose === "verify_email") {
    return {
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h2>Verify your email</h2>
          <p>Use this CreatorFlow verification code to confirm your email address:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:6px">${input.code}</p>
          <p>This code expires in ${expiresInMinutes} minutes.</p>
          <p>You can enter it from your profile page in CreatorFlow.</p>
          <p><a href="${config.appWebBaseUrl}/profile">Open CreatorFlow</a></p>
        </div>
      `,
      subject: "Your CreatorFlow email verification code",
      text: `Use this CreatorFlow verification code: ${input.code}. It expires in ${expiresInMinutes} minutes. Open ${config.appWebBaseUrl}/profile to complete verification.`
    };
  }

  return {
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2>Reset your password</h2>
        <p>Use this CreatorFlow reset code to choose a new password:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:6px">${input.code}</p>
        <p>This code expires in ${expiresInMinutes} minutes.</p>
        <p><a href="${config.appWebBaseUrl}/forgot-password">Open reset password</a></p>
      </div>
    `,
    subject: "Your CreatorFlow password reset code",
    text: `Use this CreatorFlow password reset code: ${input.code}. It expires in ${expiresInMinutes} minutes. Open ${config.appWebBaseUrl}/forgot-password to continue.`
  };
}

async function safeReadJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
