import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  return new Response(
    JSON.stringify({
      message: "API test endpoint is working",
      method: request.method,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
