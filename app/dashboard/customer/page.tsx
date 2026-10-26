"use client"

import { homePageProducts } from "@/app/api/customer/action";
import { AvailableProduct } from "@/app/generated/prisma/client";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function ProductsPage() {

  function getProduc() {
    return useQuery<AvailableProduct[]>({
      queryKey: ["user-products"],
      queryFn: async () =>{
        const res = await homePageProducts();
        if(!res.success || !res.data){
            throw new Error("Failed to fetch data");
        }
        return res.data;
      },
      staleTime: 60 * 1000,
    })
  }

  return (
    <div>
      <Card>
        
      </Card>
    </div>
  )
}