"use server"
import { Role } from "@/app/generated/prisma/enums";
import { requireSuperAdmin } from "@/app/libs/auth";
import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";
import * as argon from 'argon2';
import { createAdminSchema, createCompanySchema, manageAdminSchema } from "@/app/api/super-admin/schema";
import { zodError } from "@/app/libs/zod-error";

export async function createCompany(body : unknown) {
    const res = createCompanySchema.safeParse(body);
    if(!res.success) return zodError(res.error);
    const { companyName , about , addressDesc , pin_code ,lat,long } = res.data;

    try {
        await requireSuperAdmin();

        await prisma.company.create({
            data : {
                companyName,
                about,
                address : {
                    create : {
                        address : addressDesc,
                        pin_code,
                        lat,
                        long
                    }
                }
            }
        })

        return {
            success : true,
            message : "Created company successfully"
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getCompany(){
    try {
        const companies = await prisma.company.findMany({});
        if(companies.length<1){
            return {
                success : false as const,
                message : "No companies found"
            }
        }
        return {
            success : true as const,
            message : "Companies found",
            data : companies
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function createAdmin(body: unknown) {
    const res = createAdminSchema.safeParse(body);
    if(!res.success) return zodError(res.error);
    const { name, phone, email, password , companyId , ban, Role } = res.data;

    try {
        await requireSuperAdmin();

        const admin = await prisma.user.findUnique({
            where: { email },
        });

        if (admin) {
            return {
                success: false as const, message: "User already exists" 
            };
        }

        const hashPass = await argon.hash(password);

        const createAdmin = await prisma.user.create({
            data: {
                name,
                phone,
                email,
                password: hashPass,
                ban,
                companyId,
                Role
            }
        })

        return {
            success: true as const,
            message: "Created Admin successful",
            data: {
                id: createAdmin.id,
                email: createAdmin.email,
                role: createAdmin.Role,
            },
        };
    } catch (error) {
        return handleActionError(error);
    }
}

export async function manageAdmin(body: unknown) {
    const res = manageAdminSchema.safeParse(body);
    if(!res.success) return zodError(res.error);
    const { name, phone, email, ban } = res.data;

    try {
        await requireSuperAdmin();

        const admin = await prisma.user.findUnique({
            where: { email },
        });

        if (!admin) {
            return { success: false as const, message: "User doesn't exists" };
        }

        const updateAdmin = await prisma.user.update({
            where: {
                email: admin.email
            },
            data: {
                name,
                email,
                phone,
                ban,
            }
        })

        return {
            success: true as const,
            message: "Admin updated successfully",
            data : updateAdmin
        };
    } catch (error) {
        return handleActionError(error);
    }
}

export async function selectedAdmin(adminId: string) {

    try {
        await requireSuperAdmin();

        const checkUser = await prisma.user.findUnique({
            where: {
                id: adminId
            }
        })
        if (!checkUser) {
            return {
                success: false,
                message: `Something wend wrong fetching user data`
            }
        }
        return {
            success: true,
            message: `Selected admin`,// remove this flaw of sending user as response
            data: {
                name: checkUser.name,
                email: checkUser.email,
                phone: checkUser.phone,
                ban: checkUser.ban,
            }
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function dropAdmins() {
    try {
        await requireSuperAdmin();

        const adminUsers = await prisma.user.findMany({
            where: {
                Role: Role.ADMIN
            }
        })

        if (!adminUsers || adminUsers == null || adminUsers.length < 1) {
            return {
                success: false as const,
                message: "No admins found"
            }
        }
        return {
            success: true as const,
            message: "Admins listed",
            data: adminUsers
        }
    } catch (error) {
        return handleActionError(error);
    }
}