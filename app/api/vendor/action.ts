"use server"

import { prisma } from "@/app/libs/prisma";
import { requireVendor } from "../auth/action";
import { handleActionError } from "@/app/libs/errors";

type CreateStore = {
    storeName : string,
    storeAddress : string,
    lat : string,
    long : string
}

type ProductBody = {
    name : string,
    quantity : number
}

type UpdateProductBody = {
    id : string,
    name ?: string,
    quantity ?: number,
}

export async function createStore(body : CreateStore){
    const { storeName,storeAddress ,lat,long } = body;
    try {
        const usr = await requireVendor();
        if(usr.status!=="ACCEPTED"){
            return {
                success : false,
                message : usr.status === "PENDING" ? "Your vendor account is pending admin approval" : 
                "Your vendor account is rejected"
            }
        }
        if(usr.storeId){
            return {
                success : false,
                message : "You already have a store created"
            }
        }
        await prisma.store.create({
            data : {    
            vendorId : usr.adminId,
                address : {
                    create : {
                        storeName,
                        storeAddress,
                        lat,
                        long
                    }
                }
            }
        })
        return {
            success : true,
            message : "Created store"
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function createNewProduct(body:ProductBody){
    const { name , quantity } = body;
    try {
        const usr = await requireVendor();
        if(!usr.storeId){
            return {
                success : false,
                message : usr.status === "ACCEPTED" ? "Store id not found" : "Request is pending"
            }
        }
        await prisma.product.create({
            data : {
                name,
                quantity,
                storeId : usr.storeId
            }
        })
        return {
            success : true,
            message : "Created product successfully."
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function updateProduct(body:UpdateProductBody){
    const { id , ...data } = body;
    try {
        const usr = await requireVendor();
        if(!usr.storeId){
            return {
                success : false as  const,
                message : usr.status === "ACCEPTED" ? "Store id not found" : "Request is pending"
            }
        }
        const existing = await prisma.product.findUnique({
            where : {
                id,
                storeId : usr.storeId
            }
        })
        if(!existing) {
            return { 
                sucess : false as const,
                message : "Product not found in your store."
            }
        }
        await prisma.product.update({
            where : {
                id
            },
            data
        })
        return {
            success : true as const,
            message : "Created product successfully."
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getProducts(){
    try {
        const usr = await requireVendor();
        if(!usr.storeId){
            return {
                success : false as  const,
                message : usr.status === "ACCEPTED" ? "Store id not found" : "Request is pending"
            }
        }
        const existing = await prisma.product.findMany({
            where : {
                storeId : usr.storeId
            }
        })
        if(!existing) {
            return { 
                sucess : false as const,
                message : "Product not found in your store."
            }
        }
        return {
            success : true as const,
            message : "Products from store",
            data : existing
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function deleteProduct(id:string){
    try {
        const usr = await requireVendor();
        if(!usr.storeId){
            return {
                success : false as  const,
                message : usr.status === "ACCEPTED" ? "Store id not found" : "Request is pending"
            }
        }
        const existing = await prisma.product.findFirst({
            where : {
                id,
                storeId : usr.storeId
            }
        })
        if(!existing) {
            return { 
                sucess : false as const,
                message : "Product not found in your store."
            }
        }
        await prisma.product.delete({
            where : {
                id
            }
        })
        return {
            success : true as const,
            message : "Deleted product successfully"
        }
    } catch (error) {
        return handleActionError(error);
    }
}