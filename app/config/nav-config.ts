export type NavActions = {
    title: string,
    url: string
}

export type NavItem = {
    title: string,
    actions: NavActions[],
}

export type NavContent = Record<Role,NavItem>

export type Role = "SUPER_ADMIN" | "ADMIN" | "VENDOR" | "CUSTOMER"

export const TableContents: NavContent = {
    SUPER_ADMIN: {
        title: "super-admin",
        actions: [
        {
            title: "Home",
            url: "/dashboard/super-admin",
        },{
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
        actions: [
        {
            title: "Home",
            url: "/dashboard/admin",
        },
        {
            title: "Manage Vendor",
            url: "/dashboard/admin/manage-vendor",
        },
        {
            title: "Create Driver",
            url: "/dashboard/admin/create-driver",
        },{
            title: "Manage Driver",
            url: "/dashboard/admin/manage-driver",
        }]
    },
    VENDOR : {
        title : "vendor",
        actions : [
            {
                title: "Home",
                url: "/dashboard/vendor",
            },
            {
                title : "Create product",
                url : "/dashboard/vendor/create-product"
            },
            {
                title : "Manage product",
                url : "/dashboard/vendor/manage-product"
            }
        ]
    },
    CUSTOMER : {
        title : "customer",
        actions : [
            {
                title : "Products",
                url : "/products",
            },
            {
                title : "My orders",
                url : "/dashboard/customer/orders",
            }
        ]
    }
}