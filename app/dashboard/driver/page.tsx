"use client";

import { useEffect, useState } from "react";
import { driverAcceptOrder } from "@/app/api/driver/action";
import { useRouter } from "next/navigation";
import { useDriver } from "./context/DriverContext";
import {
  ArrowRight,
  Clock,
  Navigation,
  Package,
  Radio,
} from "lucide-react";

export default function DriverPage() {
  const router = useRouter();
  const { userDetails, location, fcmStatus, activeAlert, setActiveAlert, error } = useDriver();
  const [isAccepting, setIsAccepting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  async function handleAccepting() {
    if (!activeAlert || isAccepting) return;

    try {
      setIsAccepting(true);
      const res = await driverAcceptOrder(activeAlert.orderId);
      if (!res.success) {
        setActiveAlert(null);
        alert(res.message);
        return;
      }

      setActiveAlert(null);
      alert(res.message);
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setIsAccepting(false);
    }
  }

  useEffect(() => {
    if (!activeAlert || activeAlert.type === "ASSIGNED") return;
    setTimeLeft(20);
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setActiveAlert(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      clearInterval(t);
    };
  }, [activeAlert?.orderId, activeAlert?.type, setActiveAlert]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
              Driver Dashboard
            </h1>
            <span className="flex items-center gap-1.5 rounded-none text-[10px] sm:text-[11px] font-mono uppercase tracking-wider border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-green-500">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </span>
          </div>

          <button
            onClick={() => router.push("/dashboard/driver/orders")}
            className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase border border-border px-3 py-1.5 hover:border-foreground hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <span>My Deliveries</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Real-time delivery management, GPS broadcasting, and dispatch alerts.
        </p>
      </div>

      {error && (
        <div className="rounded-none border border-destructive/50 bg-destructive/10 p-3 text-xs font-mono uppercase text-destructive">
          Error: {error}
        </div>
      )}

      {/* Foreground Alert Card */}
      {activeAlert && (
        <div className="p-4 sm:p-5 border-2 border-foreground bg-accent/30 rounded-none space-y-3 w-full shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-sm sm:text-base uppercase tracking-tight text-foreground">
                {activeAlert.title}
              </span>
            </div>
            {activeAlert.type !== "ASSIGNED" && (
              <span className="rounded-none text-xs font-mono font-bold border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-red-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeLeft}s
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono">{activeAlert.body}</p>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {activeAlert.type === "ASSIGNED" ? (
              <>
                <button
                  onClick={() => {
                    setActiveAlert(null);
                    router.push("/dashboard/driver/orders");
                  }}
                  className="flex-1 bg-foreground text-background py-2 sm:py-1.5 text-xs font-bold uppercase cursor-pointer hover:opacity-90 flex items-center justify-center gap-1.5"
                >
                  <Package className="h-3.5 w-3.5" />
                  View Deliveries
                </button>
                <button
                  onClick={() => setActiveAlert(null)}
                  className="border border-border px-4 py-2 sm:py-1.5 text-xs font-bold uppercase cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleAccepting}
                  disabled={isAccepting}
                  className="flex-1 bg-foreground text-background py-2 sm:py-1.5 text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  {isAccepting ? "Accepting..." : `Accept Order (${timeLeft}s)`}
                </button>
                <button
                  onClick={() => setActiveAlert(null)}
                  className="border border-border px-4 py-2 sm:py-1.5 text-xs font-bold uppercase cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Decline
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Status & Quick Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Deliveries Portal */}
        <div
          onClick={() => router.push("/dashboard/driver/orders")}
          className="p-4 border border-border bg-card rounded-none space-y-3 cursor-pointer hover:border-foreground transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-muted-foreground">Active Orders</span>
            <Package className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <p className="text-base sm:text-lg font-bold uppercase tracking-tight text-foreground">
            Manage Deliveries
          </p>
          <p className="text-xs text-muted-foreground">
            View orders, pickup addresses, customer details, or drop assignments.
          </p>
          <div className="pt-1 flex items-center gap-1 text-xs font-mono font-bold text-foreground group-hover:underline">
            <span>Open Orders Page</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Card 2: Live GPS Tracking */}
        <div className="p-4 border border-border bg-card rounded-none space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-muted-foreground">GPS Beacon</span>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-base sm:text-lg font-bold uppercase tracking-tight text-foreground flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Broadcasting
          </p>
          <p className="text-xs font-mono text-muted-foreground break-all">
            {location
              ? `Lat: ${location.lat.toFixed(4)}, Long: ${location.long.toFixed(4)}`
              : "Acquiring GPS fix..."}
          </p>
          <span className="inline-block text-[10px] font-mono uppercase text-muted-foreground border border-border px-1.5 py-0.5">
            High Accuracy
          </span>
        </div>

        {/* Card 3: Push Notifications & Connection */}
        <div className="p-4 border border-border bg-card rounded-none space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-muted-foreground">Alert Channel</span>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-base sm:text-lg font-bold uppercase tracking-tight text-foreground">
            Web & Push Alerts
          </p>
          <p className="text-xs font-mono text-muted-foreground line-clamp-2">
            {fcmStatus}
          </p>
          <span className="inline-block text-[10px] font-mono uppercase text-muted-foreground border border-border px-1.5 py-0.5">
            Socket Connected
          </span>
        </div>
      </div>
    </div>
  );
}
