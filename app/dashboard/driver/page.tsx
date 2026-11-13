'use client'

import { driverAcceptOrder, getDriverAdmin, saveDriverFcmToken } from "@/app/api/driver/action";
import { getFirebaseMessaging } from "@/app/libs/firebase";
import { socket } from "@/app/libs/socket";
import { getToken, onMessage } from "firebase/messaging";
import { useEffect, useState } from "react";

type userDetail = {
  adminId : string,
  driverId : string
}

type ActiveAlert = {
  orderId : string,
  title : string,
  body : string,
}

export default function DriverPage() {
  const [error,setError] = useState<string | null>(null);
  const [userDetails,setUserDetails] = useState<userDetail | null>(null);
  const [fcmStatus,setFcmStatus] = useState<string>("Initializing push notifications...");
  const [activeAlert,setActiveAlert] = useState<ActiveAlert | null>(null);
  const [isAccepting,setIsAccepting] = useState(false);
  const [timeLeft,setTimeLeft] = useState(20);

  async function handleAccepting(){
    if(!activeAlert || isAccepting) return;
    
    try {
      const res = await driverAcceptOrder(activeAlert.orderId);
      if(!res.success){
        setActiveAlert(null);
        alert(res.message);
        return;
      }

      setActiveAlert(null);
      alert(res.message);
    } catch (error) {
      alert('Something went wrong');
    }
    finally {
      setIsAccepting(false);
    }
  }

  useEffect(() => {
    if(!activeAlert) return;
    setTimeLeft(20);
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if(s <= 1){
          clearInterval(t);
          setActiveAlert(null);
          return 0;
        }
        return s-1;
      });
    },1000);
    return () => {
      clearInterval(t)
    };
  },[activeAlert?.orderId]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeForeground: (() => void) | undefined;

    async function initFcm(){
      if(typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
        if(isMounted) setFcmStatus("Web push not supported in this browser");
        return;
      }

      const messaging = await getFirebaseMessaging();
      if(!messaging) {
        if(isMounted) setFcmStatus("Firebase messaging unsupported.");
        return;
      }

      const permission = await Notification.requestPermission();
      if(permission !== "granted") {
        if(isMounted) setFcmStatus(`Notification status : ${permission}`);
          return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if(!vapidKey){
        if(isMounted) setFcmStatus("Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY.");
        return;
      }

      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const registration = await navigator.serviceWorker.ready;

      const currentToken = await getToken(messaging,{
        vapidKey,
        serviceWorkerRegistration : registration,
      })

      if(!currentToken){
        if(isMounted) setFcmStatus("Failed to generate FCM token.");
        return;
      }

      const saveRes = await saveDriverFcmToken(currentToken);
      if(isMounted) {
        setFcmStatus(saveRes.success ? 'Push notification active' : 'Failed to save token');
      }

      unsubscribeForeground = onMessage(messaging,(payload) => {
        console.log(`[FCM foreground alert received]`,payload);
        const orderId = payload.data?.orderId;
        const title = payload.notification?.title || payload.data?.title || "New Order";
        const body = payload.notification?.body || payload.data?.body || "Tap to review details";
        if(orderId){
          setActiveAlert({orderId, title , body });
        }
      })
    }

    initFcm().catch((err) => {
      console.error(`[FCM setup error]`,err);
      if(isMounted) setFcmStatus("FCM initialization error.");
    })

    const getDetails = async () => {
      const res = await getDriverAdmin();
      if(res.success && res.data){
        return setUserDetails(res.data);
      }
      else {
        setError(res.message);
      }
    }
    getDetails();
    return () => {
      isMounted = false;
      if(unsubscribeForeground) unsubscribeForeground();
    }
   },[])

  useEffect(() => {
    if(!userDetails){
      return;
    }

    const onConnect = () => {
      socket.emit("driver-status",{
        driverId : userDetails.driverId,
        adminId : userDetails.adminId ,
        status : true,
      })
    }

    socket.on("connect",onConnect);
    socket.connect();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;
        
        socket.emit("driver-location",{adminId : userDetails.adminId, driverId : userDetails.driverId ,lat,long })
      },
      (err) => console.error("GPS error : ",err),
      { enableHighAccuracy : true }
    )
    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
      socket.off("connect",onConnect);
    }
  },[userDetails]);

  return (
    <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold uppercase">Driver Dashboard</h1>
        <p className="text-xs font-mono text-muted-foreground">Status: {fcmStatus}</p>
        {/* Foreground Alert Card */}
        {activeAlert && (
          <div className="p-4 border border-foreground bg-accent/20 rounded-none space-y-3 max-w-md">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm uppercase">{activeAlert.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{activeAlert.body}</p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAccepting}
                disabled={isAccepting}
                className="flex-1 bg-foreground text-background py-1.5 text-xs font-bold uppercase cursor-pointer"
              >
                {isAccepting ? "Accepting...." : `Accept Order (${timeLeft}s)`}
              </button>
              
              <button
                onClick={async () => setActiveAlert(null)}
                className="flex-1 border border-border py-1.5 text-xs font-bold uppercase cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Decline
              </button>
            </div>
          </div>
        )}        
        <h1 className="text-xl font-bold uppercase tracking-tight">Driver Dashboard</h1>
        <p className="text-sm text-muted-foreground">Deliveries and assigned orders will appear here.</p>
    </div>
  );
}