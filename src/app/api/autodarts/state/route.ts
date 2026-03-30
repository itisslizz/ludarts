export async function GET() {
  try {
    const res = await fetch("http://autodarts.local:3180/api/state", {
      cache: "no-store",
    });
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ status: "offline", running: false, throws: [] });
  }
}
