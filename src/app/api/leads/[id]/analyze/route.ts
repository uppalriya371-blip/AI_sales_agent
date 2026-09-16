import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeLead } from "@/lib/ai";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const result = await analyzeLead({
      name: lead.name,
      company: lead.company,
      jobTitle: lead.jobTitle,
      message: lead.message,
    });

    const analysis = await prisma.aIAnalysis.upsert({
      where: { leadId: lead.id },
      update: {
        intent: result.intent,
        leadScore: result.leadScore,
        painPoints: result.painPoints,
        recommendedApproach: result.recommendedApproach,
        emailSubject: result.emailSubject,
        emailBody: result.emailBody,
      },
      create: {
        leadId: lead.id,
        intent: result.intent,
        leadScore: result.leadScore,
        painPoints: result.painPoints,
        recommendedApproach: result.recommendedApproach,
        emailSubject: result.emailSubject,
        emailBody: result.emailBody,
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "ANALYZED" },
    });

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[POST /api/leads/:id/analyze]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze lead" },
      { status: 500 }
    );
  }
}
