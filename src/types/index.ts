export type LeadStatus =
  | "NEW"
  | "ANALYZED"
  | "EMAIL_DRAFTED"
  | "DRAFT_CREATED"
  | "SENT"
  | "ARCHIVED";

export interface AIAnalysis {
  id: string;
  leadId: string;
  intent: string;
  leadScore: string;
  painPoints: string[];
  recommendedApproach: string;
  emailSubject: string;
  emailBody: string;
  createdAt: string;
}

export interface EmailDraft {
  id: string;
  leadId: string;
  userId: string;
  gmailDraftId: string | null;
  recipient: string;
  subject: string;
  body: string;
  status: "DRAFT" | "SYNCED" | "SENT" | "ERROR";
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  jobTitle: string | null;
  message: string;
  source: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  analysis?: AIAnalysis | null;
  emailDrafts?: EmailDraft[];
}
