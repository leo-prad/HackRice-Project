import {
  MICROSOFT_AUTHORIZE_URL,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_REDIRECT_URI,
  MICROSOFT_SCOPES,
} from "./config";

export function buildMicrosoftAuthorizeUrl(): string {
  if (!MICROSOFT_CLIENT_ID) {
    throw new Error("VITE_MICROSOFT_CLIENT_ID is not set in email-landing/.env");
  }

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: "code",
    redirect_uri: MICROSOFT_REDIRECT_URI,
    response_mode: "query",
    scope: MICROSOFT_SCOPES,
  });

  return `${MICROSOFT_AUTHORIZE_URL}?${params.toString()}`;
}

export function startMicrosoftLogin(): void {
  window.location.href = buildMicrosoftAuthorizeUrl();
}
