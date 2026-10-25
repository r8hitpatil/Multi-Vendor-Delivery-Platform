import { Status } from '@/app/generated/prisma/enums';
import { z } from 'zod';

export const updateVendorSchema = z.object({
    id : z.string().trim().min(1,"Enter the correct id"),
    status : z.nativeEnum(Status,{message : "Invalid status"}),
    ban : z.boolean().default(false),
})

export const manageDriverSchema = z.object({
    id : z.string().trim().min(1,"Enter the correct id"),
    ban : z.boolean().default(false),
})

export const createDriverSchema = z.object({
    name : z.string().trim().min(2,"Must be at least 2 character long"),
    phone : z.string().trim().min(10,"Must be at least 10 character long"),
    password : z.string().trim().min(8,"Must be at least 8 character long"),
    email : z.string().trim().email("Invalid email address"),
    ban : z.boolean().default(false),
    addressDesc : z.string().trim().min(10,"Must be at least 10 character long"), 
    pin_code : z.coerce.number().int().min(1000,"Must be at least 4 digits"),
    lat : z.string().trim().min(1,"Must be at least 1 character long"),
    long : z.string().trim().min(1,"Must be at least 1 character long"),
    aadhar : z.string().trim().min(10,"Must be at least 10 character long"),
    pan : z.string().trim().min(10,"Must be at least 10 character long"),
})