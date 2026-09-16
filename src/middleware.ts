import { withAuth } from "next-auth/middleware";

// Protects the dashboard UI (not the /api/leads ingestion endpoint,
// which website forms/webhooks must be able to call without a session).
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/", "/leads/:path*", "/settings/:path*"],
};
