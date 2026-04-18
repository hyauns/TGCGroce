import { type NextRequest, NextResponse } from "next/server"

export function assertSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")

  if (!origin || !host) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

  try {
    if (new URL(origin).host !== host) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

  return null
}
