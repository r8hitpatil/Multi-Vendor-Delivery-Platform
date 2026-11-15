"use client";

import { useEffect, useState } from "react";
import { 
  getActiveDriverOrders, 
  cancelDriverOrderStatus,
  getDriverAdmin,
  verifyVendorOtp,
  verifyCustomerOtp
} from "@/app/api/driver/action";
import PageLoading from "../loading";
import { socket } from "@/app/libs/socket";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Store, 
  Package, 
  Clock,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  X,
  AlertTriangle,
  Lock
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export default function DriverOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // OTP Verification Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [otpType, setOtpType] = useState<"vendor" | "customer">("vendor");
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

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
    let isMounted = true;

    async function initSocketAndOrders() {
      await loadOrders();

      const details = await getDriverAdmin();
      if (!details.success || !details.data?.driverId || !isMounted) return;

      const driverId = details.data.driverId;

      socket.connect();
      socket.emit("join-driver", driverId);

      socket.on("driver-urgent-order", () => {
        loadOrders();
      });
    }

    initSocketAndOrders();

    return () => {
      isMounted = false;
      socket.off("driver-urgent-order");
    };
  }, []);

  // Cooldown countdown timer effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Open the OTP Modal
  function openOtpModal(item: any, type: "vendor" | "customer") {
    setSelectedOrder(item);
    setOtpType(type);
    setOtpValue("");
    setOtpError(null);
    setOtpSuccess(null);

    // If order already has an active cooldown timestamp, calculate remaining seconds
    if (item.cooldownUntil) {
      const msLeft = new Date(item.cooldownUntil).getTime() - Date.now();
      if (msLeft > 0) {
        setCooldownSeconds(Math.ceil(msLeft / 1000));
        return;
      }
    }
    setCooldownSeconds(0);
  }

  // Close the OTP Modal
  function closeOtpModal() {
    if (isVerifying) return;
    setSelectedOrder(null);
    setOtpValue("");
    setOtpError(null);
    setOtpSuccess(null);
    setCooldownSeconds(0);
  }

  // Submit OTP Verification
  async function handleVerifyOtp() {
    if (!selectedOrder || otpValue.length !== 4 || isVerifying || cooldownSeconds > 0) return;

    try {
      setIsVerifying(true);
      setOtpError(null);
      setOtpSuccess(null);

      const parsedOtp = parseInt(otpValue, 10);
      const res = otpType === "vendor"
        ? await verifyVendorOtp(selectedOrder.id, parsedOtp)
        : await verifyCustomerOtp(selectedOrder.id, parsedOtp);

      if (res.success) {
        setOtpSuccess(res.message);
        setTimeout(async () => {
          closeOtpModal();
          await loadOrders();
        }, 1200);
      } else {
        setOtpError(res.message || "Verification failed");
        setOtpValue(""); // Reset so user can try again easily

        // If locked for 30s, extract seconds or set default 30
        if (res.message?.includes("locked for 30 seconds") || res.message?.includes("3 wrong attempts exceeded")) {
          const match = res.message.match(/(\d+)s/);
          setCooldownSeconds(match ? parseInt(match[1], 10) : 30);
        }
      }
    } catch (err: any) {
      setOtpError(err.message || "An error occurred during verification");
    } finally {
      setIsVerifying(false);
    }
  }

  // Handle cancelling / dropping order (escalates to admin)
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
      <div className="w-full max-w-5xl mx-auto space-y-4">
        <div className="rounded-none border border-destructive/50 bg-destructive/10 p-4 text-xs font-mono uppercase text-destructive">
          Error: {error}
        </div>
        <button
          onClick={() => loadOrders()}
          className="border border-border px-3 py-1.5 text-xs font-mono uppercase hover:border-foreground"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
                Active Deliveries
              </h1>
              <span className="rounded-none text-[10px] sm:text-[11px] font-mono uppercase tracking-wider border border-border px-1.5 py-0.5 text-muted-foreground">
                Driver Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage your ongoing pickups and deliveries.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/driver")}
            className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase border border-border px-3 py-1.5 hover:border-foreground hover:bg-muted/40 transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>
        </div>

        <div className="rounded-none border border-border bg-card p-8 sm:p-12 text-center space-y-3">
          <div className="mx-auto w-10 h-10 border border-border flex items-center justify-center text-muted-foreground">
            <Package className="h-5 w-5" />
          </div>
          <p className="text-xs font-mono uppercase text-muted-foreground">
            No active delivery assignments at the moment.
          </p>
          <p className="text-xs text-muted-foreground/80 max-w-sm mx-auto">
            When new orders are broadcast or manually assigned to you, they will appear here automatically.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push("/dashboard/driver")}
              className="border border-border px-4 py-2 text-xs font-mono uppercase font-bold hover:border-foreground transition-colors cursor-pointer"
            >
              Back to Driver Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
              Active Deliveries
            </h1>
            <span className="rounded-none text-[10px] sm:text-[11px] font-mono uppercase tracking-wider border border-border px-1.5 py-0.5 text-muted-foreground">
              {orders.length} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Pick up orders from stores and deliver to customers.
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/driver")}
          className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase border border-border px-3 py-1.5 hover:border-foreground hover:bg-muted/40 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Delivery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {orders.map((item) => {
          const storeAddr = item.product?.storeProducts?.address;
          const customerAddr = item.order?.customer?.address;
          const isBusy = actionLoadingId === item.id;
          const isOutForDelivery = item.orderStatus === "OUT_OF_DELIVERY";

          return (
            <div
              key={item.id}
              className="rounded-none border border-border bg-card p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-foreground transition-colors shadow-none"
            >
              {/* Header: ID + Status Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-mono uppercase font-bold text-muted-foreground shrink-0">
                    Order
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground truncate">
                    #{item.order?.id ? item.order.id.slice(0, 8) : item.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <span className={`rounded-none text-[10px] font-mono uppercase font-bold tracking-wider border px-2 py-0.5 ${
                    isOutForDelivery
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                      : "border-border bg-muted/40 text-foreground"
                  }`}>
                    {item.orderStatus ? item.orderStatus.replace(/_/g, " ") : "PLACED"}
                  </span>
                  <span className="rounded-none text-[10px] font-mono uppercase font-bold tracking-wider border border-border px-1.5 py-0.5 text-muted-foreground">
                    {item.dispatchStatus ? item.dispatchStatus.replace(/_/g, " ") : "ASSIGNED"}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-1">
                <p className="font-bold text-sm sm:text-base text-foreground uppercase tracking-tight line-clamp-2">
                  {item.product?.name || "Product Item"}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  Qty: <span className="font-semibold text-foreground">{item.quantity}</span> × ${item.price} ={" "}
                  <span className="font-semibold text-foreground">${item.quantity * item.price}</span>
                </p>
              </div>

              {/* Pickup & Dropoff Details */}
              <div className="border-t border-border pt-3 space-y-2.5 text-xs font-mono">
                {/* Store Pickup */}
                <div className={`p-2.5 sm:p-3 border space-y-1 min-w-0 ${
                  !isOutForDelivery ? "border-foreground/30 bg-muted/30" : "border-border/60 bg-muted/10 opacity-70"
                }`}>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground">
                    <Store className="h-3.5 w-3.5 shrink-0 text-foreground" />
                    <span>Pickup From Store</span>
                  </div>
                  <p className="font-bold text-foreground truncate text-xs sm:text-sm">
                    {storeAddr?.storeName || "Vendor Store"}
                  </p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed break-words">
                    {storeAddr?.storeAddress || "Address not provided"}
                  </p>
                </div>

                {/* Customer Dropoff */}
                <div className={`p-2.5 sm:p-3 border space-y-1 min-w-0 ${
                  isOutForDelivery ? "border-foreground/30 bg-muted/30" : "border-border/60 bg-muted/10 opacity-70"
                }`}>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-foreground" />
                    <span>Deliver To Customer</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className="font-bold text-foreground truncate text-xs sm:text-sm">
                      {item.order?.customer?.name || "Customer"}
                    </p>
                    {item.order?.customer?.phone && (
                      <a
                        href={`tel:${item.order.customer.phone}`}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Phone className="h-3 w-3" />
                        {item.order.customer.phone}
                      </a>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed break-words">
                    {customerAddr?.address || "Delivery address not provided"}
                  </p>
                </div>
              </div>

              {/* Action Buttons: OTP Verification + Cancel Order */}
              <div className="border-t border-border pt-3 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleCancelOrder(item.id)}
                  className="w-full sm:w-auto border border-destructive/60 text-destructive hover:bg-destructive hover:text-destructive-foreground px-3 py-2 text-xs font-mono font-bold uppercase transition-colors cursor-pointer disabled:opacity-50 text-center"
                >
                  {isBusy ? "Processing..." : "Cancel Order"}
                </button>

                {isOutForDelivery ? (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => openOtpModal(item, "customer")}
                    className="w-full sm:w-auto bg-foreground text-background hover:opacity-90 px-4 py-2 text-xs font-mono font-bold uppercase transition-colors cursor-pointer disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Verify Customer Delivery</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => openOtpModal(item, "vendor")}
                    className="w-full sm:w-auto bg-foreground text-background hover:opacity-90 px-4 py-2 text-xs font-mono font-bold uppercase transition-colors cursor-pointer disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verify Store Pickup</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive Monospace OTP Verification Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="rounded-none border-2 border-foreground bg-card text-card-foreground p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in-0 zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-none text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 border ${
                    otpType === "vendor"
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-500"
                      : "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                  }`}>
                    {otpType === "vendor" ? "Store Pickup" : "Customer Handover"}
                  </span>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    #{selectedOrder.order?.id ? selectedOrder.order.id.slice(0, 8) : selectedOrder.id.slice(0, 8)}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-foreground mt-1">
                  {otpType === "vendor" ? "Enter Store Pickup Code" : "Enter Delivery Handover Code"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeOtpModal}
                disabled={isVerifying}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Instruction / Context Box */}
            <div className="p-3 border border-border/60 bg-muted/20 space-y-1 text-xs font-mono">
              <p className="font-bold text-foreground uppercase truncate">
                {selectedOrder.product?.name || "Order Item"}
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {otpType === "vendor"
                  ? `Ask store staff at "${selectedOrder.product?.storeProducts?.address?.storeName || 'Vendor Store'}" for the 4-digit code.`
                  : `Ask "${selectedOrder.order?.customer?.name || 'Customer'}" for the 4-digit delivery handover code.`}
              </p>
            </div>

            {/* Active Cooldown Banner */}
            {cooldownSeconds > 0 && (
              <div className="rounded-none border border-destructive bg-destructive/10 p-3 text-xs font-mono uppercase text-destructive flex items-center gap-2.5">
                <Lock className="h-4 w-4 shrink-0 text-destructive animate-pulse" />
                <div className="flex-1">
                  <p className="font-bold">Cooldown Lock Active</p>
                  <p className="text-[11px] text-destructive/80 normal-case">
                    3 incorrect attempts reached. Please wait <strong>{cooldownSeconds}s</strong> before trying again.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {otpError && cooldownSeconds === 0 && (
              <div className="rounded-none border border-destructive/60 bg-destructive/10 p-3 text-xs font-mono uppercase text-destructive flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{otpError}</span>
              </div>
            )}

            {/* Success Message */}
            {otpSuccess && (
              <div className="rounded-none border border-emerald-500/60 bg-emerald-500/10 p-3 text-xs font-mono uppercase text-emerald-500 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-bold leading-tight">{otpSuccess}</span>
              </div>
            )}

            {/* OTP Input - Centered & Mobile Responsive */}
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <label className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                4-Digit Security Code
              </label>
              <InputOTP
                maxLength={4}
                value={otpValue}
                onChange={(val) => setOtpValue(val)}
                disabled={isVerifying || cooldownSeconds > 0 || Boolean(otpSuccess)}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                autoFocus
              >
                <InputOTPGroup className="gap-2 sm:gap-3">
                  <InputOTPSlot index={0} className="size-12 sm:size-14 text-xl sm:text-2xl font-mono font-bold rounded-none border border-border" />
                  <InputOTPSlot index={1} className="size-12 sm:size-14 text-xl sm:text-2xl font-mono font-bold rounded-none border border-border" />
                  <InputOTPSlot index={2} className="size-12 sm:size-14 text-xl sm:text-2xl font-mono font-bold rounded-none border border-border" />
                  <InputOTPSlot index={3} className="size-12 sm:size-14 text-xl sm:text-2xl font-mono font-bold rounded-none border border-border" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-border pt-4 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpValue.length !== 4 || isVerifying || cooldownSeconds > 0 || Boolean(otpSuccess)}
                className="flex-1 bg-foreground text-background py-2.5 sm:py-2 text-xs font-mono font-bold uppercase transition-opacity cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                {isVerifying ? (
                  <>
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : cooldownSeconds > 0 ? (
                  <span>Locked ({cooldownSeconds}s)</span>
                ) : (
                  <>
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Confirm & Verify</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={closeOtpModal}
                disabled={isVerifying}
                className="border border-border px-4 py-2.5 sm:py-2 text-xs font-mono font-bold uppercase cursor-pointer text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
