export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const metric = await request.json();

    if (process.env.NODE_ENV !== "production") {
      console.debug("[Web Vitals]", metric);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid metric payload" }, { status: 400 });
  }
}
