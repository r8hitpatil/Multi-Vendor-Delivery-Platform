import { getCart } from "@/app/api/customer/action";
import { useQuery } from "@tanstack/react-query";

export function useCart(){
    return useQuery({
        queryKey : ["home-cart"],
        queryFn : async () => {
            const res = await getCart();
            if(!res.success){
              throw new Error(res.message || "Failed to load cart"); 
            }
            return res.data;
        },
    })
}