"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { getDriverAdmin, saveDriverFcmToken } from "@/app/api/driver/action";
import { getFirebaseMessaging } from "@/app/libs/firebase";
import { socket } from "@/app/libs/socket";
import { getToken, onMessage } from "firebase/messaging";

export type UserDetail = {
  adminId: string;
  driverId: string;
};

export type ActiveAlert = {
  orderId: string;
  title: string;
  body: string;
  type?: "SEARCH" | "ASSIGNED";
};

interface DriverContextType {
  userDetails: UserDetail | null;
  location: { lat: number; long: number } | null;
  fcmStatus: string;
  activeAlert: ActiveAlert | null;
  setActiveAlert: (alert: ActiveAlert | null) => void;
  error: string | null;
}

const DriverContext = createContext<DriverContextType | undefined>(undefined);

export function DriverProvider({ children }: { children: ReactNode }) {
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);
  const [location, setLocation] = useState<{ lat: number; long: number } | null>(null);
  const [fcmStatus, setFcmStatus] = useState<string>("Initializing push notifications...");
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep latest state in refs so socket listeners always have fresh values
  const locationRef = useRef(location);
  locationRef.current = location;
  const userDetailsRef = useRef(userDetails);
  userDetailsRef.current = userDetails;

  // 1. Fetch Driver Details and Initialize FCM
  useEffect(() => {
    let isMounted = true;
    let unsubscribeForeground: (() => void) | undefined;

    async function initFcm() {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator)
      ) {
        if (isMounted) setFcmStatus("Web push not supported in this browser");
        return;
      }

      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        if (isMounted) setFcmStatus("Firebase messaging unsupported.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        if (isMounted) setFcmStatus(`Notification status: ${permission}`);
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        if (isMounted) setFcmStatus("Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY.");
        return;
      }

      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const registration = await navigator.serviceWorker.ready;

      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!currentToken) {
        if (isMounted) setFcmStatus("Failed to generate FCM token.");
        return;
      }

      const saveRes = await saveDriverFcmToken(currentToken);
      if (isMounted) {
        setFcmStatus(saveRes.success ? "Push notification active" : "Failed to save token");
      }

      unsubscribeForeground = onMessage(messaging, (payload) => {
        console.log("[FCM foreground alert received]", payload);
        const orderId = payload.data?.orderId;
        const type = payload.data?.type === "ORDER_ASSIGNED_BY_ADMIN" ? "ASSIGNED" : "SEARCH";
        const title = payload.notification?.title || payload.data?.title || "New Order";
        const body = payload.notification?.body || payload.data?.body || "Tap to review details";
        if (orderId) {
          setActiveAlert({ orderId, title, body, type });
        }
      });
    }

    initFcm().catch((err) => {
      console.error("[FCM setup error]", err);
      if (isMounted) setFcmStatus("FCM initialization error.");
    });

    async function getDetails() {
      const res = await getDriverAdmin();
      if (res.success && res.data) {
        if (isMounted) setUserDetails(res.data);
      } else {
        if (isMounted) setError(res.message || "Failed to load admin id or driver id");
      }
    }

    getDetails();

    return () => {
      isMounted = false;
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, []);

  // 2. Global Socket Connection, Status, and Accurate Live Geolocation
  useEffect(() => {
    if (!userDetails) return;

    const onConnect = () => {
      socket.emit("driver-status", {
        driverId: userDetails.driverId,
        adminId: userDetails.adminId,
        status: true,
      });
      socket.emit("join-driver", userDetails.driverId);

      const currentLoc = locationRef.current;
      if (currentLoc) {
        socket.emit("driver-location", {
          adminId: userDetails.adminId,
          driverId: userDetails.driverId,
          lat: currentLoc.lat,
          long: currentLoc.long,
        });
      }
    };

    const onUrgentOrder = (data: { orderId: string; message: string }) => {
      setActiveAlert({
        orderId: data.orderId,
        title: "Order Assigned by Admin",
        body: data.message,
        type: "ASSIGNED",
      });
    };

    const onPingLocation = () => {
      const currentLoc = locationRef.current;
      const currentDetails = userDetailsRef.current;
      if (currentLoc && currentDetails) {
        socket.emit("driver-location", {
          adminId: currentDetails.adminId,
          driverId: currentDetails.driverId,
          lat: currentLoc.lat,
          long: currentLoc.long,
        });
      }
    };

    socket.on("connect", onConnect);
    socket.on("driver-urgent-order", onUrgentOrder);
    socket.on("ping-driver-location", onPingLocation);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    // Immediate Fresh GPS Fix (maximumAge: 0 prevents stale/cached browser positions)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;
        setLocation({ lat, long });

        const currentDetails = userDetailsRef.current;
        if (currentDetails) {
          socket.emit("driver-location", {
            adminId: currentDetails.adminId,
            driverId: currentDetails.driverId,
            lat,
            long,
          });
        }
      },
      (err) => console.error("[Driver fresh GPS error]:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Continuous Watcher (maximumAge: 0 ensures strictly fresh live updates)
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;
        setLocation({ lat, long });

        const currentDetails = userDetailsRef.current;
        if (currentDetails) {
          socket.emit("driver-location", {
            adminId: currentDetails.adminId,
            driverId: currentDetails.driverId,
            lat,
            long,
          });
        }
      },
      (err) => console.error("[Driver GPS error]:", err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("connect", onConnect);
      socket.off("driver-urgent-order", onUrgentOrder);
      socket.off("ping-driver-location", onPingLocation);
      const currentDetails = userDetailsRef.current;
      if (currentDetails) {
        socket.emit("driver-status", {
          driverId: currentDetails.driverId,
          adminId: currentDetails.adminId,
          status: false,
        });
      }
      socket.disconnect();
    };
  }, [userDetails]);

  return (
    <DriverContext.Provider
      value={{
        userDetails,
        location,
        fcmStatus,
        activeAlert,
        setActiveAlert,
        error,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver() {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error("useDriver must be used within a DriverProvider");
  }
  return context;
}
