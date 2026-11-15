"use client";

import { useOrder } from "../hooks/useOrder";
import PageLoading from "../loading";
import { Package, Phone, Truck, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";

export default function CustomerOrderPage() {
  const { data: orders = [], isLoading, isError, error, refetch, isFetching } = useOrder();

  if (isLoading) return <PageLoading />;

  if (isError) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="rounded-none border border-destructive/50 bg-destructive/10 p-4 text-xs font-mono uppercase text-destructive">
          Error loading orders: {error.message}
        </div>
        <button
          onClick={() => refetch()}
          className="border border-border px-3 py-1.5 text-xs font-mono uppercase hover:border-foreground"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
                My Orders
              </h1>
              <span className="rounded-none text-[10px] sm:text-[11px] font-mono uppercase tracking-wider border border-border px-1.5 py-0.5 text-muted-foreground">
                Customer Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Track your ongoing deliveries and view your delivery confirmation codes.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs font-mono uppercase font-bold border border-border px-3 py-1.5 hover:border-foreground hover:bg-muted/40 transition-colors cursor-pointer w-fit disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>{isFetching ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>

        <div className="rounded-none border border-border bg-card p-8 sm:p-12 text-center space-y-3">
          <div className="mx-auto w-10 h-10 border border-border flex items-center justify-center text-muted-foreground">
            <Package className="h-5 w-5" />
          </div>
          <p className="text-xs font-mono uppercase text-muted-foreground">
            You haven't placed any orders yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
              My Orders
            </h1>
            <span className="rounded-none text-[10px] sm:text-[11px] font-mono uppercase tracking-wider border border-border px-2 py-0.5 text-muted-foreground">
              {orders.length} Order{orders.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Your delivery handover OTP is ready immediately. Give it to your driver upon arrival.
          </p>
        </div>

        {/* Pure React Query Refetch button */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs font-mono uppercase font-bold border border-border px-3 py-1.5 hover:border-foreground hover:bg-muted/40 transition-colors cursor-pointer w-fit disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          <span>{isFetching ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {orders.map((order: any) => {
          const totalOrderPrice = order.orderItems.reduce(
            (acc: number, item: any) => acc + item.price * item.quantity,
            0
          );

          return (
            <div
              key={order.id}
              className="rounded-none border border-border bg-card p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-foreground transition-colors shadow-none"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-mono uppercase font-bold text-muted-foreground shrink-0">
                    Order
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground truncate">
                    #{order.id.slice(0, 8)}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-emerald-500">
                  Total: ${totalOrderPrice}
                </span>
              </div>

              {/* Order Items */}
              <div className="space-y-4 divide-y divide-border">
                {order.orderItems.map((item: any) => {
                  const isOutOfDelivery = item.orderStatus === "OUT_OF_DELIVERY";
                  const isDelivered = item.orderStatus === "DELIVERED";

                  return (
                    <div key={item.id} className="pt-3 first:pt-0 space-y-3">
                      {/* Item row + status badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-sm text-foreground uppercase tracking-tight truncate">
                            {item.product?.name || "Order Item"}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            Qty: <span className="font-semibold text-foreground">{item.quantity}</span> × ${item.price} ={" "}
                            <span className="font-semibold text-foreground">${item.quantity * item.price}</span>
                          </p>
                        </div>

                        <span
                          className={`rounded-none text-[10px] font-mono uppercase font-bold tracking-wider border px-2 py-0.5 shrink-0 ${
                            isDelivered
                              ? "border-border bg-muted/30 text-muted-foreground"
                              : isOutOfDelivery
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 animate-pulse"
                              : "border-amber-500/50 bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {item.orderStatus ? item.orderStatus.replace(/_/g, " ") : "PROCESSING"}
                        </span>
                      </div>

                      {/* Driver Info if Assigned */}
                      {item.driver && (
                        <div className="border border-border/60 bg-muted/20 p-2 text-xs font-mono flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Truck className="h-3.5 w-3.5 text-foreground" />
                            <span>Driver:</span>
                            <span className="font-bold text-foreground">{item.driver.name}</span>
                          </div>
                          {item.driver.phone && (
                            <a
                              href={`tel:${item.driver.phone}`}
                              className="text-primary hover:underline flex items-center gap-1 font-semibold text-[11px]"
                            >
                              <Phone className="h-3 w-3" />
                              {item.driver.phone}
                            </a>
                          )}
                        </div>
                      )}

                      {/* 🔑 CUSTOMER DELIVERY OTP: Available immediately for the customer! */}
                      {item.customerOtp && !isDelivered && (
                        <div className="rounded-none border-2 border-foreground bg-muted/40 p-3 sm:p-3.5 space-y-2 mt-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                              <span className="text-xs font-mono uppercase font-extrabold text-foreground tracking-tight">
                                Delivery Handover Code
                              </span>
                            </div>
                            <span className="rounded-none text-[9px] font-mono uppercase font-bold border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-500">
                              Ready
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border">
                            <p className="text-[11px] font-mono text-muted-foreground leading-tight">
                              Share this 4-digit code with your driver upon arrival to confirm delivery:
                            </p>
                            <div className="border-2 border-foreground bg-background px-4 py-1.5 text-center shrink-0">
                              <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-widest text-foreground">
                                {item.customerOtp}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Delivered confirmation */}
                      {isDelivered && (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground pt-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="font-bold uppercase text-emerald-500">Delivered successfully</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
