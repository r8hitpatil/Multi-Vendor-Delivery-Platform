"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Building2,
  CirclePlus,
  LayoutDashboard,
  type LucideIcon,
  PackagePlus,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { NavContent, Role } from "@/app/config/nav-config";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { cn } from "cn";

function getNavIcon(title: string): LucideIcon {
  const lower = title.toLowerCase();
  if (lower.includes("home")) return LayoutDashboard;
  if (lower.includes("create product") || lower.includes("add product")) return PackagePlus;
  if (lower.includes("manage product") || lower.includes("product")) return Boxes;
  if (lower.includes("create company") || lower.includes("company")) return Building2;
  if (lower.includes("driver")) return Truck;
  if (lower.includes("admin")) return ShieldCheck;
  if (lower.includes("vendor")) return Store;
  if (lower.includes("create")) return CirclePlus;
  return LayoutDashboard;
}

export function NavMain({ roleIs, groups }: { roleIs: Role; groups: NavContent }) {
  const content = groups?.[roleIs];
  const { setOpenMobile, isMobile } = useSidebar();
  const pathname = usePathname();

  if (!content || !content.actions) return null;

  return (
    <SidebarContent className="px-2 pt-2">
      <SidebarGroup className="p-0">
        <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-2 py-1 mb-1 select-none">
          Navigation
        </SidebarGroupLabel>
        <SidebarMenu className="gap-1">
          {content.actions.map((item) => {
            const isActive = pathname === item.url;
            const Icon = getNavIcon(item.title);

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  isActive={isActive}
                  className={cn(
                    "h-9 px-2.5 rounded-lg text-[13px] transition-colors gap-2.5",
                    isActive
                      ? "font-semibold text-neutral-900 bg-neutral-200/70 shadow-2xs"
                      : "font-normal text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 hover:font-medium"
                  )}
                  render={
                    <Link
                      href={item.url}
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                    />
                  }
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive ? "text-neutral-900" : "text-neutral-400 group-hover/menu-button:text-neutral-700"
                    )}
                  />
                  <span className={cn(isActive ? "font-semibold" : "font-normal")}>
                    {item.title}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}