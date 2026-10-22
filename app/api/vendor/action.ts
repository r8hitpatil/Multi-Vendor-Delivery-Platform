"use server"

import { Role } from "@/app/generated/prisma/enums";
import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";
import * as argon from 'argon2';

type CreateVendor = {
    name : string,
    email : string,
    password : string,
    aadhar : string,
    phone : string,
    pan : string,
    companyId : string,
    adminId : string
}

export async function createVendor(body:CreateVendor){
    const { name, email , password , aadhar , phone , pan , companyId , adminId } = body;

    try {
        const hashedPass = await argon.hash(password);
        
        await prisma.user.create({
            data : {
                name,
                email,
                password : hashedPass,
                aadhar,
                pan,
                phone,
                companyId,
                Role : Role.VENDOR,
                adminId
            }
        })
        return {
            success : true,
            message : "Created new vendor"
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getAdmins(companyId:string){
    try {
        const users = await prisma.user.findMany({
            where : {
                companyId,
                Role : Role.ADMIN
            }
        })
        if(users.length<1){
            return {
                success : false,
                message : "Company admin details not availabe",
            }
        }
        return {
            success : true,
            message : "Company Admins",
            data : users
        }
    } catch (error) {
        return handleActionError(error);
    }
}