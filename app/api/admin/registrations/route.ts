import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, isAdminTokenValid } from "@/lib/admin-auth";
import { adminStatusSchema } from "@/lib/validation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function authorized() {
  return isAdminTokenValid(cookies().get(COOKIE_NAME)?.value);
}

export async function GET(request: NextRequest) {
  if (!authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const status = request.nextUrl.searchParams.get("status");
    const supabase = getSupabaseAdmin();
    let query = supabase.from("registrations").select("*").order("created_at", { ascending: false });
    if (status && ["pending", "approved", "rejected"].includes(status)) query = query.eq("status", status);
    if (search) query = query.or(`name.ilike.%${search}%,mobile.ilike.%${search}%,registration_code.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    const rows = await Promise.all((data || []).map(async (row) => {
      const [photo, receipt] = await Promise.all([
        row.photo_url ? Promise.resolve(`${request.nextUrl.origin}/api/public/profile-photo/${encodeURIComponent(row.id)}`) : Promise.resolve(null),
        row.receipt_url ? supabase.storage.from("receipts").createSignedUrl(row.receipt_url, 60 * 20) : Promise.resolve({ data: null })
      ]);
      return { ...row, photo_preview_url: photo || null, receipt_preview_url: receipt.data?.signedUrl || null };
    }));
    return NextResponse.json({ registrations: rows });
  } catch (error) {
    console.error("admin_list_error", error);
    return NextResponse.json({ error: "Could not load registrations." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const parsed = adminStatusSchema.safeParse({ status: body.status });
  if (!body.id || !parsed.success) return NextResponse.json({ error: "Invalid registration update." }, { status: 400 });
  try {
    const { error } = await getSupabaseAdmin().from("registrations").update({ status: parsed.data.status }).eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin_update_error", error);
    return NextResponse.json({ error: "Could not update this registration." }, { status: 500 });
  }
}
