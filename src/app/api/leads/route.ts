import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLeadSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { isDuplicateLead } from "@/lib/dedupe";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimit = checkRateLimit(`leads:${ip}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs || 0) / 1000)) } }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createLeadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  try {
    const duplicate = await isDuplicateLead(input.email.toLowerCase(), input.message);
    if (duplicate) {
      return NextResponse.json(
        { error: "This looks like a duplicate submission. Please wait a few minutes before resubmitting." },
        { status: 409 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        company: input.company || null,
        jobTitle: input.jobTitle || null,
        message: input.message,
        source: input.source || "Website Contact Form",
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Number(searchParams.get("pageSize")) || 25);

  try {
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where: status ? { status: status as never } : undefined,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { analysis: true },
      }),
      prisma.lead.count({ where: status ? { status: status as never } : undefined }),
    ]);

    return NextResponse.json({ leads, total, page, pageSize });
  } catch (err) {
    console.error("[GET /api/leads]", err);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
