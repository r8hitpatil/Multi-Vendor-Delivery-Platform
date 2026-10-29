import { getOrders } from "@/app/api/customer/action";
import { useQuery } from "@tanstack/react-query";

export function useOrder(){
    return useQuery({
        queryKey : ["home-orders"],
        queryFn : async () => {
            const res = await getOrders();
            if(!res.success){
              throw new Error(res.message || "Failed to load orders"); 
            }
            return res.data;
        },
    })
}