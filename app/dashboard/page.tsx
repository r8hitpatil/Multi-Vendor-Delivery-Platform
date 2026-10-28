"use client"

import PageLoading from "@/components/page-loading";
import { useProducts } from "./customer/hooks/useProducts";
import { addToCart } from "../api/customer/action";
import { useQueryClient } from "@tanstack/react-query";
export default function Dashboard(){

  const queryClient = useQueryClient();
  const { data : products = [],isLoading , isError, error } = useProducts();
  if (isLoading) return <PageLoading />;
  if (isError) return <div>Error: {error?.message}</div>;

  async function handleCartAdd (id:string) {
    await addToCart(id);
    queryClient.invalidateQueries({ queryKey : ["home-products"] });
  }
  
  return (
      <div>
          {products.map((e) => (
            (
              <div key={e.id}  className="p-4 space-y-2 grid grid-col-3 gap-3">
                <div className="w-50 p-2 border rounded flex flex-col">
                  <span>{e.name} : ${e.price}</span>
                  <span>Quantity : {e.quantity}</span>
                  <button onClick={() => handleCartAdd(e.id)}>Add to cart</button>
                </div>
            </div>
          )
        )
      )}
      </div>
  )
}