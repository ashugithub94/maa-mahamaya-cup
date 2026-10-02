import { NextResponse } from "next/server";
import { registrationSchema, validateFile } from "@/lib/validation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo");
    const receipt = formData.get("receipt");
    const photoFile = photo instanceof File && photo.size > 0 ? photo : undefined;
    const photoError = validateFile(photoFile, { required: false });
    const receiptError = validateFile(receipt instanceof File ? receipt : undefined, { required: true, receipt: true });
    if (photoError || receiptError) return NextResponse.json({ error: photoError || receiptError }, { status: 400 });

    const parsed = registrationSchema.safeParse({
      name: asString(formData.get("name")), mobile: asString(formData.get("mobile")), age: asString(formData.get("age")),
      jerseyName: asString(formData.get("jerseyName")), jerseyNumber: asString(formData.get("jerseyNumber")),
      tshirtSize: asString(formData.get("tshirtSize")), trouserSize: asString(formData.get("trouserSize")), role: asString(formData.get("role")),
      battingStyle: asString(formData.get("battingStyle")), bowlingStyle: asString(formData.get("bowlingStyle")), notes: asString(formData.get("notes")),
      photo, receipt, join: formData.get("join") === "true", terms: formData.get("terms") === "true"
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue?.message || "Please check the form and try again." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: duplicate, error: duplicateError } = await supabase.from("registrations").select("id").eq("mobile", parsed.data.mobile).maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicate) return NextResponse.json({ error: "This mobile number is already registered for the cup." }, { status: 409 });

    const receiptFile = receipt as File;
    const receiptExtension = receiptFile.type === "application/pdf" ? "pdf" : "jpg";
    const receiptPath = `receipts/${crypto.randomUUID()}.${receiptExtension}`;
    const photoPath = photoFile ? `photos/${crypto.randomUUID()}.jpg` : null;
    const photoUpload = photoFile && photoPath
      ? await supabase.storage.from("receipts").upload(photoPath, photoFile, { contentType: "image/jpeg", upsert: false })
      : null;
    const receiptUpload = await supabase.storage.from("receipts").upload(receiptPath, receiptFile, { contentType: receiptFile.type, upsert: false });
    if (photoUpload?.error) throw photoUpload.error;
    if (receiptUpload.error) throw receiptUpload.error;

    const { data, error } = await supabase.from("registrations").insert({
      name: parsed.data.name, mobile: parsed.data.mobile, age: parsed.data.age,
      jersey_name: parsed.data.jerseyName || null, jersey_number: parsed.data.jerseyNumber ?? null,
      tshirt_size: parsed.data.tshirtSize, trouser_size: parsed.data.trouserSize, role: parsed.data.role,
      batting_style: parsed.data.battingStyle, bowling_style: parsed.data.bowlingStyle, notes: parsed.data.notes || null,
      photo_url: photoPath, receipt_url: receiptPath, status: "pending"
    }).select("registration_code").single();
    if (error) {
      if (error.code === "23505" && error.message.includes("mobile")) return NextResponse.json({ error: "This mobile number is already registered for the cup." }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ ok: true, registrationCode: data.registration_code });
  } catch (error) {
    console.error("registration_error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "We could not save your registration right now." }, { status: 500 });
  }
}
