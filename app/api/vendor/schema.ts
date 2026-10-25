import { z } from 'zod';

export const createStoreSchema = z.object({
    storeName : z.string().trim().min(2,"Must be at least 2 character long"),
    storeAddress : z.string().trim().min(5,"Must be at least 5 character long"),
    lat : z.string().trim().min(1,"Must be at least 1 character long"),
    long : z.string().trim().min(1,"Must be at least 1 character long")
})

export const productBodySchema = z.object({
    name : z.string().trim().min(2,"Must be at least 2 characters long"),
    quantity : z.number().min(1,"Quantity must be at least 1"),
    price : z.number().min(1,"Price must be at least 1"),
    discountedPrice : z.number().min(0,"Discounted price must be at least 0").optional(),
})

export const updateProductBodySchema = z.object({
    id : z.string().trim().min(1,"Must be at least 1 character long"),
    name : z.string().trim().min(2,"Must be at least 2 characters long").optional(),
    quantity : z.number().min(1,"Quantity must be at least 1").optional(),
    price : z.number().min(1,"Price must be at least 1").optional(),
    discountedPrice : z.number().min(0,"Discounted price must be at least 0").optional(),
})