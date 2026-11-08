// Tells iOS which sparkyq.com links open the SparkyQ app instead of Safari (universal links).
// Needs APPLE_TEAM_ID (Apple Developer → Membership); until it's set this 404s and links
// simply open in Safari.
export function GET() {
  const teamId = process.env.APPLE_TEAM_ID;
  if (!teamId) return new Response("Not found", { status: 404 });

  return Response.json({
    applinks: {
      details: [
        {
          appIDs: [`${teamId}.au.com.sparkyq.app`],
          components: [
            { "/": "/auth/*", comment: "Sign-in links from email" },
            { "/": "/questions/*" },
            { "/": "/u/*" },
            { "/": "/feed" },
            { "/": "/notifications" },
          ],
        },
      ],
    },
  });
}
