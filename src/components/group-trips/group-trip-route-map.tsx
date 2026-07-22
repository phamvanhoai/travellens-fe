"use client";

import { useEffect, useMemo, useState } from "react";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { LayersControl, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { VietnamIslandsOverlay } from "@/components/maps/vietnam-islands-overlay";
import type { GroupTrip, GroupTripItineraryItem } from "@/services/group-trip.service";
import { locationService } from "@/services/location.service";

type RoutePoint = { id: number; title: string; place: string; date: string; time: string; latitude: number; longitude: number };
type StreetRoute = { path: LatLngExpression[]; distanceKm: number; durationMinutes: number };
const defaultCenter: LatLngExpression = [16.0471, 108.2068];

export default function GroupTripRouteMap({ trip }: { trip: GroupTrip }) {
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [streetRoute, setStreetRoute] = useState<StreetRoute | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [routingError, setRoutingError] = useState("");

  useEffect(() => {
    let active = true;
    async function resolvePoints() {
      setLoading(true);
      const items = [...(trip.itinerary ?? [])].sort(compareItems);
      const resolved = await Promise.all(items.map(async (item) => {
        const customLatitude = Number(item.latitude);
        const customLongitude = Number(item.longitude);
        if (Number.isFinite(customLatitude) && Number.isFinite(customLongitude) && item.latitude != null && item.longitude != null) {
          return toPoint(item, customLatitude, customLongitude, item.custom_location ?? "Custom place");
        }
        if (!item.location_id) return null;
        try {
          const location = await locationService.detail(String(item.location_id));
          const latitude = Number(location.latitude);
          const longitude = Number(location.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
          return toPoint(item, latitude, longitude, location.name ?? location.title ?? `Location #${item.location_id}`);
        } catch {
          return null;
        }
      }));
      if (active) {
        setPoints(resolved.filter((point): point is RoutePoint => Boolean(point)));
        setLoading(false);
      }
    }
    void resolvePoints();
    return () => { active = false; };
  }, [trip.itinerary]);

  const positions = useMemo<LatLngExpression[]>(
    () => points.map((point) => [point.latitude, point.longitude]),
    [points]
  );

  useEffect(() => {
    let active = true;
    async function resolveStreetRoute() {
      setStreetRoute(null);
      setRoutingError("");
      if (positions.length < 2) return;
      setRoutingLoading(true);
      try {
        const route = await getStreetRoute(positions);
        if (!active) return;
        setStreetRoute(route);
        if (!route) setRoutingError("Driving directions are unavailable for these stops.");
      } catch {
        if (active) setRoutingError("Driving directions are temporarily unavailable.");
      } finally {
        if (active) setRoutingLoading(false);
      }
    }
    void resolveStreetRoute();
    return () => { active = false; };
  }, [positions]);

  if (loading) return <div className="grid h-[420px] place-items-center bg-slate-50 text-sm font-semibold text-slate-500">Resolving itinerary locations...</div>;
  if (!points.length) return <div className="grid h-64 place-items-center bg-slate-50 p-6 text-center text-sm text-slate-500">No itinerary stops with valid coordinates are available yet.</div>;

  const routePath = streetRoute?.path ?? [];
  return (
    <div className="relative">
      <MapContainer center={positions[0] ?? defaultCenter} zoom={11} scrollWheelZoom className="h-[420px] w-full">
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer attribution="Tiles &copy; Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>
        </LayersControl>
        <FitRoute positions={routePath.length ? routePath : positions} />
        {routePath.length > 1 ? <Polyline positions={routePath} pathOptions={{ color: "#0b55e8", weight: 5, opacity: 0.88, lineCap: "round", lineJoin: "round" }} /> : null}
        {points.map((point, index) => (
          <Marker key={point.id} position={[point.latitude, point.longitude]} icon={numberedIcon(index + 1)}>
            <Popup><div className="grid min-w-44 gap-1"><strong className="text-brand-700">Stop {index + 1}: {point.title}</strong><span>{point.place}</span><small>{point.date}{point.time ? ` • ${point.time}` : ""}</small></div></Popup>
          </Marker>
        ))}
        <VietnamIslandsOverlay />
      </MapContainer>
      {routingLoading ? <div className="pointer-events-none absolute left-3 top-3 z-[500] inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow"><LoaderCircle className="size-4 animate-spin text-brand-600" />Calculating driving route...</div> : null}
      {streetRoute ? <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg bg-slate-950/85 px-3 py-2 text-xs font-semibold text-white shadow backdrop-blur"><span>{streetRoute.distanceKm.toFixed(1)} km</span><span className="mx-2 text-white/40">•</span><span>{formatDuration(streetRoute.durationMinutes)}</span></div> : null}
      {routingError ? <div className="absolute bottom-3 left-3 right-3 z-[500] flex items-center gap-2 rounded-lg bg-amber-50/95 px-3 py-2 text-xs font-semibold text-amber-800 shadow"><AlertTriangle className="size-4 shrink-0" />{routingError}</div> : null}
    </div>
  );
}

async function getStreetRoute(positions: LatLngExpression[]): Promise<StreetRoute | null> {
  const coordinates = positions.map((position) => {
    const point = L.latLng(position);
    return `${point.lng},${point.lat}`;
  }).join(";");
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`);
  if (!response.ok) return null;
  const payload = await response.json() as { routes?: Array<{ distance?: number; duration?: number; geometry?: { coordinates?: Array<[number, number]> } }> };
  const route = payload.routes?.[0];
  const coordinatesPath = route?.geometry?.coordinates;
  if (!route || !coordinatesPath?.length) return null;
  return {
    path: coordinatesPath.map(([longitude, latitude]) => [latitude, longitude] as LatLngExpression),
    distanceKm: Number(route.distance ?? 0) / 1000,
    durationMinutes: Number(route.duration ?? 0) / 60
  };
}

function FitRoute({ positions }: { positions: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) map.setView(positions[0], 13);
    else if (positions.length > 1) map.fitBounds(positions as LatLngBoundsExpression, { padding: [36, 36], maxZoom: 14, animate: false });
  }, [map, positions]);
  return null;
}

function numberedIcon(number: number) { return L.divIcon({ className: "group-trip-route-marker", html: `<div><span>${number}</span></div>`, iconSize: [32, 38], iconAnchor: [16, 38], popupAnchor: [0, -36] }); }
function toPoint(item: GroupTripItineraryItem, latitude: number, longitude: number, place: string): RoutePoint { return { id: item.itinerary_item_id, title: item.title, place, date: normalizeDate(item.itinerary_date), time: normalizeTime(item.start_time), latitude, longitude }; }
function compareItems(a: GroupTripItineraryItem, b: GroupTripItineraryItem) { return normalizeDate(a.itinerary_date).localeCompare(normalizeDate(b.itinerary_date)) || Number(a.order_index ?? 1) - Number(b.order_index ?? 1) || normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time)); }
function normalizeDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)); }
function normalizeTime(value?: string | null) { if (!value) return ""; if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5); return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)); }
function formatDuration(minutes: number) { const rounded = Math.max(1, Math.round(minutes)); const hours = Math.floor(rounded / 60); const remainder = rounded % 60; return hours ? `${hours} hr${remainder ? ` ${remainder} min` : ""}` : `${remainder} min`; }
