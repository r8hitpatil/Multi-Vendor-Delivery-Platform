"use client";

import { useEffect, useState } from "react";
import { 
  getActiveDriverOrders, 
  updateDriverOrderStatus, 
  cancelDriverOrderStatus 
} from "@/app/api/driver/action";
import { OrderStatus } from "@/app/generated/prisma/enums";
import PageLoading from "../loading";
import { socket } from "@/app/libs/socket";

// Infer DriverOrderItem type directly from getActiveDriverOrders response
type ActionResponse = Awaited<ReturnType<typeof getActiveDriverOrders>>;
export type DriverOrderItem = NonNullable<
  Extract<ActionResponse, { success: true }>["data"]
>[number];

export default function DriverOrdersPage() {
  const [orders, setOrders] = useState<DriverOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Status transitions relevant to the driver
  const driverStatusOptions = [
    { value: OrderStatus.PICKED_UP, label: "PICKED UP (FROM STORE)" },
    { value: OrderStatus.OUT_OF_DELIVERY, label: "OUT FOR DELIVERY" },
    { value: OrderStatus.DELIVERED, label: "DELIVERED" },
  ];

  async function loadOrders() {
    try {
      setIsLoading(true);
      const res = await getActiveDriverOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        setError(res.message || "Failed to load active orders");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong loading orders");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    socket.on("driver-urgent-order", (data: { orderId: string; message: string }) => {
        loadOrders();
    });

    return () => {
        socket.off("driver-urgent-order");
    }
  }, []);

  // 1. Handle advancing order delivery status
  async function handleStatusChange(orderItemId: string, nextStatus: OrderStatus) {
    try {
      setActionLoadingId(orderItemId);
      const res = await updateDriverOrderStatus(orderItemId, nextStatus);

      if (res.success) {
        if (nextStatus === OrderStatus.DELIVERED) {
          // If completed, remove from active deliveries
          setOrders((prev) => prev.filter((o) => o.id !== orderItemId));
        } else {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderItemId ? { ...o, orderStatus: nextStatus } : o))
          );
        }
      } else {
        alert(res.message || "Failed to update order status");
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setActionLoadingId(null);
    }
  }

  // 2. Handle cancelling / dropping order (escalates to admin)
  async function handleCancelOrder(orderItemId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel/drop this delivery? It will alert your admin immediately for reassignment."
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(orderItemId);
      const res = await cancelDriverOrderStatus(orderItemId);

      if (res.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderItemId));
        alert("Order dropped and escalated to Admin.");
      } else {
        alert(res.message || "Failed to cancel order");
      }
    } catch (err: any) {
      alert(err.message || "Error dropping order");
    } finally {
      setActionLoadingId(null);
    }
  }

  if (isLoading) return <PageLoading />;

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6">
        <div className="rounded-none border border-destructive/50 bg-destructive/10 p-4 text-xs font-mono uppercase text-destructive">
          Error: {error}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
              Active Deliveries
            </h1>
            <span className="rounded-none text-[11px] font-mono uppercase tracking-wider border border-border px-1.5 py-0.5 text-muted-foreground">
              Driver Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your ongoing pickups and deliveries.
          </p>
        </div>
        <div className="rounded-none border border-border bg-card p-8 text-center text-xs font-mono uppercase text-muted-foreground">
          No active delivery assignments at the moment.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 p-2 sm:p-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
            Active Deliveries
          </h1>
          <span className="rounded-none text-[11px] font-mono uppercase tracking-wider border border-border px-1.5 py-0.5 text-muted-foreground">
            {orders.length} Active
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Pick up orders from stores and deliver to customers.
        </p>
      </div>

      {/* Delivery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((item) => {
          const storeAddr = item.product.storeProducts?.address;
          const customerAddr = item.order.customer?.address;
          const isBusy = actionLoadingId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-none border border-border bg-card p-4 flex flex-col justify-between space-y-4 hover:border-foreground transition-colors"
            >
              {/* Header: ID + Status Badges */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-mono uppercase font-bold text-muted-foreground">
                    Order
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground">
                    #{item.order.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-none text-[10px] font-mono uppercase font-bold tracking-wider border border-border bg-muted/40 px-2 py-0.5 text-foreground">
                    {item.orderStatus.replace(/_/g, " ")}
                  </span>
                  <span className="rounded-none text-[10px] font-mono uppercase font-bold tracking-wider border border-border px-1.5 py-0.5 text-muted-foreground">
                    {item.dispatchStatus.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-1">
                <p className="font-bold text-sm text-foreground uppercase tracking-tight">
                  {item.product.name}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  Qty: <span className="font-semibold text-foreground">{item.quantity}</span> × ${item.price} ={" "}
                  <span className="font-semibold text-foreground">${item.quantity * item.price}</span>
                </p>
              </div>

              {/* Pickup & Dropoff Details */}
              <div className="border-t border-border pt-3 space-y-2 text-xs font-mono">
                {/* Store Pickup */}
                <div className="p-2 border border-border/60 bg-muted/20 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Pickup From Store
                  </span>
                  <p className="font-bold text-foreground truncate">
                    {storeAddr?.storeName || "Vendor Store"}
                  </p>
                  <p className="text-muted-foreground text-[11px] line-clamp-1">
                    {storeAddr?.storeAddress || "Address not provided"}
                  </p>
                </div>

                {/* Customer Dropoff */}
                <div className="p-2 border border-border/60 bg-muted/20 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Deliver To Customer
                  </span>
                  <p className="font-bold text-foreground truncate">
                    {item.order.customer?.name || "Customer"} 
                    {item.order.customer?.phone && ` (${item.order.customer.phone})`}
                  </p>
                  <p className="text-muted-foreground text-[11px] line-clamp-1">
                    {customerAddr?.address || "Delivery address not provided"}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Status Selector + Cancel Button */}
              <div className="border-t border-border pt-3 flex flex-wrap items-center gap-2">
                {/* Status Dropdown */}
                <select
                  disabled={isBusy}
                  value={item.orderStatus}
                  onChange={(e) => handleStatusChange(item.id, e.target.value as OrderStatus)}
                  className="flex-1 bg-background border border-border px-2 py-1.5 text-xs font-mono uppercase text-foreground focus:outline-none focus:border-foreground cursor-pointer disabled:opacity-50"
                >
                  <option value={item.orderStatus} disabled>
                    Current: {item.orderStatus.replace(/_/g, " ")}
                  </option>
                  {driverStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Mark as {opt.label}
                    </option>
                  ))}
                </select>

                {/* Drop / Cancel Order Button */}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleCancelOrder(item.id)}
                  className="border border-destructive/60 text-destructive hover:bg-destructive hover:text-destructive-foreground px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isBusy ? "Processing..." : "Cancel Order"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}