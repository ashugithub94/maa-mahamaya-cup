import { NextResponse } from "next/server";
import { COOKIE_NAME, createAdminToken, SESSION_MAX_AGE_SECONDS } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!process.env.ADMIN_USER_ID || !process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Admin login is not configured on the server." }, { status: 500 });
  if (body.userId !== process.env.ADMIN_USER_ID || body.password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Incorrect admin user ID or password." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, createAdminToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE_SECONDS });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
  return response;
}
