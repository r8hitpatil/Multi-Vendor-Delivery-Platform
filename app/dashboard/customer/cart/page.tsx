"use client";

import { orderProducts, removeFromCart } from "@/app/api/customer/action";
import { useCart } from "../hooks/useCart";
import PageLoading from "../loading";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function CartPage(){

    const queryClient = useQueryClient();
    const router = useRouter();
    const { data : cart , isLoading , isError , error } = useCart();
    if(isLoading) return <PageLoading/>
    if(isError) return <div>Error : {error.message}</div>
    if (!cart || cart.items.length === 0) {
        return <div className="p-8 text-center text-muted-foreground font-medium">Your cart is empty!</div>;
    }

    async function handleCartRemove (id:string) {
        await removeFromCart(id);
        queryClient.invalidateQueries({ queryKey : ["home-cart"] });
    }

    async function handleCheckout(){
        const res = await orderProducts();
        if(!res.success) {
            alert(res.message);
            return;
        }
        queryClient.invalidateQueries({ queryKey : ["home-cart"] });
        queryClient.invalidateQueries({ queryKey : ["home-products"] });
        queryClient.invalidateQueries({ queryKey : ["home-orders"] });
        router.push('/dashboard/customer/orders');
    }

    return ( 
        <div className="p-6 max-w-2xl mx-auto space-y-4">
        {cart.items.map((e) => (
            (
                <div key={e.productId} className="p-4 border rounded-lg bg-card shadow-sm flex justify-between items-center">
                    <div className="flex flex-col space-y-1">
                        <span className="font-semibold text-base">{e.name} : ${e.price}</span>
                        <span className="text-sm text-muted-foreground">Quantity : {e.quantity}</span>
                    </div>
                    <button 
                        onClick={() => handleCartRemove(e.productId)}
                        className="border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition py-1.5 px-3 rounded-md text-sm font-medium"
                    >
                        Remove from cart
                    </button>
                </div>
              )
            )
        )}
        <div className="pt-4 border-t flex justify-between items-center">
            <span className="font-bold text-lg">Total amount : ${cart.totalAmount}</span>
            <button 
                onClick={() => handleCheckout()}
                className="bg-black text-white hover:bg-neutral-800 transition py-2 px-5 rounded-md font-semibold text-sm"
            >
                Checkout
            </button>
        </div>
        </div>
    )
}
