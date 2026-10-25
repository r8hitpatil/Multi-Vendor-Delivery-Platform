import { Role, Status } from '@/app/generated/prisma/enums';
import { z } from 'zod';

export const createAdminSchema = z.object({
    name : z.string().trim().min(2,"Must be at least 2 character long"),
    phone : z.string().trim().min(10,"Must be at least 10 character long"),
    password : z.string().trim().min(8,"Must be at least 8 character long"),
    email : z.string().trim().email("Invalid email address"),
    companyId : z.string().min(1,"Company id is required"),
    status : z.nativeEnum(Status,{ message : "Select valid status" }),
    ban : z.boolean().default(false),
})

export const createCompanySchema = z.object({
    companyName : z.string().trim().min(2,"Must be at least 2 character long"),
    about : z.string().trim().min(10,"Must be at least 10 character long"),
    addressDesc : z.string().trim().min(10,"Must be at least 10 character long"), 
    pin_code : z.coerce.number().int().min(1000,"Must be at least 4 digits"),
    lat : z.string().trim().min(1,"Must be at least 1 character long"),
    long : z.string().trim().min(1,"Must be at least 1 character long")
})

export const manageAdminSchema = z.object({
    name : z.string().trim().min(2,"Must be at least 2 character long"),
    phone : z.string().trim().min(10,"Must be at least 10 character long"),
    email : z.string().trim().email("Invalid email address"),
    ban : z.boolean().default(false),
    status : z.nativeEnum(Status,{ message : "Invalid status" })
})