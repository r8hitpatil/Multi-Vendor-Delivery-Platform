import { cookies } from "next/headers";
import { Role } from "../generated/prisma/enums";
import { verifyToken } from "./jwt";
import { prisma } from "./prisma";

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

export async function requireSuperAdmin(){
  const session = await getSession();
  if(!session  || session.role !== "SUPER_ADMIN"){
    throw new Error ("Unauthorized : Only authorized roles are allowed")
  }
  const superAdmin = await prisma.user.findFirst({
    where : {
      email : session?.email
    }
  });

  if(!superAdmin){
    throw new Error("Super admin account not found");
  }
  if(superAdmin?.ban){
    throw new Error("Super admin is banned!");
  }
  return session;
}