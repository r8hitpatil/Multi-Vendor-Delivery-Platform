"use client";

import { useEffect, useState } from "react";
import { getOrderedProducts } from "@/app/api/vendor/action";

type ActionResponse = Awaited<ReturnType<typeof getOrderedProducts>>;
export type VendorOrderItem = NonNullable<
  Extract<ActionResponse, { success: true }>["data"]
>[number];

export default function ManageOrdersPage() {
  const [orderItems, setOrderItems] = useState<VendorOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true);
        const res = await getOrderedProducts();
        if (res.success && res.data) {
          setOrderItems(res.data);
        } else {
          setError(res.message || "Failed to load orders");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  if (isLoading) return <div className="p-6">Loading orders...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (orderItems.length === 0) {
    return <div className="p-6 text-muted-foreground">No orders yet for your store.</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Manage Store Orders</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orderItems.map((item) => (
          <div key={item.id} className="p-4 border rounded-lg bg-card shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">Order #{item.order.id.slice(0, 8)}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 font-medium">
                {item.orderStatus}
              </span>
            </div>

            <div className="text-sm">
              <p className="font-medium">{item.product.name}</p>
              <p className="text-muted-foreground text-xs">
                Quantity: {item.quantity} × ${item.price} = ${item.quantity * item.price}
              </p>
            </div>

            <div className="border-t pt-2 text-xs text-muted-foreground space-y-0.5">
              <p className="font-semibold text-foreground">Customer: {item.order.customer.name}</p>
              <p>Phone: {item.order.customer.phone}</p>
              <p>Deliver to: {item.order.customer.address?.address ?? "No address provided"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}