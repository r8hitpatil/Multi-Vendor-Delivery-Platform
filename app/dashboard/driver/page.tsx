'use client'

import { socket } from "@/app/libs/socket";
import { useEffect } from "react";

export default function DriverPage() {
  const orderId = 'test-1';

  useEffect(() => {
    socket.connect();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;

        socket.emit("driver-location",{ orderId,lat,long });
      },
      (err) => console.error("GPS error : ",err),
      { enableHighAccuracy : true }
    )
    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    }
  },[])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold uppercase tracking-tight">Driver Dashboard</h1>
      <p className="text-sm text-muted-foreground">Deliveries and assigned orders will appear here.</p>
    </div>
  );
}