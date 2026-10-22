"use server"

import { Role, Status } from "@/app/generated/prisma/enums"
import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";
import { requireAdmin } from "../auth/action";
import * as argon from 'argon2';

type UpdateVendorBody = {
    id : string,
    ban : boolean,
    status : Status
}

type ManageDriver = {
    id : string
    ban : boolean,
}

type DriverBody = {
    name : string,
    phone : string,
    aadhar : string,
    pan : string,
    email : string,
    password : string,
    addressDesc : string,
    pin_code : number,
    lat : string,
    long : string,
    ban : boolean
}

export async function getVendors(){
    try {
        const usr = await requireAdmin();
        const vendors = await prisma.user.findMany({
            where : {
                companyId : usr.companyId,
                Role : Role.VENDOR
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

        await requireAdmin();

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

export async function createDriver(body: DriverBody){
    const { name,phone,aadhar,pan,email,password,ban,addressDesc,pin_code,lat,long } = body;
    try {
        const { companyId,adminId } = await requireAdmin();

        const hashedPass = await argon.hash(password);

        await prisma.user.create({
            data : {
                name,
                phone,
                aadhar,
                pan,
                ban,
                email,
                companyId,
                Role : Role.DRIVER,
                adminDriverId:adminId,
                password : hashedPass,
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
            message : "Create driver successfully"
        }
    }
    catch (error) {
        return handleActionError(error);
    }
}

export async function getDrivers(){
    try {
        const { companyId } = await requireAdmin();

        const drivers = await prisma.user.findMany({
            where : {
                companyId,
                Role : Role.DRIVER
            }
        })
        if(drivers.length<1){
            return {
                success : false as const,
                message : "Driver details not available",
            }
        }
        return {
            success : true as const,
            message : "Company driver",
            data : drivers
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function selectedDriver(id:string) {
    try {
        const { companyId } = await requireAdmin();
        const res = await prisma.user.findFirst({
            where : {
                companyId,
                id,
                Role:Role.DRIVER
            }
        })
        if(!res){
            return {
                success : false,
                message : "Error occured while fetching driver."
            }
        }
        return {
            success : true,
            message : "Selected driver details",
            data : res
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function manageDriver(body:ManageDriver){

    const { id , ban } = body;

    try {
        await requireAdmin();

        const updateDriver = await prisma.user.update({
            where : {
                id
            },
            data : {
                ban
            }
        })
        if(!updateDriver){
            return {
                success : false,
                message : "Unable to update driver"
            }
        }
        return {
            success : true,
            message : "Driver updated"
        }
    } catch (error) {
        return handleActionError(error);
    }
}