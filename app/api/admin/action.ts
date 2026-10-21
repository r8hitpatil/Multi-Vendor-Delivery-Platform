"use server"

import { Status } from "@/app/generated/prisma/enums"
import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";
import { requireAdmin } from "../auth/action";

type UpdateVendorBody = {
    id : string,
    ban : boolean,
    status : Status
}

export async function getVendors(){
    try {
        const usr = await requireAdmin();
        const vendors = await prisma.user.findMany({
            where : {
                companyId : usr
            }
        })
        if(vendors.length<1){
            return {
                success : false,
                message : "No vendors found"
            }
        }
        return {
            success : true,
            message : "Vendors found",
            data : vendors
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function updateVendor(body : UpdateVendorBody){
    const { id , ban , status } = body;

    try {
        await prisma.user.update({
            where : {
                id
            },
            data : {
                ban,
                status
            }
        })
        return {
            success : true,
            message : "Vendor updated successfully"
        }
    } catch (error) {
        return handleActionError(error);
    }
}