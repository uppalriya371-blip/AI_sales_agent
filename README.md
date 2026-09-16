# AI Sales Agent 
http://localhost:3001/login

Automated lead follow-up: inbound leads are analyzed by AI, a personalized
email is drafted, and it's created as a **draft** in the sales rep's Gmail
account for manual review and send.

## Stack

- Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth (email-based session, scoped to internal dashboard use)
- Gmail API (OAuth 2.0, `gmail.compose` scope only)
- Anthropic Messages API for lead analysis + email generation

## Project structure

```
ai-sales-agent/
├── prisma/
│   └── schema.prisma          # User, Lead, AIAnalysis, EmailDraft, OAuthToken
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── leads/                          POST/GET leads
│   │   │   ├── leads/[id]/                     GET single lead
│   │   │   ├── leads/[id]/analyze/             POST → AI analysis
│   │   │   ├── leads/[id]/generate-email/      POST → (re)generate email
│   │   │   ├── auth/gmail/                     GET  → start OAuth flow
│   │   │   ├── auth/gmail/callback/            GET  → OAuth callback
│   │   │   ├── auth/[...nextauth]/             NextAuth handler
│   │   │   ├── gmail/create-draft/             POST → create Gmail draft
│   │   │   └── gmail/update-draft/             PUT  → update Gmail draft
│   │   ├── leads/[id]/page.tsx    # Lead detail + AI analysis + email editor
│   │   ├── settings/page.tsx      # Gmail connection status
│   │   ├── login/page.tsx         # Dashboard sign-in
│   │   ├── layout.tsx / page.tsx  # Root layout + leads dashboard
│   │   └── globals.css
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── LeadsTable.tsx
│   │   ├── AIAnalysisCard.tsx
│   │   ├── EmailEditor.tsx
│   │   └── Providers.tsx
│   ├── lib/
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── ai.ts            # AI analysis + email generation
│   │   ├── gmail.ts         # OAuth + draft create/update via Gmail API
│   │   ├── crypto.ts        # AES-256-GCM encryption for stored tokens
│   │   ├── validation.ts    # Zod schemas
│   │   ├── rateLimit.ts     # In-memory rate limiter for /api/leads
│   │   ├── dedupe.ts        # Duplicate-submission guard
│   │   ├── authOptions.ts   # NextAuth config
│   │   └── session.ts       # getCurrentUserId() server helper
│   ├── types/index.ts
│   └── middleware.ts        # Protects dashboard routes (not /api/leads)
├── .env.example
└── package.json
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Database

Create a Postgres database, then set `DATABASE_URL` in `.env` (copy
`.env.example` → `.env` first). Run migrations:

```bash
npx prisma migrate dev --name init
```

### 3. Google Cloud / Gmail API

1. In [Google Cloud Console](https://console.cloud.google.com/), create a
   project and enable the **Gmail API**.
2. Configure the OAuth consent screen (internal or external, add your
   sales reps as test users if using External + Testing mode).
3. Create an **OAuth 2.0 Client ID** (Web application).
   - Authorized redirect URI: `http://localhost:3000/api/auth/gmail/callback`
     (update to your production URL when deploying).
4. Copy the Client ID and Client Secret into `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
   ```

### 4. AI provider

Set `AI_API_KEY` to an Anthropic API key. `AI_MODEL` defaults to
`claude-sonnet-4-5` — override if you want a different model.

### 5. Secrets

```bash
# NextAuth session secret
openssl rand -base64 32   # → NEXTAUTH_SECRET

# Token encryption key (32 bytes, hex)
openssl rand -hex 32      # → TOKEN_ENCRYPTION_KEY
```

Set `NEXTAUTH_URL=http://localhost:3000` for local dev.

### 6. Run

```bash
npm run dev
```

Visit `http://localhost:3000`, sign in with a work email, then go to
**Settings → Connect Gmail Account** to authorize draft creation.

## Sending a test lead

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@example.com",
    "company": "Acme Inc.",
    "jobTitle": "Marketing Manager",
    "message": "I am interested in learning more about your product.",
    "source": "Website Contact Form"
  }'
```

Then open the dashboard, click into the lead, hit **Analyze Lead with AI**,
review the generated email, and click **Create Gmail Draft**. The draft
appears in the connected account's Gmail Drafts folder — nothing is sent
automatically.

## Security notes

- Gmail OAuth tokens are encrypted at rest (AES-256-GCM) via `lib/crypto.ts`.
- The Gmail OAuth scope is `gmail.compose` only — this app can create/edit
  drafts but cannot read the inbox or send mail directly.
- `/api/leads` (POST) is intentionally unauthenticated (website forms need
  to call it) but is rate-limited per IP and guards against duplicate
  submissions. Put it behind your own webhook secret or CAPTCHA if it's
  public-facing in production.
- All other API routes require a signed-in dashboard session.
- Never commit `.env` — only `.env.example` is checked in.

## Known scaffold limitations (polish before production)

- `NEXTAUTH` uses a lightweight "email only" credentials provider for
  demo purposes — replace with your real IdP (Google Workspace SSO, Okta,
  etc.) before shipping.
- The rate limiter is in-memory (per server instance) — swap for a
  Redis-backed limiter if you run multiple instances.
- The login page currently renders inside the same layout as the
  dashboard (so the sidebar shows on `/login` too) — split into a
  route group (`(auth)` vs `(dashboard)`) if you want a clean login screen.
- No automated tests are included.
