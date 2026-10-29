"use client";

import { useOrder } from "../hooks/useOrder";
import PageLoading from "../loading";

export default function CustomerOrderPage(){

    const { data : order = [], isLoading , isError, error } = useOrder();
    if(isLoading) return <PageLoading/>
    if(isError) return <div>Error : {error.message}</div>
    if (!order || order.length === 0) {
        return <div className="p-8 text-center text-muted-foreground font-medium">No orders yet!</div>;
    }

    return (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {order.map((e) => (
            <div key={e.id} className="border rounded-lg bg-card shadow-sm p-4 flex flex-col justify-between space-y-3">
                <div className="flex flex-col space-y-1 border-b pb-2">
                    <span className="font-semibold text-sm">Order #{e.id.slice(0,8)}</span>
                    <span className="font-bold text-base text-emerald-600">Total price : ${e.orderItems.reduce((acc,i) => acc + i.price * i.quantity,0)}</span>
                </div>
                <div className="space-y-2">
                    {e.orderItems.map((item) => (
                        <div key={item.id} className="flex flex-col text-sm border-t pt-2 first:border-t-0 first:pt-0">
                            <span className="font-medium">{item.product.name}</span>
                            <span className="text-xs text-muted-foreground">Quantity : {item.quantity}</span>
                            <span className="text-xs font-semibold">Total : ${item.price * item.quantity}</span>
                        </div>
                    ))}
                </div>
            </div>
            )
        )}
        </div>
    )
}
