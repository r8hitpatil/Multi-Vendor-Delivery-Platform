export type NavActions = {
    title: string,
    url: string
}

export type NavItem = {
    title: string,
    actions: NavActions[],
}

export type NavContent = Record<Role,NavItem>

export type Role = "SUPER_ADMIN" | "ADMIN"

export const TableContents: NavContent = {
    SUPER_ADMIN: {
        title: "super-admin",
        actions: [{
            title: "Create",
            url: "/dashboard/super-admin/create-admin",
        },
        {
            title: "Manage Admin",
            url: "/dashboard/super-admin/manage-admin",
        },
        {
            title: "Create Company",
            url: "/dashboard/super-admin/create-company",
        }]
    },
    ADMIN: {
        title: "admin",
        actions: [{
            title: "Create Vendor",
            url: "/dashboard/admin/create-vendor",
        },
        {
            title: "Manage Vendor",
            url: "/dashboard/admin/manage-vendor",
        }]
    }
}