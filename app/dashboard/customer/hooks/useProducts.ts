import { homePageProducts } from "@/app/api/customer/action";
import { useQuery } from "@tanstack/react-query";

export function useProducts(){
    return useQuery({
        queryKey : ["home-products"],
        queryFn : async () => {
            const res = await homePageProducts();
            if(!res.success){
              throw new Error(res.message || "Failed to load products"); 
            }
            return res.data;
        },
    })
}