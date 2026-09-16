import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email address").max(320),
  company: z.string().trim().max(200).optional().nullable(),
  jobTitle: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(1, "Message is required").max(5000),
  source: z.string().trim().max(200).optional().default("Website Contact Form"),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateDraftSchema = z.object({
  draftId: z.string().min(1),
  subject: z.string().trim().min(1).max(500).optional(),
  body: z.string().trim().min(1).max(20000).optional(),
});

export const createDraftSchema = z.object({
  leadId: z.string().min(1),
});
