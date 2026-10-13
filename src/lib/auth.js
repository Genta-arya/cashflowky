import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NAME = "duitku_token";
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "duitku_cashflow_super_secret_jwt_key_2026_secured"
);

export async function signSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function comparePassword(plain, hashed) {
  return bcrypt.compareSync(plain, hashed);
}

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export { COOKIE_NAME };
