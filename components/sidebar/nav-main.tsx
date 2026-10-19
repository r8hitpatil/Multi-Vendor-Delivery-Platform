import { NavContent , Role } from "@/app/config/nav-config";
import { SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import Link from "next/link";

export function NavMain({roleIs,groups} : {roleIs : Role; groups : NavContent}) {
    const content = groups[roleIs];
    return (
    <SidebarContent>
        <SidebarGroup>
            <SidebarGroupLabel>
                {roleIs}
            </SidebarGroupLabel>
            <SidebarMenu>
              {content.actions.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton render={<Link href={item.url}/>}>
                      <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
        </SidebarGroup>
    </SidebarContent>
  )
}