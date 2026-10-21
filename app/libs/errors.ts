export function handleActionError(error:unknown){
    console.error("Action error",error);
    if(typeof error === "object" && error !== null && "code" in error){
        if(error.code === "P2002"){
            return {
                success : false as const,
                message : 'A record already exists'
            }
        }
    }
    return {
        success : false as const,
        message : error instanceof Error ? error.message : "Internal server error"
    }
}