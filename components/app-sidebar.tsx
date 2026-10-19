import {
  Sidebar
} from "@/components/ui/sidebar"
import { NavHeader } from "./sidebar/nav-header"
import { Role, TableContents } from "@/app/config/nav-config";
import { NavMain } from "./sidebar/nav-main";

export default function AppSidebar({role}:{role:Role}) {
  return (
    <Sidebar>
      <NavHeader label={role}/>
      <NavMain roleIs={role} groups={TableContents} />
    </Sidebar>
  )
}