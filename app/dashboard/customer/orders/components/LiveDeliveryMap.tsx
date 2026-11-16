"use client";

import dynamic from "next/dynamic";

interface LiveDeliveryMapProps {
  driverId?: string | null;
  storeLat?: number | string | null;
  storeLong?: number | string | null;
  storeName?: string | null;
  customerLat?: number | string | null;
  customerLong?: number | string | null;
  customerAddress?: string | null;
}

const LiveDeliveryMapInner = dynamic(
  () => import("./LiveDeliveryMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 sm:h-80 rounded-none border border-border bg-muted/20 flex flex-col items-center justify-center space-y-2">
        <span className="h-3 w-3 rounded-full bg-foreground animate-ping" />
        <span className="text-xs font-mono uppercase text-muted-foreground font-semibold">
          Loading Live Map...
        </span>
      </div>
    ),
  }
);

export default function LiveDeliveryMap(props: LiveDeliveryMapProps) {
  return <LiveDeliveryMapInner {...props} />;
}
