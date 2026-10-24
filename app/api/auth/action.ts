"use server"

import { getSession } from "@/app/libs/auth";
import { handleActionError } from "@/app/libs/errors";
import { createToken } from "@/app/libs/jwt";
import { prisma } from "@/app/libs/prisma";
import * as argon from "argon2";
import { cookies } from "next/headers";
import { loginUserSchema } from "./schema";
import { zodError } from "@/app/libs/zod-error";

export async function loginAction(body: unknown) {
  try {
    const res = loginUserSchema.safeParse(body);
    if(!res.success){
      return zodError(res.error)
    }

    const { email , password } = res.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.ban) {
      return { success: false, message: "Your id is banned" }
    }

    const isValid = await argon.verify(user.password, password);

    if (!isValid) {
      return { success: false, message: "Invalid credentials" };
    }

    const token = await createToken({
      sub: user.id,
      role: user.Role,
      email: user.email,
    });

    const cookieStore = await cookies();

    cookieStore.set("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return {
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        email: user.email,
        role: user.Role,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function verifyMe() {
  const cookie = await cookies();

  cookie.get('access_token');
}

export async function requireAdmin(){
  const session = await getSession();
  if(session?.role !== "ADMIN"){
    throw new Error ("Unauthorized : Only authorized roles are allowed")
  }
  const admin = await prisma.user.findUnique({
    where : {
      email : session.email
    },
    select : {
      id : true,
      companyId : true,
      ban : true
    }
  })
  if(!admin?.companyId){
    throw new Error("Admin is not assigned to any company");
  }
  if(admin.ban){
    throw new Error("Admin account is banned");
  }
  return {
    adminId : admin.id,
    companyId : admin.companyId
  };
}

export async function requireVendor(){
  const session = await getSession();
  if(session?.role !== "VENDOR"){
    throw new Error ("Unauthorized : Only authorized roles are allowed")
  }
  const vendor = await prisma.user.findUnique({
    where : {
      email : session.email,
    },
    select : {
      id : true,
      companyId : true,
      status : true,
      ban : true,
      store : {
        select : {
          id : true,
        }
      }
    }
  })
  if(!vendor?.companyId){
    throw new Error("Vendor is not assigned to any admin");
  }
  return {
    adminId : vendor.id,
    storeId : vendor.store?.id,
    status : vendor.status,
    ban : vendor.ban
  };
}