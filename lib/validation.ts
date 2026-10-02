import { z } from "zod";
import { BATTING_STYLES, BOWLING_STYLES, ROLES, SIZES } from "./constants";

const size = z.enum(SIZES);

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  age: z.coerce.number().int("Age must be a whole number.").min(12, "Players must be at least 12.").max(70, "Please enter a valid age."),
  jerseyName: z.string().trim().max(20, "Jersey name must be 20 characters or less.").optional().or(z.literal("")),
  jerseyNumber: z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().int().min(0).max(99).optional()),
  tshirtSize: size,
  trouserSize: size,
  role: z.enum(ROLES),
  battingStyle: z.enum(BATTING_STYLES),
  bowlingStyle: z.enum(BOWLING_STYLES),
  notes: z.string().trim().max(500, "Keep your notes under 500 characters.").optional().or(z.literal("")),
  photo: z.any().optional(),
  receipt: z.any(),
  join: z.boolean().refine(Boolean, "Please confirm that you want to join."),
  terms: z.boolean().refine(Boolean, "Please accept the Terms and Privacy Policy.")
});

export type RegistrationValues = z.infer<typeof registrationSchema>;

export const adminStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"])
});

export function validateFile(file: File | undefined, options: { required: boolean; receipt?: boolean }) {
  if (!file) return options.required ? "Please upload this file." : undefined;
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) return "File must be 2MB or smaller.";
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  if (!isImage && !(options.receipt && isPdf)) return options.receipt ? "Upload an image or PDF receipt." : "Upload an image file.";
  return undefined;
}
