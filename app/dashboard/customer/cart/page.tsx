"use client";

import { removeFromCart } from "@/app/api/customer/action";
import { useCart } from "../hooks/useCart";
import PageLoading from "../loading";
import { useQueryClient } from "@tanstack/react-query";

export default function CartPage(){

    const queryClient = useQueryClient();
    const { data : cart , isLoading , isError , error } = useCart();
    if(isLoading) return <PageLoading/>
    if(isError) return <div>Error : {error.message}</div>
    if (!cart || cart.items.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Your cart is empty!</div>;
    }

    async function handleCartRemove (id:string) {
        await removeFromCart(id);
        queryClient.invalidateQueries({ queryKey : ["home-products"] });
        queryClient.invalidateQueries({ queryKey : ["home-cart"] });
    }

    return ( 
        <div>
        {cart.items.map((e) => (
            (
                <div key={e.productId}  className="p-4 space-y-2 grid grid-col-3 gap-3">
                    <div className="w-50 p-2 border rounded flex flex-col">
                        <span>{e.name} : ${e.price}</span>
                        <span>Quantity : {e.quantity}</span>
                        <button onClick={() => handleCartRemove(e.productId)}>Remove from cart</button>
                    </div>
                </div>
              )
            )
        )}
        <span>Total amount : {cart.totalAmount}</span>
        </div>
    )
}