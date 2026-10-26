import { SidebarHeader } from "../ui/sidebar";

type NavHeaderProps = {
  label: string;
};

const ROLE_TITLES: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  VENDOR: "Vendor",
  CUSTOMER: "Customer",
};

export function NavHeader({ label }: NavHeaderProps) {
  const title =
    ROLE_TITLES[label] ||
    (label
      ? label.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
      : "Dashboard");

  return (
    <SidebarHeader className="border-b border-sidebar-border/60 px-4.5 py-4.5">
      <span className="text-[17px] font-bold tracking-wide text-neutral-900 truncate">
        {title}
      </span>
    </SidebarHeader>
  );
}