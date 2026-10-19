import { Sparkles } from "lucide-react";
import { SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

type NavHeaderProps = {
    label : string
}

export function NavHeader({ label }:NavHeaderProps) {
    return (
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton>
                        <div>
                            <Sparkles/>
                        </div>
                        <div>
                            <span>
                                {label}
                            </span>
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>
    )
}