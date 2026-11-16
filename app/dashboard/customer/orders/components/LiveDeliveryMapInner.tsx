"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { socket } from "@/app/libs/socket";
import { Clock } from "lucide-react";
import { getDistanceInKm } from "@/distance";

// Configure local worker to prevent "[browser] Error: Worker failed to load"
if (typeof window !== "undefined" && typeof (maplibregl as any).setWorkerUrl === "function") {
  (maplibregl as any).setWorkerUrl("/maplibre-gl-worker.mjs");
}

// Optional CARTO API Key support via environment variable
const cartoApiKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();

// If a CARTO API Key is provided, use authenticated CARTO raster tiles with "?key=" parameter.
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

function createStoreMarkerElement(name: string): HTMLElement {
  const container = document.createElement("div");
  container.className = "flex flex-col items-center pointer-events-auto cursor-pointer select-none";
  container.style.zIndex = "10";
  container.innerHTML = `
    <span class="rounded-none border border-neutral-300 bg-white px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold text-neutral-900 mb-1 shadow-xs whitespace-nowrap">${name}</span>
    <div class="h-7 w-7 rounded-none border-2 border-neutral-900 bg-white text-neutral-900 flex items-center justify-center shadow-md">
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
        <path d="M2 7h20"/>
        <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
      </svg>
    </div>
    <div class="w-0.5 h-1.5 bg-neutral-900"></div>
  `;
  return container;
}

function createCustomerMarkerElement(): HTMLElement {
  const container = document.createElement("div");
  container.className = "flex flex-col items-center pointer-events-auto cursor-pointer select-none";
  container.style.zIndex = "15";
  container.innerHTML = `
    <span class="rounded-none border-2 border-neutral-900 bg-white px-2 py-0.5 text-[10px] font-mono uppercase font-extrabold text-neutral-900 mb-1 shadow-xs tracking-wider whitespace-nowrap">YOU</span>
    <div class="h-7 w-7 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-md">
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
        <circle cx="12" cy="10" r="3" fill="white"/>
      </svg>
    </div>
    <div class="w-0.5 h-1.5 bg-neutral-900"></div>
  `;
  return container;
}

function createDriverMarkerElement(): HTMLElement {
  const container = document.createElement("div");
  container.className = "flex flex-col items-center pointer-events-auto cursor-pointer select-none transition-transform duration-700 ease-linear";
  container.style.zIndex = "20";
  container.innerHTML = `
    <div class="flex items-center gap-1 rounded-none border border-emerald-500/60 bg-white px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold text-emerald-600 mb-1 shadow-xs whitespace-nowrap">
      <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
      <span>Driver</span>
    </div>
    <div class="relative">
      <span class="absolute -inset-1 rounded-full bg-emerald-500/40 animate-pulse"></span>
      <div class="relative h-8 w-8 rounded-full border-2 border-neutral-900 bg-neutral-900 text-white flex items-center justify-center shadow-lg">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
      </div>
    </div>
  `;
  return container;
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
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const storeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const customerMarkerRef = useRef<maplibregl.Marker | null>(null);
  const driverMarkerRef = useRef<maplibregl.Marker | null>(null);

  const parsedStoreLat = parseCoordinate(storeLat);
  const parsedStoreLng = parseCoordinate(storeLong);
  const parsedCustLat = parseCoordinate(customerLat);
  const parsedCustLng = parseCoordinate(customerLong);

  const hasStore = isValidCoord(parsedStoreLat, parsedStoreLng);
  const hasCustomer = isValidCoord(parsedCustLat, parsedCustLng);

  // Driver live coordinates state
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  // Real-time distance and estimated time calculation
  const distanceKm =
    driverPos && isValidCoord(driverPos.lat, driverPos.lng) && hasCustomer
      ? getDistanceInKm(driverPos.lat, driverPos.lng, parsedCustLat!, parsedCustLng!)
      : null;

  // When driver reaches within 50m (0.05 km), make distance 0 and ETA 0
  const isArrived = distanceKm !== null && distanceKm <= 0.05;
  const displayDistance = isArrived
    ? "0.00 km"
    : distanceKm !== null
    ? `${distanceKm.toFixed(2)} km`
    : null;

  // Estimated courier delivery time based on average urban speed (25 km/h)
  const etaMinutes = isArrived
    ? 0
    : distanceKm !== null
    ? Math.max(1, Math.round((distanceKm / 25) * 60))
    : null;

  // Auto-fit camera bounds to encompass store, driver, and customer destination
  const fitMapBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      map.resize();
    } catch {}

    const coords: [number, number][] = [];
    if (hasStore) coords.push([parsedStoreLng!, parsedStoreLat!]);
    if (hasCustomer) coords.push([parsedCustLng!, parsedCustLat!]);
    if (driverPos && isValidCoord(driverPos.lat, driverPos.lng)) {
      coords.push([driverPos.lng, driverPos.lat]);
    }

    if (coords.length >= 2) {
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      if (minLng === maxLng && minLat === maxLat) {
        map.flyTo({
          center: [minLng, minLat],
          zoom: 14,
          duration: 800,
        });
        return;
      }

      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          maxZoom: 15,
          duration: 800,
        }
      );
    } else if (coords.length === 1) {
      map.flyTo({
        center: coords[0],
        zoom: 14,
        duration: 800,
      });
    }
  }, [hasStore, hasCustomer, parsedStoreLat, parsedStoreLng, parsedCustLat, parsedCustLng, driverPos]);

  // Initialize Native MapLibre GL map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter = (() => {
      if (hasCustomer) return [parsedCustLng!, parsedCustLat!] as [number, number];
      if (hasStore) return [parsedStoreLng!, parsedStoreLat!] as [number, number];
      return [73.675, 18.735] as [number, number];
    })();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom: 13,
      maxZoom: 18,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    mapRef.current = map;

    map.on("load", () => {
      fitMapBounds();
    });

    return () => {
      storeMarkerRef.current?.remove();
      customerMarkerRef.current?.remove();
      driverMarkerRef.current?.remove();
      storeMarkerRef.current = null;
      customerMarkerRef.current = null;
      driverMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []); // Run once on mount

  // Sync Store Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hasStore) {
      if (!storeMarkerRef.current) {
        const el = createStoreMarkerElement(storeName || "Store");
        storeMarkerRef.current = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([parsedStoreLng!, parsedStoreLat!])
          .addTo(map);
      } else {
        storeMarkerRef.current.setLngLat([parsedStoreLng!, parsedStoreLat!]);
      }
    } else if (storeMarkerRef.current) {
      storeMarkerRef.current.remove();
      storeMarkerRef.current = null;
    }
  }, [hasStore, parsedStoreLat, parsedStoreLng, storeName]);

  // Sync Customer Marker ("YOU")
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hasCustomer) {
      if (!customerMarkerRef.current) {
        const el = createCustomerMarkerElement();
        customerMarkerRef.current = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([parsedCustLng!, parsedCustLat!])
          .addTo(map);
      } else {
        customerMarkerRef.current.setLngLat([parsedCustLng!, parsedCustLat!]);
      }
    } else if (customerMarkerRef.current) {
      customerMarkerRef.current.remove();
      customerMarkerRef.current = null;
    }
  }, [hasCustomer, parsedCustLat, parsedCustLng]);

  // Sync Driver Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (driverPos && isValidCoord(driverPos.lat, driverPos.lng)) {
      if (!driverMarkerRef.current) {
        const el = createDriverMarkerElement();
        driverMarkerRef.current = new maplibregl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([driverPos.lng, driverPos.lat])
          .addTo(map);
      } else {
        driverMarkerRef.current.setLngLat([driverPos.lng, driverPos.lat]);
      }
    } else if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
      driverMarkerRef.current = null;
    }
  }, [driverPos]);

  // Trigger fitMapBounds when coordinates update
  useEffect(() => {
    const timer = setTimeout(() => {
      fitMapBounds();
    }, 200);

    return () => clearTimeout(timer);
  }, [fitMapBounds, parsedStoreLat, parsedStoreLng, parsedCustLat, parsedCustLng, driverPos]);

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

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-none border border-border overflow-hidden bg-neutral-100">
      {/* Top Overlay Badge */}
      <div className="absolute top-2 left-2 z-10 rounded-none border border-border bg-background/95 backdrop-blur-xs px-2.5 py-1 text-[10px] font-mono uppercase font-bold text-foreground flex items-center gap-2 shadow-xs pointer-events-none">
        <span
          className={`h-2 w-2 rounded-full ${
            driverPos
              ? "bg-emerald-500 animate-pulse"
              : driverId
              ? "bg-amber-500 animate-ping"
              : "bg-neutral-500 animate-pulse"
          }`}
        />
        <span>
          {driverPos
            ? "Live Delivery Tracking"
            : driverId
            ? "Connecting to Driver GPS..."
            : "Searching for Driver..."}
        </span>
      </div>

      {/* Pure MapLibre Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Live Distance & ETA HUD Strip */}
      {driverPos && hasCustomer && (
        <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-wrap items-center justify-between gap-2 border border-border bg-background/95 backdrop-blur-xs px-3 py-1.5 text-[11px] font-mono shadow-md pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isArrived ? "bg-emerald-500" : "bg-emerald-500 animate-pulse"
              }`}
            />
            <span className="font-bold uppercase tracking-wider text-foreground">
              {isArrived ? "Driver Arrived at Your Location" : "Driver En Route"}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>Dist:</span>
              <strong className="text-foreground">{displayDistance}</strong>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-foreground" />
              <span>ETA:</span>
              <strong className={isArrived ? "text-emerald-500 font-bold" : "text-foreground font-bold"}>
                {isArrived ? "0 mins" : `${etaMinutes} mins`}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
