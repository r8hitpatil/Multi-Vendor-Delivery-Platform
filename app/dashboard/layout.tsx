import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { ReactNode } from "react";
import { verifyToken } from "../libs/auth";
import { Role } from "../config/nav-config";

export const instant = false;

export default async function SidebarLayout({ children } : {children : ReactNode}) {

    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const session = token ? await verifyToken(token) : null;

    const role = session?.role as Role;

    return (
        <SidebarProvider>
            <AppSidebar role={role}/>
                <main className="p-6 flex-1">
                    <SidebarTrigger/>
                    {children}
                </main>
        </SidebarProvider>
    )
}