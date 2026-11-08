"use client";

import { useEffect, useState } from "react";
import { changeOrderStatus, getDriverReqStatus, getOrderedProducts, notifyDriverReq } from "@/app/api/vendor/action";
import PageLoading from "../loading";
import { OrderStatus } from "@/app/generated/prisma/enums";

type ActionResponse = Awaited<ReturnType<typeof getOrderedProducts>>;

export type VendorOrderItem = NonNullable<
  Extract<ActionResponse, { success: true }>["data"]
>[number];

export default function ManageOrdersPage() {
  const [orderItems, setOrderItems] = useState<VendorOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingId,setRequestingId] = useState<string | null>(null);
  const [requestingIds,setRequestingIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true);
        const res = await getOrderedProducts();
        const pendingReqs = await getDriverReqStatus();
        if (res.success && res.data) {
          setOrderItems(res.data);
        } if(pendingReqs.success && pendingReqs.data) {
          setRequestingIds(pendingReqs.data);
        }
        else {
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

  const statusOptions = [
    { value: OrderStatus.PLACED, label: OrderStatus.PLACED },
    { value: OrderStatus.CANCELLED, label: OrderStatus.CANCELLED },
    { value: OrderStatus.OUT_OF_DELIVERY, label: OrderStatus.OUT_OF_DELIVERY },
    { value: OrderStatus.PICKED_UP, label: OrderStatus.PICKED_UP },
    { value: OrderStatus.PREPARING, label: OrderStatus.PREPARING },
    { value: OrderStatus.READY, label: OrderStatus.READY },
    { value: OrderStatus.VENDOR_ACCEPTED, label: OrderStatus.VENDOR_ACCEPTED },
    { value: OrderStatus.VENDOR_REJECTED, label: OrderStatus.VENDOR_REJECTED },
    { value: OrderStatus.DELIVERED, label: OrderStatus.DELIVERED },
  ];

  async function orderStatusChange(id: string, status: OrderStatus) {
    const res = await changeOrderStatus(id, status);
    if (res.success) {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, orderStatus: status } : item
        )
      );
    } else {
      alert(res.message || "Failed to update status");
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

  if (orderItems.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
              Manage Orders
            </h1>
            <span className="rounded-none text-[11px] font-mono uppercase tracking-wider border border-border px-1.5 py-0.5 text-muted-foreground">
              Vendor Store
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track and update fulfillment status for customer store orders.
          </p>
        </div>
        <div className="rounded-none border border-border bg-card p-8 text-center text-xs font-mono uppercase text-muted-foreground">
          No orders yet for your store.
        </div>
      </div>
    );
  }

  async function handleRequestDriver(id:string){
    try {
      setRequestingId(id);
      const res = await notifyDriverReq(id);
      if(res.success){
        setRequestingIds((prev) => [...prev,id]);
        alert(res.message);
      }
      else {
        alert(res.message || "Failed to send driver request");
      }
    } catch (error:any) {
      alert(error.message || "Error requesting driver")
    } finally {
      setRequestingId(null);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 p-2 sm:p-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
            Manage Orders
          </h1>
          <span className="rounded-none text-[11px] font-mono uppercase tracking-wider border border-border px-1.5 py-0.5 text-muted-foreground">
            Vendor Store
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Track and update fulfillment status for customer store orders.
        </p>
      </div>

      {/* Grid of Order Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orderItems.map((item) => (
          <div
            key={item.id}
            className="rounded-none border border-gray-300 bg-card shadow-none p-4 flex flex-col justify-between space-y-7 hover:border-foreground transition-colors"
          >
            {/* Top row: Order ID + Status badge */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-mono uppercase font-bold text-muted-foreground shrink-0">
                  Order
                </span>
                <span className="text-xs font-mono font-bold text-foreground truncate">
                  #{item.order.id.slice(0, 8)}
                </span>
              </div>
              <span className="rounded-none text-[10px] font-mono uppercase font-bold tracking-wider border border-border bg-muted/40 px-2 py-0.5 text-foreground shrink-0">
                {item.orderStatus.replace(/_/g, " ")}
              </span>
            </div>

            {/* Product details */}
            <div className="space-y-1">
              <p className="font-bold text-sm text-foreground uppercase tracking-tight line-clamp-1">
                {item.product.name}
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                Quantity: <span className="font-semibold text-foreground">{item.quantity}</span> × ${item.price} ={" "}
                <span className="font-semibold text-foreground">${item.quantity * item.price}</span>
              </p>
            </div>

            {/* Customer & delivery info */}
            <div className="border-t border-border pt-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-muted-foreground">Customer</span>
                <span className="font-medium text-foreground truncate max-w-[60%] text-right">
                  {item.order.customer.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-muted-foreground">Phone</span>
                <span className="font-mono text-muted-foreground">{item.order.customer.phone}</span>
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="text-[11px] font-mono uppercase text-muted-foreground">Deliver to</span>
                <span className="text-xs text-foreground line-clamp-2 mt-0.5">
                  {item.order.customer.address?.address ?? "No address provided"}
                </span>
              </div>
            </div>

            {/* Status selection - dedicated bottom row to prevent layout breakage on resize */}
            <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase font-bold text-muted-foreground shrink-0">
                Fulfillment
              </span>
              <select
                value={item.orderStatus}
                onChange={(e) => orderStatusChange(item.id, e.target.value as OrderStatus)}
                className="rounded-none border border-border bg-background px-2 py-1 text-xs font-mono uppercase font-semibold text-foreground focus:outline-none focus:border-foreground cursor-pointer transition-colors max-w-[65%]"
              >
                {statusOptions.map((e) => (
                  <option key={e.value} value={e.value} className="bg-background text-foreground font-mono">
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Driver Request / Assignment Row */}
            <div className="border-t border-border pt-3">
              {item.driver ? (
                <div className="flex items-center justify-between text-xs font-mono p-2 bg-muted/40 border border-border rounded-none">
                  <span className="text-[11px] uppercase font-bold text-muted-foreground">Driver:</span>
                  <span className="font-bold text-foreground truncate">{item.driver.name} ({item.driver.phone})</span>
                </div>
              ) :  requestingIds.includes(item.id) ? (
                 <button
                      disabled
                      className="w-full border border-dashed border-border py-1.5 px-3 text-[11px] font-mono text-muted-foreground uppercase opacity-70 cursor-not-allowed"
                    >
                      Driver Requested (Pending)
                  </button>
                ) :   (
                <button
                  onClick={() => handleRequestDriver(item.id)}
                  disabled={requestingId === item.id}
                  className="w-full rounded-none border border-foreground bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 py-1.5 px-3 text-[11px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer"
                >
                  {requestingId === item.id ? "Sending Request..." : "Request Driver"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
