"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { logout } from "@/app/api/auth/action";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";

export function NavFooter() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLogout = () => {
    startTransition(async () => {
      if (isMobile) {
        setOpenMobile(false);
      }
      await logout();
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <SidebarFooter className="border-t border-sidebar-border/60 p-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={handleLogout}
            disabled={isPending}
            className="h-9 px-2.5 rounded-lg text-[13px] text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors gap-2.5 cursor-pointer font-medium"
          >
            {isPending ? (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            ) : (
              <LogOut className="size-4 shrink-0" />
            )}
            <span>{isPending ? "Logging out..." : "Log Out"}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
