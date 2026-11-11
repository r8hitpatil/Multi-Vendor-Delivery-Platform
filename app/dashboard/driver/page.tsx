'use client'

import { getDriverAdmin } from "@/app/api/driver/action";
import { socket } from "@/app/libs/socket";
import { useEffect, useState } from "react";

type userDetail = {
  adminId : string,
  driverId : string
}

export default function DriverPage() {
  const [error,setError] = useState<string | null>(null);
  const [userDetails,setUserDetails] = useState<userDetail | null>(null);

  useEffect(() => {
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
      <h1 className="text-xl font-bold uppercase tracking-tight">Driver Dashboard</h1>
      <p className="text-sm text-muted-foreground">Deliveries and assigned orders will appear here.</p>
    </div>
  );
}