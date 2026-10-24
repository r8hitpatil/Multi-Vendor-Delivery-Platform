import { ZodError } from "zod";

export function zodError(error:ZodError){
    return {
        success : false as const,
        message : error.issues[0]?.message || "Invalid input"
    };
}