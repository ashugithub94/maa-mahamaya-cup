import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, isAdminTokenValid } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { validateFile } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminTokenValid(cookies().get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const photo = formData.get("photo");
    const file = photo instanceof File && photo.size > 0 ? photo : undefined;
    const fileError = validateFile(file, { required: true });
    if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from("registrations")
      .select("photo_url")
      .eq("id", params.id)
      .single();
    if (currentError) throw currentError;

    const photoPath = `photos/admin-${crypto.randomUUID()}.jpg`;
    const upload = await supabase.storage.from("receipts").upload(photoPath, file as File, {
      contentType: "image/jpeg",
      upsert: false
    });
    if (upload.error) throw upload.error;

    const { error: updateError } = await supabase
      .from("registrations")
      .update({ photo_url: photoPath })
      .eq("id", params.id);
    if (updateError) {
      await supabase.storage.from("receipts").remove([photoPath]);
      throw updateError;
    }

    if (current.photo_url) {
      const { error: removeError } = await supabase.storage.from("receipts").remove([current.photo_url]);
      if (removeError) console.error("admin_old_photo_remove_error", removeError);
    }

    const { data: signed } = await supabase.storage.from("receipts").createSignedUrl(photoPath, 60 * 20);
    return NextResponse.json({ ok: true, photo_preview_url: signed?.signedUrl || null });
  } catch (error) {
    console.error("admin_photo_upload_error", error);
    return NextResponse.json({ error: "Could not upload the profile photo." }, { status: 500 });
  }
}
