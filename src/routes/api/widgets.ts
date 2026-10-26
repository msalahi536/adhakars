import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/widgets")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        try {
          const { buildWidgetPayload } = await import("@/lib/widgets.server");
          const payload = await buildWidgetPayload();
          // A degraded (empty fallback) feed is flagged and never cached, so a recovery shows up at once.
          return Response.json(payload, {
            headers: payload.degraded
              ? { ...CORS, "Cache-Control": "no-store", "X-Widget-Feed": "fallback-empty" }
              : { ...CORS, "Cache-Control": "public, max-age=300" },
          });
        } catch (e) {
          console.error("widgets api", e);
          return Response.json({ error: "unavailable" }, { status: 500, headers: CORS });
        }
      },
    },
  },
});
