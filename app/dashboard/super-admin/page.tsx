import Link from "next/link";
import { Building2, UserPlus, Users } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const NAVIGATION_CARDS = [
  {
    title: "Create Admin",
    description: "Register new company-assigned administrators and assign credentials.",
    href: "/dashboard/super-admin/create-admin",
    icon: UserPlus,
  },
  {
    title: "Manage Admin",
    description: "Inspect administrator accounts, modify status, and oversee permissions.",
    href: "/dashboard/super-admin/manage-admin",
    icon: Users,
  },
  {
    title: "Create Company",
    description: "Establish new tenant vendor companies and configure organization settings.",
    href: "/dashboard/super-admin/create-company",
    icon: Building2,
  },
];

export default function SuperAdminPage() {
  return (
    <div className="py-4 md:py-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
          Super Admin Console
        </h1>
        <p className="text-xs md:text-sm text-neutral-500 mt-1">
          Select a quick action below or use the sidebar to manage platform administrators and companies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {NAVIGATION_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
            >
              <Card className="h-full border border-neutral-200/90 rounded-lg bg-card hover:border-neutral-300 hover:shadow-xs transition-all duration-150 cursor-pointer">
                <CardHeader className="p-5 sm:p-6 flex flex-col justify-between h-full gap-5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200/80 bg-neutral-50 text-neutral-700 group-hover:border-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                    <Icon className="size-4.5" />
                  </div>

                  <div className="space-y-1.5">
                    <CardTitle className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-neutral-500 leading-relaxed">
                      {card.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}