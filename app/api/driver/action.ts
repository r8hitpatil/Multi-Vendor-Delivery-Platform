'use server'
import { getSession } from "@/app/libs/auth"
import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";

export async function getDriverAdmin(){
    try {
        const session = await getSession();
        if(!session){
            return {
                success : false as const,
                message : "Missing session"
            }
        }
        const getAdmin = await prisma.user.findUnique({
            where : {
                id : session?.userId
            },
            select : {
                adminDriverId : true as const
            }
        })
        if(!getAdmin || !getAdmin.adminDriverId){
            return {
                success : false as const,
                message : "Missing admin"
            }
        }
        return {
            success : true as const,
            message : "Admin fetched",
            data : {
                driverId : session.userId,
                adminId : getAdmin.adminDriverId
            }
        }
    } catch (error) {
        return handleActionError(error);
    }
}