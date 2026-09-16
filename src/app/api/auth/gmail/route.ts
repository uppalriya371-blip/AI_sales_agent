import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/gmail";
import { getCurrentUserId } from "@/lib/session";
import { nanoid } from "nanoid";

// Kicks off the OAuth flow: redirects the signed-in dashboard user to
// Google's consent screen. The `state` param carries a CSRF token plus
// the internal userId so the callback knows whose tokens these are.
export async function GET(_req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const csrfToken = nanoid();
  const state = Buffer.from(JSON.stringify({ userId, csrfToken })).toString("base64url");

  // In production, persist csrfToken (e.g. in a short-lived cookie) and
  // verify it in the callback to fully protect against CSRF.
  const url = getAuthUrl(state);
  return NextResponse.redirect(url);
}
