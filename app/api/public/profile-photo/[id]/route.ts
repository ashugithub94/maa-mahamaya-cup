import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("name, photo_url")
      .eq("id", params.id)
      .single();
    if (registrationError) throw registrationError;
    if (!registration.photo_url) return NextResponse.json({ error: "No profile photo found." }, { status: 404 });

    // New photos use the public bucket; old registrations are read from the legacy private bucket.
    const buckets = ["profile-photos", "receipts"];
    let file: Blob | null = null;
    let contentType = "image/jpeg";
    for (const bucket of buckets) {
      const result = await supabase.storage.from(bucket).download(registration.photo_url);
      if (!result.error && result.data) {
        file = result.data;
        contentType = result.data.type || contentType;
        break;
      }
    }
    if (!file) return NextResponse.json({ error: "Profile photo file not found." }, { status: 404 });

    const safeName = String(registration.name || "profile-photo").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "profile-photo";
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}.jpg"`,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    console.error("public_profile_photo_error", error);
    return NextResponse.json({ error: "Could not open the profile photo." }, { status: 404 });
  }
}
