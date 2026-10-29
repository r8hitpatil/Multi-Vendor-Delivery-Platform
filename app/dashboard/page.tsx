"use client"

import PageLoading from "@/components/page-loading";
import { useProducts } from "./customer/hooks/useProducts";
import { addToCart } from "../api/customer/action";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "./customer/hooks/useCart";
import { useState } from "react";
import AddressDialog from "@/components/address-dialog";

export default function Dashboard(){

  const queryClient = useQueryClient();
  const { data : products = [], isLoading, isError, error } = useProducts();
  const { data : cart } = useCart();
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [pendingProd, setPendingProd] = useState('');

  const hasAddress = Boolean(cart?.address);
  if (isLoading) return <PageLoading />;
  if (isError) return <div>Error: {error?.message}</div>;

  async function handleCartAdd (id:string) {
    if(!hasAddress) {
      setPendingProd(id);
      setAddressModalOpen(true);
      return;
    }
    const res = await addToCart(id);
    if(!res.success){
      alert(res.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey : ["home-products"] });
    queryClient.invalidateQueries({ queryKey : ["home-cart"] });
  }

  async function handleAddressSaved(){
    await addToCart(pendingProd);
    setPendingProd("");
    queryClient.invalidateQueries({ queryKey : ["home-products"] });
    queryClient.invalidateQueries({ queryKey : ["home-cart"] });
  }
  
  return (
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((e) => (
            (
              <div key={e.id} className="p-4 border rounded-lg bg-card shadow-sm flex flex-col justify-between space-y-3">
                <div className="flex flex-col space-y-1">
                  <span className="font-semibold text-base">{e.name} : ${e.price}</span>
                  <span className="text-sm text-muted-foreground">Quantity : {e.quantity}</span>
                </div>
                <button 
                  onClick={() => handleCartAdd(e.id)}
                  className="w-full bg-black text-white hover:bg-neutral-800 transition py-2 px-3 rounded-md text-sm font-medium"
                >
                  Add to cart
                </button>
              </div>
          )
        )
      )}
      <AddressDialog
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
        onSuccess={handleAddressSaved}
      />
      </div>
  )
}
