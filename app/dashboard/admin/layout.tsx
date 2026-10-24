import { requireAdmin } from "@/app/api/auth/action";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const instant = false;

export default async function AdminLayout({children} : {children : ReactNode}){
    try {
        await requireAdmin();
    } catch (error) {
        redirect('/dashboard');
    }
    return <>{children}</>
}