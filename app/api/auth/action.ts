"use server"

import { createToken } from "@/app/libs/auth";
import { prisma } from "@/app/libs/prisma";
import * as argon from "argon2";
import { cookies } from "next/headers";

type LoginBody = {
  email: string;
  password: string;
};

export async function loginAction(body: LoginBody) {
  const { email, password } = body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, message: "User not found" };
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

  cookieStore.set("access_token",token,{
      httpOnly : true,
      secure : process.env.NODE_ENV === "production",
      sameSite : "lax",
      path : "/",
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
}

export async function verifyMe(){
  const cookie = await cookies();

  cookie.get('access_token');
}