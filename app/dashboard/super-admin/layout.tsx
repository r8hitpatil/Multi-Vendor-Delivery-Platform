import { requireSuperAdmin } from "@/app/libs/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const instant = false;

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireSuperAdmin();
  } catch {
    redirect("/dashboard");
  }

  return <>{children}</>;
}