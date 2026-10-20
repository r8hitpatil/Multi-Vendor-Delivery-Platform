import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "../generated/prisma/enums";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET
);

// 1. Create Token
export async function createToken(payload: { sub: string; role: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // expires in 7 days
    .sign(secret);
}

// 2. Verify Token
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; role: string; email: string };
  } catch (error) {
    return null; // Invalid or expired token
  }
}

export async function getSession(){
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if(!token) return null;

  const payload = await verifyToken(token);
  if(!payload) return null;

  return {
    userId : payload.sub,
    email : payload.email,
    role : payload.role as Role
  }
}