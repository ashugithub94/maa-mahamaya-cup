import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, isAdminTokenValid } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function csvValue(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  if (!isAdminTokenValid(cookies().get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
        row.photo_url ? Promise.resolve(supabase.storage.from("profile-photos").getPublicUrl(row.photo_url).data.publicUrl) : Promise.resolve(null),
        row.receipt_url ? supabase.storage.from("receipts").createSignedUrl(row.receipt_url, 60 * 60 * 24) : Promise.resolve({ data: null })
      ]);
      return [
        row.registration_code, row.name, row.mobile, row.age, row.jersey_name, row.jersey_number,
        row.tshirt_size, row.trouser_size, row.role, row.batting_style, row.bowling_style,
        row.notes, row.status, row.created_at, photo || "", receipt.data?.signedUrl || ""
      ].map(csvValue).join(",");
    }));

    const headers = ["Registration ID", "Name", "Mobile", "Age", "Jersey name", "Jersey number", "T-shirt", "Trouser", "Role", "Batting style", "Bowling style", "Notes", "Status", "Created at", "Profile photo URL", "Receipt URL (24h)"];
    const csv = [headers.map(csvValue).join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=mmc-registrations-shareable.csv"
      }
    });
  } catch (error) {
    console.error("admin_export_error", error);
    return NextResponse.json({ error: "Could not export registrations." }, { status: 500 });
  }
}
