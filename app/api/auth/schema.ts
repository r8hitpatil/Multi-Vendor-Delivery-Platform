import { z } from 'zod';

export const loginUserSchema = z.object({
    email : z.string().trim().email("Invalid email address"),
    password : z.string().trim().min(8,"Must be at least 8 character long"),
})