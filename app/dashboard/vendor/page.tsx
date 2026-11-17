"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { requireVendor } from "@/app/api/auth/action";
import { createStore, getVendorAnalytics } from "@/app/api/vendor/action";
import { createStoreSchema } from "@/app/api/vendor/schema";
import { Status } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import PageLoading from "./loading";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Store,
  DollarSign,
  Package,
  TrendingUp,
  Boxes,
  RefreshCw,
  ArrowRight,
  Truck,
  CheckCircle2,
  Clock,
  Plus
} from "lucide-react";

type FormValues = z.infer<typeof createStoreSchema>;

type VendorAnalyticsData = NonNullable<
  Extract<Awaited<ReturnType<typeof getVendorAnalytics>>, { success: true }>["data"]
>;

export default function VendorPage() {
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>();
  const [hasStore, setHasStore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<VendorAnalyticsData | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      storeName: "",
      storeAddress: "",
      lat: "",
      long: "",
    },
  });

  const loadAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await getVendorAnalytics();
      if (res.success && res.data) {
        setAnalytics(res.data);
      } else if (!res.success && res.message) {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load vendor analytics");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const res = await requireVendor();
        setStatus(res.status);
        const storeExists = Boolean(res.storeId);
        setHasStore(storeExists);

        if (storeExists && res.status === "ACCEPTED") {
          const analyticsRes = await getVendorAnalytics();
          if (analyticsRes.success && analyticsRes.data) {
            setAnalytics(analyticsRes.data);
          }
        }
      } catch (err: any) {
        setError(err.message || "Authentication error");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthAndLoad();
  }, []);

  async function onSubmit(data: FormValues) {
    setError("");
    const res = await createStore(data);

    if (res.success) {
      setHasStore(true);
      window.location.reload();
    } else {
      setError(res.message);
    }
  }

  if (isLoading) return <PageLoading />;

  if (status === "PENDING") {
    return (
      <div className="flex w-full justify-center p-4 md:p-8">
        <div className="w-full max-w-md rounded-none border border-border bg-card p-6 sm:p-8 text-center space-y-3">
          <div className="mx-auto w-10 h-10 border border-amber-500/50 bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold uppercase font-mono tracking-tight text-foreground">
            Approval Pending
          </h2>
          <p className="text-xs font-mono text-muted-foreground uppercase">
            Your vendor application is currently under review by the platform administrator.
          </p>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="flex w-full justify-center p-4 md:p-8">
        <div className="w-full max-w-md rounded-none border border-destructive bg-destructive/10 p-6 sm:p-8 text-center space-y-3">
          <h2 className="text-base font-bold uppercase font-mono tracking-tight text-destructive">
            Account Rejected
          </h2>
          <p className="text-xs font-mono text-muted-foreground uppercase">
            Your vendor application was rejected by the administrator. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Active Store - Render Vendor Analytics Dashboard
  if (hasStore && analytics) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
        {error && (
          <div className="rounded-none border border-destructive bg-destructive/10 p-3 text-xs font-mono uppercase text-destructive">
            {error}
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-foreground">
                {analytics.storeName}
              </h1>
              <span className="rounded-none border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono uppercase font-bold text-emerald-500">
                Active Store
              </span>
            </div>
            {analytics.storeAddress && (
              <p className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" />
                <span>{analytics.storeAddress}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadAnalytics}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-mono uppercase font-bold hover:border-foreground transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
            </button>
            <Link
              href="/dashboard/vendor/create-product"
              className="inline-flex items-center gap-1.5 border border-foreground bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase font-bold hover:bg-neutral-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </Link>
            <Link
              href="/dashboard/vendor/manage-orders"
              className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-mono uppercase font-bold hover:border-foreground transition-colors"
            >
              <span>Manage Orders &rarr;</span>
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Revenue */}
          <div className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                Gross Revenue
              </span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
              ${analytics.totalRevenue}
            </div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">
              From {analytics.deliveredOrders} Delivered Orders
            </p>
          </div>

          {/* 2. Total Orders */}
          <div className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                Total Orders
              </span>
              <Package className="h-4 w-4 text-foreground" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
              {analytics.totalOrders}
            </div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">
              {analytics.activeOrders} Active / {analytics.deliveredOrders} Delivered
            </p>
          </div>

          {/* 3. Fulfillment Rate */}
          <div className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                Fulfillment Rate
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
              {analytics.fulfillmentRate}%
            </div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">
              {analytics.cancelledOrders} Cancelled
            </p>
          </div>

          {/* 4. Products in Inventory */}
          <div className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                Catalog Size
              </span>
              <Boxes className="h-4 w-4 text-foreground" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
              {analytics.totalProducts}
            </div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">
              {analytics.totalStockUnits} Stock Units Available
            </p>
          </div>
        </div>

        {/* Middle Section: Orders Pipeline & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Breakdown */}
          <div className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-sm font-bold uppercase font-mono tracking-tight text-foreground">
                Order Pipeline Status
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {analytics.totalOrders} Total
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="border border-border p-3 space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">Placed</span>
                <span className="text-lg font-mono font-bold text-foreground">
                  {analytics.statusCounts.PLACED}
                </span>
              </div>
              <div className="border border-border p-3 space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">Accepted</span>
                <span className="text-lg font-mono font-bold text-foreground">
                  {analytics.statusCounts.VENDOR_ACCEPTED}
                </span>
              </div>
              <div className="border border-border p-3 space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">Ready</span>
                <span className="text-lg font-mono font-bold text-foreground">
                  {analytics.statusCounts.READY}
                </span>
              </div>
              <div className="border border-border p-3 space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">In Transit</span>
                <span className="text-lg font-mono font-bold text-emerald-500">
                  {analytics.statusCounts.OUT_OF_DELIVERY}
                </span>
              </div>
              <div className="border border-border p-3 space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">Delivered</span>
                <span className="text-lg font-mono font-bold text-emerald-500">
                  {analytics.statusCounts.DELIVERED}
                </span>
              </div>
              <div className="border border-border p-3 space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">Cancelled</span>
                <span className="text-lg font-mono font-bold text-muted-foreground">
                  {analytics.statusCounts.CANCELLED}
                </span>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-sm font-bold uppercase font-mono tracking-tight text-foreground">
                Top Selling Products
              </h2>
              <Link
                href="/dashboard/vendor/manage-product"
                className="text-[10px] font-mono uppercase text-primary hover:underline"
              >
                View Catalog &rarr;
              </Link>
            </div>

            {analytics.topProducts.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono uppercase text-muted-foreground border border-border">
                No delivered sales recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border border border-border">
                {analytics.topProducts.map((p, idx) => (
                  <div key={p.id || idx} className="p-2.5 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-bold">#{idx + 1}</span>
                      <span className="font-bold uppercase text-foreground">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-foreground">${p.revenue}</span>
                      <span className="text-[10px] text-muted-foreground block">({p.unitsSold} units)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-sm font-bold uppercase font-mono tracking-tight text-foreground">
              Recent Store Orders
            </h2>
            <Link
              href="/dashboard/vendor/manage-orders"
              className="text-[10px] font-mono uppercase text-primary hover:underline"
            >
              All Orders &rarr;
            </Link>
          </div>

          {analytics.recentOrders.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono uppercase text-muted-foreground border border-border">
              No orders received yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border">
              <table className="w-full text-left text-xs font-mono uppercase">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="p-2.5 font-bold">Order ID</th>
                    <th className="p-2.5 font-bold">Customer</th>
                    <th className="p-2.5 font-bold">Item</th>
                    <th className="p-2.5 font-bold">Qty</th>
                    <th className="p-2.5 font-bold">Total</th>
                    <th className="p-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-2.5 font-bold">#{order.orderId.slice(0, 8)}</td>
                      <td className="p-2.5 text-muted-foreground">{order.customerName}</td>
                      <td className="p-2.5 font-semibold text-foreground">{order.productName}</td>
                      <td className="p-2.5">{order.quantity}</td>
                      <td className="p-2.5 font-bold text-foreground">${order.total}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold border ${
                            order.orderStatus === "DELIVERED"
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                              : order.orderStatus === "OUT_OF_DELIVERY"
                              ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-500"
                              : "border-amber-500/50 bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {order.orderStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // No Store Created - Render Store Creation Form
  return (
    <div className="flex w-full justify-center p-4 md:p-8">
      <Card className="w-full max-w-sm rounded-none border border-border">
        <CardHeader>
          <CardTitle className="uppercase font-mono">Create Store</CardTitle>
          <CardDescription className="font-mono text-xs uppercase">
            Enter your store details to begin receiving orders.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            {error && (
              <div className="rounded-none bg-destructive/15 border border-destructive/50 p-3 text-xs font-mono uppercase text-destructive mb-4">
                {error}
              </div>
            )}
            <FieldGroup className="flex flex-col gap-4 font-mono">
              <Controller
                name="storeName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="store-name" className="uppercase text-xs font-bold">Store Name</FieldLabel>
                    <Input
                      {...field}
                      id="store-name"
                      type="text"
                      className="rounded-none"
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. Green Valley Groceries"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="storeAddress"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="store-address" className="uppercase text-xs font-bold">Store Address</FieldLabel>
                    <Input
                      {...field}
                      id="store-address"
                      type="text"
                      className="rounded-none"
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. Main Street, Sector 4"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="lat"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="store-lat" className="uppercase text-xs font-bold">Latitude</FieldLabel>
                    <Input
                      {...field}
                      id="store-lat"
                      type="text"
                      className="rounded-none"
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. 18.7487"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="long"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="store-long" className="uppercase text-xs font-bold">Longitude</FieldLabel>
                    <Input
                      {...field}
                      id="store-long"
                      type="text"
                      className="rounded-none"
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. 73.6657"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
          <div className="p-4 pt-2">
            <Button
              type="submit"
              className="w-full rounded-none font-mono uppercase font-bold"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating Store..." : "Create Store"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
