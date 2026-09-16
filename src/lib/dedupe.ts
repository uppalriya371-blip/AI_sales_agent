// Guards against duplicate lead submissions: same email + same message
// within a short window is treated as a duplicate, not a new lead.
import { prisma } from "./prisma";

const DUPLICATE_WINDOW_MS = 5 * 60_000; // 5 minutes

export async function isDuplicateLead(email: string, message: string): Promise<boolean> {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const existing = await prisma.lead.findFirst({
    where: {
      email: email.toLowerCase(),
      message,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  return Boolean(existing);
}
