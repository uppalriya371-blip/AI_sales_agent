import { google } from "googleapis";
import { prisma } from "./prisma";
import { encrypt, decrypt } from "./crypto";

const SCOPES = ["https://www.googleapis.com/auth/gmail.compose"];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state: string): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // ensures a refresh_token is returned every time
    scope: SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function saveTokensForUser(userId: string, tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string | null;
}) {
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Google did not return a full token set (missing refresh_token — try re-authenticating with prompt=consent)");
  }

  await prisma.oAuthToken.upsert({
    where: { userId_provider: { userId, provider: "google" } },
    update: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiryDate: new Date(tokens.expiry_date || Date.now() + 3600_000),
      scope: tokens.scope || SCOPES.join(" "),
    },
    create: {
      userId,
      provider: "google",
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiryDate: new Date(tokens.expiry_date || Date.now() + 3600_000),
      scope: tokens.scope || SCOPES.join(" "),
    },
  });
}

async function getAuthorizedClientForUser(userId: string) {
  const record = await prisma.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider: "google" } },
  });
  if (!record) {
    throw new Error("Gmail is not connected for this user");
  }

  const client = getOAuthClient();
  client.setCredentials({
    access_token: decrypt(record.accessToken),
    refresh_token: decrypt(record.refreshToken),
    expiry_date: record.expiryDate.getTime(),
  });

  // Refresh + persist if needed; googleapis handles this automatically on
  // demand, but we listen for the event so rotated tokens are saved.
  client.on("tokens", async (newTokens) => {
    if (newTokens.access_token) {
      await prisma.oAuthToken.update({
        where: { userId_provider: { userId, provider: "google" } },
        data: {
          accessToken: encrypt(newTokens.access_token),
          ...(newTokens.refresh_token
            ? { refreshToken: encrypt(newTokens.refresh_token) }
            : {}),
          expiryDate: new Date(newTokens.expiry_date || Date.now() + 3600_000),
        },
      });
    }
  });

  return client;
}

function buildRawMessage(params: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}): string {
  const boundary = "sales_agent_boundary";
  const message = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    params.textBody,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    params.htmlBody,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function createGmailDraft(
  userId: string,
  params: { to: string; subject: string; htmlBody: string; textBody: string }
): Promise<string> {
  const auth = await getAuthorizedClientForUser(userId);
  const gmail = google.gmail({ version: "v1", auth });

  const raw = buildRawMessage(params);
  const res = await gmail.users.drafts.create({
    userId: "me",
    requestBody: { message: { raw } },
  });

  if (!res.data.id) {
    throw new Error("Gmail API did not return a draft id");
  }
  return res.data.id;
}

export async function updateGmailDraft(
  userId: string,
  draftId: string,
  params: { to: string; subject: string; htmlBody: string; textBody: string }
): Promise<void> {
  const auth = await getAuthorizedClientForUser(userId);
  const gmail = google.gmail({ version: "v1", auth });

  const raw = buildRawMessage(params);
  await gmail.users.drafts.update({
    userId: "me",
    id: draftId,
    requestBody: { message: { raw } },
  });
}

export async function isGmailConnected(userId: string): Promise<boolean> {
  const record = await prisma.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider: "google" } },
  });
  return Boolean(record);
}
