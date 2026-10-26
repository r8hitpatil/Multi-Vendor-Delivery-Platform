import { z } from 'zod';

export const loginUserSchema = z.object({
    email : z.string().trim().email("Invalid email address"),
    password : z.string().trim().min(8,"Must be at least 8 character long"),
})

export const createVendorSchema = z.object({
    name : z.string().trim().min(2,"Must be at least 2 character long"),
    phone : z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    password : z.string().trim().min(8,"Must be at least 8 character long"),
    email : z.string().trim().email("Invalid email address"),
    aadhar : z.string().trim().regex(/^\d{12}$/, "Aadhar number must be exactly 12 digits"),
    pan : z.string().trim().regex(/^\d{10}$/, "PAN number must be exactly 10 digits"),
    companyId : z.string().min(1,"Company id is required"),
    adminId : z.string().min(1,"Admin is required"),
})

export const createCustomerSchema = z.object({
  name : z.string().trim().min(2,"Must be at least 2 character long"),
  phone : z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  password : z.string().trim().min(8,"Must be at least 8 character long"),
  email : z.string().trim().email("Invalid email address"),
})