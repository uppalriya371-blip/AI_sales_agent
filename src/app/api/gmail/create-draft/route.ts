import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGmailDraft } from "@/lib/gmail";
import { getCurrentUserId } from "@/lib/session";
import { createDraftSchema } from "@/lib/validation";

function toHtml(plainText: string): string {
  const escaped = plainText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div style="font-family: -apple-system, Arial, sans-serif; font-size: 14px; line-height: 1.6;">${escaped
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("")}</div>`;
}

export async function POST(req: NextRequest) {
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

  const parsed = createDraftSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: parsed.data.leadId },
      include: { analysis: true },
    });

    if (!lead || !lead.analysis) {
      return NextResponse.json(
        { error: "Lead must have a generated email before creating a draft" },
        { status: 400 }
      );
    }

    const gmailDraftId = await createGmailDraft(userId, {
      to: lead.email,
      subject: lead.analysis.emailSubject,
      textBody: lead.analysis.emailBody,
      htmlBody: toHtml(lead.analysis.emailBody),
    });

    const draft = await prisma.emailDraft.create({
      data: {
        leadId: lead.id,
        userId,
        gmailDraftId,
        recipient: lead.email,
        subject: lead.analysis.emailSubject,
        body: lead.analysis.emailBody,
        status: "SYNCED",
      },
    });

    await prisma.lead.update({ where: { id: lead.id }, data: { status: "DRAFT_CREATED" } });

    return NextResponse.json({ draft }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gmail/create-draft]", err);
    const message = err instanceof Error ? err.message : "Failed to create Gmail draft";
    const status = message.includes("not connected") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
