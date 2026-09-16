import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateGmailDraft } from "@/lib/gmail";
import { getCurrentUserId } from "@/lib/session";
import { updateDraftSchema } from "@/lib/validation";

function toHtml(plainText: string): string {
  const escaped = plainText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div style="font-family: -apple-system, Arial, sans-serif; font-size: 14px; line-height: 1.6;">${escaped
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("")}</div>`;
}

export async function PUT(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateDraftSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const existing = await prisma.emailDraft.findUnique({ where: { id: parsed.data.draftId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const subject = parsed.data.subject ?? existing.subject;
    const body = parsed.data.body ?? existing.body;

    if (existing.gmailDraftId) {
      await updateGmailDraft(userId, existing.gmailDraftId, {
        to: existing.recipient,
        subject,
        textBody: body,
        htmlBody: toHtml(body),
      });
    }

    const draft = await prisma.emailDraft.update({
      where: { id: existing.id },
      data: { subject, body, status: "SYNCED" },
    });

    return NextResponse.json({ draft });
  } catch (err) {
    console.error("[PUT /api/gmail/update-draft]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update Gmail draft" },
      { status: 500 }
    );
  }
}
