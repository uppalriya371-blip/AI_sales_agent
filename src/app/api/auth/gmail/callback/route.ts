import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, saveTokensForUser } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?gmail_error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?gmail_error=missing_params", req.url));
  }

  try {
    const { userId } = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    const tokens = await exchangeCodeForTokens(code);
    await saveTokensForUser(userId, tokens);

    return NextResponse.redirect(new URL("/settings?gmail_connected=1", req.url));
  } catch (err) {
    console.error("[GET /api/auth/gmail/callback]", err);
    return NextResponse.redirect(new URL("/settings?gmail_error=exchange_failed", req.url));
  }
}
