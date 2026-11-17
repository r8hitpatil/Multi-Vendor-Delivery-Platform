"use client";

import { useEffect, useState } from "react";
import { 
  approveVendor, 
  getPendingVendors, 
  rejectVendor, 
  getDrivers, 
  getOrdersNeedingAdmin, 
  getAdminInfo,
  getAdminAnalytics 
} from "@/app/api/admin/action";
import { adminAssignDriverOrder } from "@/app/api/driver/action";
import { User } from "@/app/generated/prisma/client";
import { socket } from "@/app/libs/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageLoading from "./loading";
import { 
  DollarSign, 
  Store, 
  Truck, 
  Users, 
  TrendingUp, 
  Package, 
  RefreshCw, 
  AlertTriangle,
  Radio,
  CheckCircle2
} from "lucide-react";

type AdminOrder = NonNullable<
  Extract<Awaited<ReturnType<typeof getOrdersNeedingAdmin>>, { success: true }>["data"]
>[number];

type Driver = NonNullable<
  Extract<Awaited<ReturnType<typeof getDrivers>>, { success: true }>["data"]
>[number];

type AdminAnalyticsData = NonNullable<
  Extract<Awaited<ReturnType<typeof getAdminAnalytics>>, { success: true }>["data"]
>;

type UrgentAlert = {
  orderId: string;
  message: string;
};

export default function AdminPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [pending, setPending] = useState<User[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverMap, setSelectedDriverMap] = useState<Record<string, string>>({});
  const [urgentAlert, setUrgentAlert] = useState<UrgentAlert | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // 1. Initial Data Fetching
  async function loadData() {
    setIsRefreshing(true);
    try {
      const [pendingRes, ordersRes, driversRes, analyticsRes] = await Promise.all([
        getPendingVendors(),
        getOrdersNeedingAdmin(),
        getDrivers(),
        getAdminAnalytics(),
      ]);

      if (pendingRes.success && pendingRes.data) setPending(pendingRes.data);
      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data);
      if (driversRes.success && driversRes.data) setDrivers(driversRes.data);
      if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
    } catch (err: any) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  // 2. Socket Room Join & Live Alert Listener
  useEffect(() => {
    let isMounted = true;

    async function initSocket() {
      const info = await getAdminInfo();
      if (!info.success || !info.data?.adminId || !isMounted) return;

      const adminId = info.data.adminId;

      socket.connect();
      socket.emit("join-admin", adminId);

      socket.on("admin-urgent-order", (data: { orderId: string; message: string }) => {
        setUrgentAlert(data);
        // Refresh orders and analytics immediately when an alert arrives
        getOrdersNeedingAdmin().then((res) => {
          if (res.success && res.data) setOrders(res.data);
        });
        getAdminAnalytics().then((res) => {
          if (res.success && res.data) setAnalytics(res.data);
        });
      });
    }

    initSocket();
    loadData();

    return () => {
      isMounted = false;
      socket.off("admin-urgent-order");
    };
  }, []);

  // 3. Manual Assignment Handler
  async function handleAssignDriver(orderItemId: string) {
    const driverId = selectedDriverMap[orderItemId];
    if (!driverId) {
      alert("Please select a driver from the dropdown first.");
      return;
    }

    try {
      setAssigningId(orderItemId);
      const res = await adminAssignDriverOrder(driverId, orderItemId);
      if (res.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderItemId));
        if (urgentAlert?.orderId === orderItemId) setUrgentAlert(null);
        // Refresh analytics after assignment
        getAdminAnalytics().then((aRes) => {
          if (aRes.success && aRes.data) setAnalytics(aRes.data);
        });
        alert(res.message);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || "Failed to assign driver");
    } finally {
      setAssigningId(null);
    }
  }

  async function onAcceptVendor(id: string) {
    const res = await approveVendor(id);
    if (res.success) {
      setPending((prev) => prev.filter((v) => v.id !== id));
      getAdminAnalytics().then((aRes) => {
        if (aRes.success && aRes.data) setAnalytics(aRes.data);
      });
    }
  }

  async function onRejectVendor(id: string) {
    const res = await rejectVendor(id);
    if (res.success) {
      setPending((prev) => prev.filter((v) => v.id !== id));
      getAdminAnalytics().then((aRes) => {
        if (aRes.success && aRes.data) setAnalytics(aRes.data);
      });
    }
  }

  if (isLoading) return <PageLoading />;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {error && (
        <div className="rounded-none border border-destructive bg-destructive/10 p-3 text-xs font-mono uppercase text-destructive">
          {error}
        </div>
      )}

      {/* Admin Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-foreground">
              Admin Overview
            </h1>
            <span className="rounded-none border border-foreground/30 bg-muted/40 px-2 py-0.5 text-[10px] font-mono uppercase font-bold text-foreground">
              Operations Center
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">
            Platform-wide analytics, revenue tracking, and emergency courier dispatch.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-mono uppercase font-bold hover:border-foreground transition-colors cursor-pointer w-fit disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Platform Analytics: 4 Key Metric Cards */}
      {analytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Platform Income */}
            <div className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                  Total Income
                </span>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
                ${analytics.totalIncome}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase">
                Fulfilled Deliveries (${analytics.pipelineIncome} In Pipeline)
              </p>
            </div>

            {/* 2. Total Vendors */}
            <div className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                  Total Vendors
                </span>
                <Store className="h-4 w-4 text-foreground" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
                {analytics.totalVendors}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase">
                {analytics.activeVendors} Active / {analytics.pendingVendors} Pending
              </p>
            </div>

            {/* 3. Total Users */}
            <div className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                  Total Users
                </span>
                <Users className="h-4 w-4 text-foreground" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
                {analytics.totalUsers}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase">
                {analytics.totalCustomers} Customers / {analytics.totalDrivers} Drivers
              </p>
            </div>

            {/* 4. Total Platform Orders */}
            <div className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                  Platform Orders
                </span>
                <Package className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
                {analytics.totalOrders}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase">
                {analytics.fulfillmentRate}% Fulfillment Rate
              </p>
            </div>
          </div>

          {/* KPI Radar Strip */}
          <div className="border border-border bg-muted/20 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono uppercase">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span className="font-bold text-foreground">Platform Radar:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div>
                <span>Active Deliveries: </span>
                <strong className="text-foreground">{analytics.activeOrders}</strong>
              </div>
              <div>
                <span>Completed: </span>
                <strong className="text-emerald-500">{analytics.deliveredOrders}</strong>
              </div>
              <div>
                <span>Needs Admin: </span>
                <strong className={orders.length > 0 ? "text-red-500 font-bold" : "text-foreground"}>
                  {orders.length}
                </strong>
              </div>
              <div>
                <span>Pending Approvals: </span>
                <strong className={pending.length > 0 ? "text-amber-500 font-bold" : "text-foreground"}>
                  {pending.length}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Live Alert Banner */}
      {urgentAlert && (
        <div className="p-4 border-2 border-red-500 bg-red-500/10 rounded-none flex items-center justify-between">
          <div>
            <span className="font-mono text-xs font-bold text-red-500 uppercase tracking-widest block">
              Urgent Action Required
            </span>
            <p className="font-bold text-sm text-foreground">{urgentAlert.message}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-none text-xs font-mono uppercase cursor-pointer"
            onClick={() => setUrgentAlert(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Section 1: Orders Needing Manual Assignment */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-xl font-bold uppercase tracking-tight">
            Orders Needing Assignment ({orders.length})
          </h2>
          <span className="text-xs font-mono text-muted-foreground uppercase">
            Auto-Search Exhausted / Driver Dropped
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-6 border border-border bg-card text-center text-xs font-mono uppercase text-muted-foreground">
            No orders currently waiting for manual assignment.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orders.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-border bg-card space-y-3 rounded-none"
              >
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="font-mono text-xs font-bold uppercase">
                    Order #{item.order.id.slice(0, 8)}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-red-500/40 text-red-500 uppercase font-bold">
                    NEEDS ADMIN
                  </span>
                </div>

                <div className="text-xs font-mono space-y-1">
                  <p className="font-bold text-foreground uppercase">{item.product.name} (x{item.quantity})</p>
                  <p className="text-muted-foreground">
                    Pickup: {item.product.storeProducts?.address?.storeName || "Vendor"}
                  </p>
                  <p className="text-muted-foreground">
                    Dropoff: {item.order.customer?.name} ({item.order.customer?.address?.address || "No address"})
                  </p>
                </div>

                {/* Assignment Controls */}
                <div className="pt-2 flex gap-2">
                  <select
                    className="flex-1 bg-background border border-border px-2 py-1.5 text-xs font-mono uppercase text-foreground focus:outline-none"
                    value={selectedDriverMap[item.id] || ""}
                    onChange={(e) =>
                      setSelectedDriverMap((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    disabled={assigningId === item.id}
                    className="rounded-none text-xs font-mono uppercase cursor-pointer"
                    onClick={() => handleAssignDriver(item.id)}
                  >
                    {assigningId === item.id ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Pending Vendor Approvals */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold uppercase tracking-tight border-b border-border pb-2">
          Pending Vendor Approvals ({pending.length})
        </h2>
        {pending.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((e) => (
              <Card className="rounded-none shadow-none" key={e.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="text-xs font-mono">
                    <span className="font-semibold text-muted-foreground uppercase">Vendor: </span>
                    <span className="font-bold text-foreground uppercase">{e.name}</span>
                  </div>
                  <div className="text-xs font-mono">
                    <span className="font-semibold text-muted-foreground uppercase">Status: </span>
                    <span className="font-bold text-foreground uppercase">{e.status}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 rounded-none text-xs font-mono uppercase"
                      onClick={() => onAcceptVendor(e.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="flex-1 rounded-none text-xs font-mono uppercase"
                      onClick={() => onRejectVendor(e.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-6 border border-border bg-card text-center text-xs font-mono uppercase text-muted-foreground">
            No pending vendors to approve.
          </div>
        )}
      </div>
    </div>
  );
}
