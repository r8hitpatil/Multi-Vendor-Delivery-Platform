"use server"

import { getSession } from "@/app/libs/auth";
import { handleActionError } from "@/app/libs/errors";
import { createToken } from "@/app/libs/jwt";
import { prisma } from "@/app/libs/prisma";
import * as argon from "argon2";
import { cookies } from "next/headers";

type LoginBody = {
  email: string;
  password: string;
};

export async function loginAction(body: LoginBody) {
  try {
    const { email, password } = body;

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

export async function isBanned() {
  try {
    const session = await getSession();
    if (!session?.email) {
      return {
        success: false,
        message: 'No session found'
      }
    }
    const searchBan = await prisma.user.findUnique({
      where: {
        email: session.email
      }
    })
    if (!searchBan) {
      return {
        success: false,
        message: 'No user found'
      }
    }
    return {
      success: true,
      message: 'Ban values',
      data: searchBan
    };
  } catch (error) {
    return handleActionError(error);
  }
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
      companyId : true
    }
  })
  if(!admin?.companyId){
    throw new Error("Admin is not assigned to any company");
  }
  return {
    adminId : admin.id,
    companyId : admin.companyId
  };
}