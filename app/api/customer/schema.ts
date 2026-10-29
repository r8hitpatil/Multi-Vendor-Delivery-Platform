import { z } from 'zod';

export const createUserAddress = z.object({
    address : z.string().trim().min(5,"Must be at least 5 character long"),
    lat : z.string().trim().min(1,"Must be at least 1 character long"),
    long : z.string().trim().min(1,"Must be at least 1 character long"),
    pin_code :z.coerce.number().int().min(1000,"Must be at least 4 digits"),
})