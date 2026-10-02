import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "mmc_admin";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function signature(value: string) {
  const secret = `${process.env.ADMIN_USER_ID || ""}:${process.env.ADMIN_PASSWORD || ""}`;
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createAdminToken() {
  const value = `admin:${Date.now()}`;
  return `${value}.${signature(value)}`;
}

export function isAdminTokenValid(token: string | undefined) {
  if (!token || !process.env.ADMIN_USER_ID || !process.env.ADMIN_PASSWORD) return false;
  const [value, received] = token.split(".");
  if (!value || !received) return false;
  const expected = signature(value);
  const issuedAt = Number(value.split(":")[1]);
  const isFresh = Number.isFinite(issuedAt) && issuedAt <= Date.now() + 60_000 && Date.now() - issuedAt < SESSION_MAX_AGE_SECONDS * 1000;
  return isFresh && received.length === expected.length && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export { COOKIE_NAME };
