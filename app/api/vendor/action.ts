"use server"

import { prisma } from "@/app/libs/prisma";
import { requireVendor } from "../auth/action";
import { handleActionError } from "@/app/libs/errors";
import { createStoreSchema, productBodySchema, updateProductBodySchema } from "./schema";
import { zodError } from "@/app/libs/zod-error";

export async function createStore(body : unknown){
    const res = createStoreSchema.safeParse(body);
    if(!res.success) return zodError(res.error);
    const { storeName,storeAddress ,lat,long } = res.data;
    try {
        const usr = await requireVendor();
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
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

export async function createNewProduct(body:unknown){
    const res = productBodySchema.safeParse(body);
    if(!res.success) return zodError(res.error);
    const { name , quantity } = res.data;
    try {
        const usr = await requireVendor();
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
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

export async function updateProduct(body:unknown){
    const res = updateProductBodySchema.safeParse(body);
    if(!res.success) return zodError(res.error);
    const { id , ...data } = res.data;
    try {
        const usr = await requireVendor();
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
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
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
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
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
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