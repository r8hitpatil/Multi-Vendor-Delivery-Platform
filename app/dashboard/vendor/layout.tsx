import { requireVendor } from "@/app/api/auth/action";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const instant = false;

export default async function VendorLayout({ children }: { children: ReactNode }) {
  try {
    await requireVendor();
  } catch {
    redirect("/dashboard");
  }

  return <>{children}</>;
}