import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: { analysis: true, emailDrafts: { orderBy: { createdAt: "desc" } } },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (err) {
    console.error("[GET /api/leads/:id]", err);
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}
