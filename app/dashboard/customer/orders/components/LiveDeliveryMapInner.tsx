"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { socket } from "@/app/libs/socket";
import { Store, MapPin, Navigation } from "lucide-react";

// Configure local worker to prevent "[browser] Error: Worker failed to load"
if (typeof window !== "undefined" && typeof (maplibregl as any).setWorkerUrl === "function") {
  (maplibregl as any).setWorkerUrl("/maplibre-gl-worker.mjs");
}

// Optional CARTO API Key support via environment variable
const cartoApiKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();

// If a CARTO API Key is provided, use authenticated CARTO raster tiles with "?key=" parameter.
// Note: CARTO basemaps support zoom levels 0-18. Setting maxzoom: 18 prevents 403 Forbidden errors at zoom 19+.
const MAP_STYLE: any = cartoApiKey
  ? {
      version: 8,
      sources: {
        "carto-positron": {
          type: "raster",
          tiles: [
            `https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${cartoApiKey}`,
            `https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${cartoApiKey}`,
            `https://c.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${cartoApiKey}`,
            `https://d.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${cartoApiKey}`,
          ],
          tileSize: 256,
          maxzoom: 18,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
        },
      },
      layers: [
        {
          id: "carto-positron-layer",
          type: "raster",
          source: "carto-positron",
          minzoom: 0,
          maxzoom: 18,
        },
      ],
    }
  : "https://tiles.openfreemap.org/styles/positron";

function parseCoordinate(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const num = typeof value === "number" ? value : parseFloat(String(value).trim());
  if (isNaN(num)) return null;
  return num;
}

function isValidCoord(lat: number | null, lng: number | null): boolean {
  if (lat == null || lng == null) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

interface LiveDeliveryMapProps {
  driverId?: string | null;
  storeLat?: number | string | null;
  storeLong?: number | string | null;
  storeName?: string | null;
  customerLat?: number | string | null;
  customerLong?: number | string | null;
  customerAddress?: string | null;
}

export default function LiveDeliveryMapInner({
  driverId,
  storeLat,
  storeLong,
  storeName,
  customerLat,
  customerLong,
  customerAddress,
}: LiveDeliveryMapProps) {
  const parsedStoreLat = parseCoordinate(storeLat);
  const parsedStoreLng = parseCoordinate(storeLong);
  const parsedCustLat = parseCoordinate(customerLat);
  const parsedCustLng = parseCoordinate(customerLong);

  const hasStore = isValidCoord(parsedStoreLat, parsedStoreLng);
  const hasCustomer = isValidCoord(parsedCustLat, parsedCustLng);

  // Driver live coordinates - initialized to null so driver is never falsely rendered at store location
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<any>(null);

  // Auto-fit camera bounds to encompass store, driver, and customer destination
  const fitMapBounds = useCallback(() => {
    const map = mapRef.current?.getMap?.() || mapRef.current;
    if (!map) return;

    const coords: [number, number][] = [];
    if (hasStore) coords.push([parsedStoreLng!, parsedStoreLat!]);
    if (hasCustomer) coords.push([parsedCustLng!, parsedCustLat!]);
    if (driverPos && isValidCoord(driverPos.lat, driverPos.lng)) {
      coords.push([driverPos.lng, driverPos.lat]);
    }

    if (coords.length >= 2) {
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15,
        duration: 1000,
      });
    } else if (coords.length === 1) {
      map.flyTo({
        center: coords[0],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [hasStore, hasCustomer, parsedStoreLat, parsedStoreLng, parsedCustLat, parsedCustLng, driverPos]);

  // Connect to Socket room for this driver to receive real-time location updates
  useEffect(() => {
    if (!driverId) return;

    const joinRoom = () => {
      socket.emit("join-driver", driverId);
    };

    if (socket.connected) {
      joinRoom();
    }
    socket.on("connect", joinRoom);
    socket.connect();

    const handleLocationUpdate = (data: { lat: number | string; long: number | string }) => {
      const lat = parseCoordinate(data?.lat);
      const lng = parseCoordinate(data?.long);
      if (isValidCoord(lat, lng)) {
        setDriverPos({ lat: lat!, lng: lng! });
      }
    };

    socket.on("location-update", handleLocationUpdate);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("location-update", handleLocationUpdate);
    };
  }, [driverId]);

  // Initial center calculation
  const initialCenter = (() => {
    if (hasCustomer) return { latitude: parsedCustLat!, longitude: parsedCustLng! };
    if (hasStore) return { latitude: parsedStoreLat!, longitude: parsedStoreLng! };
    return { latitude: 18.735, longitude: 73.675 };
  })();

  return (
    <div className="relative w-full h-64 sm:h-80 rounded-none border border-border overflow-hidden bg-muted/10">
      {/* Top Overlay Badge */}
      <div className="absolute top-2 left-2 z-10 rounded-none border border-border bg-background/95 backdrop-blur-xs px-2.5 py-1 text-[10px] font-mono uppercase font-bold text-foreground flex items-center gap-2 shadow-xs">
        <span
          className={`h-2 w-2 rounded-full ${
            driverPos ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-ping"
          }`}
        />
        <span>{driverPos ? "Live Delivery Tracking" : "Connecting to Driver GPS..."}</span>
      </div>

      <Map
        ref={mapRef}
        mapLib={maplibregl}
        onLoad={fitMapBounds}
        maxZoom={18}
        initialViewState={{
          latitude: initialCenter.latitude,
          longitude: initialCenter.longitude,
          zoom: 13,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* 1. Store Marker */}
        {hasStore && (
          <Marker
            latitude={parsedStoreLat!}
            longitude={parsedStoreLng!}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <span className="rounded-none border border-border bg-background px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold text-foreground mb-1 shadow-xs whitespace-nowrap">
                {storeName || "Store"}
              </span>
              <div className="h-7 w-7 rounded-none border-2 border-foreground bg-background text-foreground flex items-center justify-center shadow-md">
                <Store className="h-4 w-4 text-foreground" />
              </div>
              <div className="w-0.5 h-1.5 bg-foreground" />
            </div>
          </Marker>
        )}

        {/* 2. Customer Destination Marker */}
        {hasCustomer && (
          <Marker
            latitude={parsedCustLat!}
            longitude={parsedCustLng!}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <span className="rounded-none border border-border bg-background px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold text-foreground mb-1 shadow-xs whitespace-nowrap">
                {customerAddress ? `${customerAddress.slice(0, 18)}...` : "Delivery Address"}
              </span>
              <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center shadow-md">
                <MapPin className="h-4 w-4 text-background fill-background" />
              </div>
              <div className="w-0.5 h-1.5 bg-foreground" />
            </div>
          </Marker>
        )}

        {/* 3. Dynamic Live Driver Marker */}
        {driverPos && isValidCoord(driverPos.lat, driverPos.lng) && (
          <Marker
            latitude={driverPos.lat}
            longitude={driverPos.lng}
            anchor="center"
          >
            <div className="flex flex-col items-center transition-all duration-1000 ease-linear">
              <div className="flex items-center gap-1 rounded-none border border-emerald-500/60 bg-background px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold text-emerald-500 mb-1 shadow-xs whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Driver</span>
              </div>
              <div className="relative">
                <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-pulse" />
                <div className="relative h-8 w-8 rounded-full border-2 border-foreground bg-foreground text-background flex items-center justify-center shadow-lg">
                  <Navigation className="h-4 w-4 text-background fill-background" />
                </div>
              </div>
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
}
