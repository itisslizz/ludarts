import type { NextRequest } from "next/server";

const BOARD_URL = process.env.BOARD_URL || "http://autodarts.local:3180";

const PUT_ACTIONS = ["start", "stop"];
const POST_ACTIONS = ["reset"];

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/autodarts/[action]">,
) {
  const { action } = await ctx.params;

  if (!POST_ACTIONS.includes(action)) {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BOARD_URL}/api/${action}`, {
      method: "POST",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ error: "Board unreachable" }, { status: 502 });
  }
}

export async function PUT(
  _req: NextRequest,
  ctx: RouteContext<"/api/autodarts/[action]">,
) {
  const { action } = await ctx.params;

  if (!PUT_ACTIONS.includes(action)) {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BOARD_URL}/api/${action}`, {
      method: "PUT",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ error: "Board unreachable" }, { status: 502 });
  }
}
