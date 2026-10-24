import { z } from 'zod';

export const createVendorSchema = z.object({
    name : z.string().trim().min(2,"Must be at least 2 character long"),
    phone : z.string().trim().min(10,"Must be at least 10 character long"),
    password : z.string().trim().min(8,"Must be at least 8 character long"),
    email : z.string().trim().email("Invalid email address"),
    aadhar : z.string().trim().min(10,"Must be at least 10 character long"),
    pan : z.string().trim().min(10,"Must be at least 10 character long"),
    companyId : z.string().min(1,"Company id is required"),
    adminId : z.string().min(1,"Company id is required"),
})