"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, ClipboardCopy, ExternalLink, LoaderCircle, LockKeyhole, ShieldCheck, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { BATTING_STYLES, BOWLING_STYLES, ROLES, SIZES, TOURNAMENT } from "@/lib/constants";
import { registrationSchema, type RegistrationValues, validateFile } from "@/lib/validation";
import { FileDropzone } from "./FileDropzone";
import { ImageCropper } from "./ImageCropper";
import { AssetImage } from "./AssetImage";

type ApiSuccess = { ok: true; registrationCode: string };

function ChoiceGroup({ name, options, value, onChange, label }: { name: string; options: readonly string[]; value?: string; onChange: (value: string) => void; label: string }) {
  return <fieldset className="field"><legend>{label} <span className="required">*</span></legend><div className="choice-grid">{options.map((option) => <label className="choice" key={option}><input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} /><span>{option}</span></label>)}</div></fieldset>;
}

function Confetti() {
  return <>{Array.from({ length: 42 }).map((_, index) => <i key={index} className="confetti" style={{ left: `${(index * 17) % 100}%`, background: index % 3 === 0 ? "#f4c84b" : index % 3 === 1 ? "#f05745" : "#dce8f7", animationDelay: `${(index % 12) * .08}s`, transform: `rotate(${index * 29}deg)` }} />)}</>;
}

function SuccessScreen({ registrationCode }: { registrationCode: string }) {
  const message = encodeURIComponent(`I just registered for MAA MAHAMAYA CUP – KUMHARI, SEASON 01! My registration ID is ${registrationCode}. Join the cup: ${TOURNAMENT.siteUrl}/register`);
  return <div className="success-screen"><Confetti /><div className="success-inner"><div className="success-icon"><Check size={36} /></div><span className="eyebrow">Registration received</span><h1 className="display">You&apos;re in.</h1><p>Your details and payment proof are with the committee. The admin team will manually verify your payment, approve your registration, or contact you if anything needs clarification.</p><span className="registration-id">{registrationCode}</span><div className="hero-actions" style={{ justifyContent: "center" }}><a className="btn-primary" href={`https://wa.me/?text=${message}`} target="_blank" rel="noreferrer">Share on WhatsApp <ExternalLink size={15} /></a><Link href="/" className="btn-secondary">Back to home</Link></div></div></div>;
}

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) return file;
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => { const element = new Image(); element.onload = () => resolve(element); element.onerror = reject; element.src = source; });
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", .82));
    return blob ? new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } finally { URL.revokeObjectURL(source); }
}

export function RegistrationWizard() {
  const [step, setStep] = useState(1);
  const [cropFile, setCropFile] = useState<File>();
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { register, setValue, watch, trigger, handleSubmit, formState: { errors } } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema), mode: "onBlur", defaultValues: { name: "", mobile: "", jerseyName: "", notes: "", photo: undefined, receipt: undefined, join: false, terms: false }
  });
  const photo = watch("photo") as File | undefined;
  const receipt = watch("receipt") as File | undefined;
  const role = watch("role");
  const battingStyle = watch("battingStyle");
  const bowlingStyle = watch("bowlingStyle");
  const progress = `${(step / 3) * 100}%`;
  const stepFields = useMemo(() => ({ 1: ["name", "mobile", "age", "tshirtSize", "trouserSize"] as const, 2: ["role", "battingStyle", "bowlingStyle"] as const, 3: ["receipt", "join", "terms"] as const }), []);

  function showFileError(field: "photo" | "receipt", message?: string) { if (message) setValue(field, undefined, { shouldValidate: true }); return message; }
  function handlePhoto(file: File) { const error = validateFile(file, { required: true }); if (error) { showFileError("photo", error); setSubmitError(error); return; } setSubmitError(""); setCropFile(file); }
  function handleReceipt(file: File) { const error = validateFile(file, { required: true, receipt: true }); if (error) { showFileError("receipt", error); setSubmitError(error); return; } setSubmitError(""); setValue("receipt", file, { shouldValidate: true }); }

  async function nextStep() { const valid = await trigger(stepFields[step as 1 | 2 | 3]); if (valid) { setSubmitError(""); setStep((current) => Math.min(3, current + 1)); } }
  async function onSubmit(values: RegistrationValues) {
    setSubmitting(true); setSubmitError("");
    try {
      if (!values.receipt) throw new Error("Please add your payment receipt.");
      const formData = new FormData();
      const photoFile = values.photo ? await compressImage(values.photo) : undefined; const receiptFile = await compressImage(values.receipt);
      for (const [key, value] of Object.entries(values)) { if (key !== "photo" && key !== "receipt" && value !== undefined) formData.append(key, String(value)); }
      if (photoFile) formData.append("photo", photoFile); formData.append("receipt", receiptFile);
      const response = await fetch("/api/register", { method: "POST", body: formData }); const result = await response.json() as ApiSuccess & { error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "We could not complete your registration. Please try again.");
      setSuccess(result.registrationCode);
    } catch (error) { setSubmitError(error instanceof Error ? error.message : "Something went wrong. Please try again."); } finally { setSubmitting(false); }
  }

  if (success) return <SuccessScreen registrationCode={success} />;

  return <>
    {cropFile && <ImageCropper file={cropFile} onCancel={() => setCropFile(undefined)} onComplete={(file) => { setValue("photo", file, { shouldValidate: true }); setCropFile(undefined); }} />}
    <div className="progress-wrap"><div className="progress-meta"><span>Step {step} of 3</span><span>{step === 1 ? "Player details" : step === 2 ? "Cricket profile" : "Payment"}</span></div><div className="progress-track"><div className="progress-bar" style={{ width: progress }} /></div></div>
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {step === 1 && <section className="form-panel"><h2>Tell us about you.</h2><p>We need the basics for your team card and match-day kit.</p><div className="field-grid">
        <div className="field"><label>Profile photo <span style={{ color: "#718096", fontWeight: 500 }}>(optional)</span></label><FileDropzone kind="photo" file={photo} onFile={handlePhoto} onRemove={() => setValue("photo", undefined, { shouldValidate: true })} />{errors.photo?.message && <span className="error-text">{String(errors.photo.message)}</span>}</div>
        <div className="field-grid two"><div className="field"><label htmlFor="name">Full name <span className="required">*</span></label><input id="name" className="input" placeholder="e.g. Arjun Verma" {...register("name")} />{errors.name && <span className="error-text">{errors.name.message}</span>}</div><div className="field"><label htmlFor="mobile">Mobile number <span className="required">*</span></label><input id="mobile" className="input" inputMode="numeric" maxLength={10} placeholder="10-digit number" {...register("mobile")} />{errors.mobile && <span className="error-text">{errors.mobile.message}</span>}</div></div>
        <div className="field-grid two"><div className="field"><label htmlFor="age">Age <span className="required">*</span></label><input id="age" className="input" type="number" min={12} max={70} placeholder="Your age" {...register("age")} />{errors.age && <span className="error-text">{errors.age.message}</span>}</div><div className="field"><label htmlFor="jerseyName">Jersey name <span style={{ color: "#718096", fontWeight: 500 }}>(optional)</span></label><input id="jerseyName" className="input" maxLength={20} placeholder="What goes on the back?" {...register("jerseyName")} />{errors.jerseyName && <span className="error-text">{errors.jerseyName.message}</span>}</div></div>
        <div className="field-grid two"><div className="field"><label htmlFor="jerseyNumber">Jersey number <span style={{ color: "#718096", fontWeight: 500 }}>(optional)</span></label><input id="jerseyNumber" className="input" type="number" min={0} max={99} placeholder="00" {...register("jerseyNumber")} />{errors.jerseyNumber && <span className="error-text">{errors.jerseyNumber.message}</span>}</div><div /></div>
        <ChoiceGroup name="tshirtSize" label="T-shirt size" options={SIZES} value={watch("tshirtSize")} onChange={(value) => setValue("tshirtSize", value as RegistrationValues["tshirtSize"], { shouldValidate: true })} />{errors.tshirtSize && <span className="error-text">Choose a T-shirt size.</span>}
        <ChoiceGroup name="trouserSize" label="Trouser size" options={SIZES} value={watch("trouserSize")} onChange={(value) => setValue("trouserSize", value as RegistrationValues["trouserSize"], { shouldValidate: true })} />{errors.trouserSize && <span className="error-text">Choose a trouser size.</span>}
      </div></section>}
      {step === 2 && <section className="form-panel"><h2>Show us your game.</h2><p>Pick the options that best describe how you play.</p><div className="field-grid"><ChoiceGroup name="role" label="Playing role" options={ROLES} value={role} onChange={(value) => setValue("role", value as RegistrationValues["role"], { shouldValidate: true })} />{errors.role && <span className="error-text">Choose your playing role.</span>}<ChoiceGroup name="battingStyle" label="Batting style" options={BATTING_STYLES} value={battingStyle} onChange={(value) => setValue("battingStyle", value as RegistrationValues["battingStyle"], { shouldValidate: true })} />{errors.battingStyle && <span className="error-text">Choose your batting style.</span>}<ChoiceGroup name="bowlingStyle" label="Bowling style" options={BOWLING_STYLES} value={bowlingStyle} onChange={(value) => setValue("bowlingStyle", value as RegistrationValues["bowlingStyle"], { shouldValidate: true })} />{errors.bowlingStyle && <span className="error-text">Choose your bowling style.</span>}<div className="field"><label htmlFor="notes">Notes or experience <span style={{ color: "#718096", fontWeight: 500 }}>(optional)</span></label><textarea id="notes" className="textarea" placeholder="Tell the selectors anything useful..." {...register("notes")} />{errors.notes && <span className="error-text">{errors.notes.message}</span>}</div></div></section>}
      {step === 3 && <section className="form-panel"><h2>Lock in your spot.</h2><p>Complete payment, attach the proof, and you&apos;re ready to join Season 01.</p><div className="fee-card"><span>Player registration fee</span><strong>₹1,200</strong></div><div className="payment-grid"><div className="qr-wrap"><AssetImage src="/payment-qr.jpg" alt="Payment QR code for Rakesh Yadav" fallback={<span className="qr-fallback">Payment QR<br />will appear here</span>} /></div><div className="payment-copy"><p>Scan to pay <strong style={{ color: "#fff" }}>Rakesh Yadav</strong> via any UPI app.</p><div className="upi-row"><span className="upi-value">{TOURNAMENT.upiId}</span><button type="button" className="copy-button" onClick={async () => { await navigator.clipboard?.writeText(TOURNAMENT.upiId); setCopied(true); setTimeout(() => setCopied(false), 1800); }}><ClipboardCopy size={14} /> {copied ? "Copied" : "Copy UPI ID"}</button></div><a className="upi-button" href={`upi://pay?pa=${encodeURIComponent(TOURNAMENT.upiId)}&pn=${encodeURIComponent(TOURNAMENT.payee)}&am=${TOURNAMENT.fee}&cu=INR&tn=${encodeURIComponent("Maa Mahamaya Cup Registration")}`}><Trophy size={15} /> Pay with UPI app</a></div></div><div className="field"><label>Payment receipt / screenshot <span className="required">*</span></label><FileDropzone kind="receipt" file={receipt} onFile={handleReceipt} onRemove={() => setValue("receipt", undefined, { shouldValidate: true })} />{errors.receipt?.message && <span className="error-text">{String(errors.receipt.message)}</span>}</div><div className="check-stack"><label className="check-line"><input type="checkbox" {...register("join")} /><span>Yes, I want to join the MAA MAHAMAYA CUP – KUMHARI, SEASON 01.</span></label>{errors.join && <span className="error-text">{errors.join.message}</span>}<label className="check-line"><input type="checkbox" {...register("terms")} /><span>I agree to the <Link href="/terms" target="_blank">Terms and Privacy Policy</Link>.</span></label>{errors.terms && <span className="error-text">{errors.terms.message}</span>}</div></section>}
      {submitError && <div className="submit-error">{submitError}</div>}
      <div className="form-actions">{step > 1 ? <button type="button" className="btn-quiet" onClick={() => setStep((current) => current - 1)}><ChevronLeft size={15} /> Previous</button> : <Link href="/" className="btn-quiet"><ChevronLeft size={15} /> Home</Link>}{step < 3 ? <button type="button" className="btn-primary" onClick={nextStep}>Continue <ChevronRight size={15} /></button> : <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? <><LoaderCircle size={16} className="animate-spin" /> Joining...</> : <><ShieldCheck size={16} /> Join the cup</>}</button>}</div>
    </form>
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 22, color: "#667287", fontSize: 11 }}><LockKeyhole size={13} /> Your details are only shared with the tournament committee.</div>
  </>;
}
