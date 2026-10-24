import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, isAdminTokenValid } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { validateFile } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isAdminTokenValid(cookies().get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: registration, error } = await supabase
      .from("registrations")
      .select("photo_url")
      .eq("id", params.id)
      .single();
    if (error) throw error;
    if (!registration.photo_url) return NextResponse.json({ error: "No profile photo found." }, { status: 404 });

    const { data: signed, error: signedError } = await supabase.storage
      .from("receipts")
      .createSignedUrl(registration.photo_url, 60);
    if (signedError || !signed?.signedUrl) throw signedError || new Error("Could not create photo link.");
    return NextResponse.redirect(signed.signedUrl);
  } catch (error) {
    console.error("admin_photo_view_error", error);
    return NextResponse.json({ error: "Could not open the profile photo." }, { status: 500 });
  }
}

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
    const upload = await supabase.storage.from("profile-photos").upload(photoPath, file as File, {
      contentType: "image/jpeg",
      upsert: false
    });
    if (upload.error) throw upload.error;

    const { error: updateError } = await supabase
      .from("registrations")
      .update({ photo_url: photoPath })
      .eq("id", params.id);
    if (updateError) {
      await supabase.storage.from("profile-photos").remove([photoPath]);
      throw updateError;
    }

    if (current.photo_url) {
      const [profilePhotoRemove, legacyPhotoRemove] = await Promise.all([
        supabase.storage.from("profile-photos").remove([current.photo_url]),
        supabase.storage.from("receipts").remove([current.photo_url])
      ]);
      if (profilePhotoRemove.error || legacyPhotoRemove.error) console.error("admin_old_photo_remove_error", profilePhotoRemove.error || legacyPhotoRemove.error);
    }

    const { data: publicPhoto } = supabase.storage.from("profile-photos").getPublicUrl(photoPath);
    return NextResponse.json({ ok: true, photo_preview_url: publicPhoto.publicUrl });
  } catch (error) {
    console.error("admin_photo_upload_error", error);
    return NextResponse.json({ error: "Could not upload the profile photo." }, { status: 500 });
  }
}
