// AI lead-analysis + email generation, using the Anthropic Messages API.
// Swap the fetch call below if you'd rather use OpenAI or another provider —
// the rest of the app only depends on the AIAnalysisResult shape.

export interface LeadInput {
  name: string;
  company?: string | null;
  jobTitle?: string | null;
  message: string;
}

export interface AIAnalysisResult {
  intent: string;
  leadScore: "Low" | "Medium" | "High";
  painPoints: string[];
  recommendedApproach: string;
  emailSubject: string;
  emailBody: string;
}

const SYSTEM_PROMPT = `You are a sales development assistant that analyzes inbound leads and drafts a follow-up email.

Rules you must follow:
- Never invent facts about the lead. Use only the information provided (name, company, job title, message).
- Keep the email concise (120-180 words) and natural — avoid robotic or overly salesy language.
- Do not use aggressive sales language or false urgency.
- Personalize the email based specifically on what the lead wrote in their message.
- Include one clear, low-pressure call to action (e.g. offering a short call).
- Sign the email as "Sales Team" unless a specific rep name is given.

Respond with ONLY a JSON object (no markdown fences, no preamble) matching exactly this shape:
{
  "intent": string,              // one short sentence describing what the lead wants
  "leadScore": "Low" | "Medium" | "High",
  "painPoints": string[],        // 1-4 short bullet-style pain points inferred from the message
  "recommendedApproach": string, // 1-2 sentences on how a rep should approach this lead
  "emailSubject": string,
  "emailBody": string            // plain text, use \\n\\n for paragraph breaks
}`;

export async function analyzeLead(lead: LeadInput): Promise<AIAnalysisResult> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  const userPrompt = `Lead information:
Name: ${lead.name}
Company: ${lead.company || "Not provided"}
Job Title: ${lead.jobTitle || "Not provided"}
Message: "${lead.message}"

Analyze this lead and produce the JSON described in your instructions.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-4-5",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("AI API returned no text content");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();

  let parsed: AIAnalysisResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  if (
    !parsed.intent ||
    !parsed.leadScore ||
    !Array.isArray(parsed.painPoints) ||
    !parsed.recommendedApproach ||
    !parsed.emailSubject ||
    !parsed.emailBody
  ) {
    throw new Error("AI response missing required fields");
  }

  return parsed;
}

// Regenerate just the email (subject + body) while keeping prior analysis context,
// optionally with rep instructions (e.g. "make it shorter", "more formal").
export async function regenerateEmail(
  lead: LeadInput,
  priorAnalysis: Pick<AIAnalysisResult, "intent" | "painPoints" | "recommendedApproach">,
  instructions?: string
): Promise<{ emailSubject: string; emailBody: string }> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  const userPrompt = `Lead: ${lead.name} (${lead.jobTitle || "unknown title"} at ${
    lead.company || "unknown company"
  })
Original message: "${lead.message}"
Known intent: ${priorAnalysis.intent}
Known pain points: ${priorAnalysis.painPoints.join("; ")}
Recommended approach: ${priorAnalysis.recommendedApproach}
${instructions ? `Additional instructions from the sales rep: ${instructions}` : ""}

Write ONLY a JSON object: { "emailSubject": string, "emailBody": string }`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-4-5",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
  const cleaned = (textBlock?.text || "").replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
