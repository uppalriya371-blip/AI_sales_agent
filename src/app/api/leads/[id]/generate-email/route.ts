import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { regenerateEmail } from "@/lib/ai";
import { z } from "zod";

const bodySchema = z.object({
  instructions: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: { analysis: true },
    });

    if (!lead || !lead.analysis) {
      return NextResponse.json(
        { error: "Lead must be analyzed before generating an email" },
        { status: 400 }
      );
    }

    let instructions: string | undefined;
    try {
      const json = await req.json();
      instructions = bodySchema.parse(json).instructions;
    } catch {
      // No body / no instructions provided — that's fine, a plain regenerate.
    }

    const painPoints = Array.isArray(lead.analysis.painPoints)
      ? (lead.analysis.painPoints as string[])
      : [];

    const { emailSubject, emailBody } = await regenerateEmail(
      { name: lead.name, company: lead.company, jobTitle: lead.jobTitle, message: lead.message },
      {
        intent: lead.analysis.intent,
        painPoints,
        recommendedApproach: lead.analysis.recommendedApproach,
      },
      instructions
    );

    const analysis = await prisma.aIAnalysis.update({
      where: { leadId: lead.id },
      data: { emailSubject, emailBody },
    });

    await prisma.lead.update({ where: { id: lead.id }, data: { status: "EMAIL_DRAFTED" } });

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[POST /api/leads/:id/generate-email]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate email" },
      { status: 500 }
    );
  }
}
