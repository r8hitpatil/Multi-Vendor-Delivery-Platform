"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useOrder } from "../hooks/useOrder";
import PageLoading from "../loading";
import { 
  Package, 
  Phone, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Radio, 
  ArrowRight,
  Store,
  Clock
} from "lucide-react";
import LiveDeliveryMap from "../orders/components/LiveDeliveryMap";
import { socket } from "@/app/libs/socket";

export default function CustomerLiveOrdersPage() {
  const { data: orders = [], isLoading, isError, error, refetch, isFetching } = useOrder();

  // Listen for socket events to automatically refresh orders on status changes
  useEffect(() => {
    socket.connect();

    const handleStatusUpdate = () => {
      refetch();
    };

    socket.on("status-update", handleStatusUpdate);

    return () => {
      socket.off("status-update", handleStatusUpdate);
    };
  }, [refetch]);

  if (isLoading) return <PageLoading />;

  if (isError) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="rounded-none border border-destructive/50 bg-destructive/10 p-4 text-xs font-mono uppercase text-destructive">
          Error loading active orders: {error.message}
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

  // Filter only active / live ongoing orders (exclude orders where all items are DELIVERED or CANCELLED)
  const liveOrders = orders.filter((order: any) =>
    order.orderItems?.some(
      (item: any) => item.orderStatus !== "DELIVERED" && item.orderStatus !== "CANCELLED"
    )
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
              Live Orders
            </h1>
            <span className="flex items-center gap-1.5 rounded-none text-[10px] sm:text-[11px] font-mono uppercase tracking-wider border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{liveOrders.length} Active Delivery</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time GPS tracking and instant delivery confirmation codes for your active orders.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs font-mono uppercase font-bold border border-border px-3 py-1.5 hover:border-foreground hover:bg-muted/40 transition-colors cursor-pointer w-fit disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          <span>{isFetching ? "Syncing..." : "Refresh"}</span>
        </button>
      </div>

      {/* No Live Orders State */}
      {liveOrders.length === 0 ? (
        <div className="rounded-none border border-border bg-card p-8 sm:p-14 text-center space-y-4">
          <div className="mx-auto w-12 h-12 border border-border flex items-center justify-center text-muted-foreground">
            <Radio className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground uppercase font-mono">
              No Active Deliveries
            </h2>
            <p className="text-xs font-mono text-muted-foreground max-w-md mx-auto">
              You do not have any ongoing deliveries right now. Placed orders will appear here for live map tracking and handover verification.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-foreground bg-foreground text-background px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-neutral-800 transition-colors"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/dashboard/customer/orders"
              className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2 text-xs font-mono uppercase font-bold hover:border-foreground transition-colors"
            >
              <span>View Past Orders</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Active Live Orders List */
        <div className="space-y-6">
          {liveOrders.map((order: any) => {
            const activeItems = order.orderItems.filter(
              (item: any) => item.orderStatus !== "DELIVERED" && item.orderStatus !== "CANCELLED"
            );

            return (
              <div
                key={order.id}
                className="rounded-none border-2 border-foreground bg-card p-4 sm:p-6 space-y-6 shadow-sm"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase font-bold text-muted-foreground">
                      Order ID:
                    </span>
                    <span className="text-sm font-mono font-extrabold text-foreground">
                      #{order.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase text-muted-foreground">
                      Destination:
                    </span>
                    <span className="text-xs font-mono font-bold text-foreground">
                      {order.customer?.address?.address ? `${order.customer.address.address.slice(0, 24)}...` : "Your Location"}
                    </span>
                  </div>
                </div>

                {/* Active Items & Real-time Live Map */}
                <div className="space-y-6">
                  {activeItems.map((item: any) => {
                    const isOutOfDelivery = item.orderStatus === "OUT_OF_DELIVERY";
                    const hasDriver = Boolean(item.driver || item.driverId);

                    return (
                      <div key={item.id} className="space-y-4">
                        {/* Item Row */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-extrabold text-base text-foreground uppercase tracking-tight">
                              {item.product?.name || "Order Item"}
                            </h3>
                            <p className="text-xs font-mono text-muted-foreground mt-0.5">
                              Quantity: <strong className="text-foreground">{item.quantity}</strong> × ${item.price}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-none text-[10px] font-mono uppercase font-bold tracking-wider border border-emerald-500/50 bg-emerald-500/10 text-emerald-500 px-2.5 py-1">
                              {item.orderStatus ? item.orderStatus.replace(/_/g, " ") : "PROCESSING"}
                            </span>
                          </div>
                        </div>

                        {/* Store Info */}
                        {item.product?.storeProducts?.address?.storeName && (
                          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground border-l-2 border-border pl-2.5">
                            <Store className="h-3.5 w-3.5 text-foreground shrink-0" />
                            <span>From:</span>
                            <span className="font-bold text-foreground">
                              {item.product.storeProducts.address.storeName}
                            </span>
                          </div>
                        )}

                        {/* Driver Contact Badge */}
                        {item.driver && (
                          <div className="border border-border bg-muted/20 p-2.5 text-xs font-mono flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-foreground" />
                              <span className="text-muted-foreground">Assigned Driver:</span>
                              <strong className="text-foreground">{item.driver.name}</strong>
                            </div>
                            {item.driver.phone && (
                              <a
                                href={`tel:${item.driver.phone}`}
                                className="inline-flex items-center gap-1 font-bold text-foreground hover:underline"
                              >
                                <Phone className="h-3 w-3" />
                                <span>{item.driver.phone}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Real-time Map Canvas */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono uppercase">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                              <span>Live Telemetry &amp; GPS Radar</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Auto-updates via WebSockets
                            </span>
                          </div>

                          <LiveDeliveryMap
                            driverId={item.driver?.id || item.driverId}
                            storeLat={item.product?.storeProducts?.address?.lat}
                            storeLong={item.product?.storeProducts?.address?.long}
                            storeName={item.product?.storeProducts?.address?.storeName}
                            customerLat={order.customer?.address?.lat}
                            customerLong={order.customer?.address?.long}
                            customerAddress={order.customer?.address?.address}
                          />
                        </div>

                        {/* Customer Delivery Handover OTP */}
                        {item.customerOtp && (
                          <div className="rounded-none border-2 border-foreground bg-muted/30 p-4 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span className="text-xs font-mono uppercase font-extrabold text-foreground tracking-tight">
                                  Delivery Handover Code
                                </span>
                              </div>
                              <span className="rounded-none text-[9px] font-mono uppercase font-bold border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-500">
                                Give to Driver
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border">
                              <p className="text-[11px] font-mono text-muted-foreground leading-tight max-w-sm">
                                Read this 4-digit verification code to your driver upon arrival to confirm physical handover:
                              </p>
                              <div className="border-2 border-foreground bg-background px-5 py-2 text-center shrink-0">
                                <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-foreground">
                                  {item.customerOtp}
                                </span>
                              </div>
                            </div>
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
      )}
    </div>
  );
}
