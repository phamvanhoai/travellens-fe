"use client";

import { useEffect, useMemo, useState } from "react";
import L, { type LatLngExpression } from "leaflet";
import { LayersControl, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { AlertCircle, Clock3, MapPinned, Navigation, RefreshCw, Route } from "lucide-react";
import { navigationService, type TourNavigationRoute } from "@/services/navigation.service";

const defaultCenter: LatLngExpression = [10.7769, 106.7009];

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function RouteBounds({ route }: { route: TourNavigationRoute | null }) {
  const map = useMap();

  useEffect(() => {
    if (!route || route.points.length === 0) return;

    const bounds = L.latLngBounds(route.points.map((point) => [point.latitude, point.longitude]));
    map.fitBounds(bounds.pad(0.2), { animate: true, maxZoom: 15 });
  }, [map, route]);

  return null;
}

export function CustomerRouteNavigation({ tourId }: { tourId: string }) {
  const [route, setRoute] = useState<TourNavigationRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const path = useMemo(() => route?.points.map((point) => [point.latitude, point.longitude] as LatLngExpression) ?? [], [route]);

  async function loadRoute() {
    setLoading(true);
    setError("");

    try {
      setRoute(await navigationService.getTourRoute(tourId));
    } catch (err) {
      setRoute(null);
      setError("Cannot load route navigation from API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoute();
  }, [tourId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div>
            <h2 className="flex items-center gap-2 font-bold"><Navigation className="size-5 text-brand-600" /> Customer Route Navigation</h2>
            <p className="mt-1 text-sm text-slate-500">{route?.title ?? `Tour #${tourId}`}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadRoute()}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-brand-500 hover:text-brand-600 disabled:opacity-60"
          >
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </button>
        </div>

        <div className="relative">
          <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom className="h-[420px] w-full">
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Street">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
            </LayersControl>
            <RouteBounds route={route} />
            {path.length > 1 ? <Polyline positions={path} pathOptions={{ color: "#0b55e8", weight: 5, opacity: 0.85 }} /> : null}
            {route?.stops.map((stop) => (
              <Marker key={stop.id} icon={markerIcon} position={[stop.latitude, stop.longitude]}>
                <Popup>
                  <div className="w-56">
                    <p className="font-bold">{stop.order}. {stop.name}</p>
                    {stop.description ? <p className="mt-2 text-sm text-slate-600">{stop.description}</p> : null}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {loading ? (
            <div className="absolute inset-0 z-[500] grid place-items-center bg-white/70 text-sm font-bold text-slate-600 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2"><RefreshCw className="size-4 animate-spin" /> Loading route...</span>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="m-4 flex gap-3 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-brand-50 p-3 text-brand-700">
            <Route className="size-5" />
            <p className="mt-2 text-xs font-semibold uppercase">Stops</p>
            <p className="text-xl font-bold">{route?.stops.length ?? 0}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-slate-700">
            <Clock3 className="size-5" />
            <p className="mt-2 text-xs font-semibold uppercase">Duration</p>
            <p className="text-xl font-bold">{route?.durationMinutes ? `${Math.round(route.durationMinutes)}m` : "-"}</p>
          </div>
        </div>

        <h3 className="mt-5 font-bold">Itinerary</h3>
        <div className="mt-4 max-h-[390px] space-y-4 overflow-auto pr-1">
          {route?.stops.map((stop) => (
            <div key={stop.id} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{stop.order}</span>
              <div className="min-w-0">
                <p className="font-semibold">{stop.name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{stop.description ?? "Route stop from API navigation data."}</p>
                <p className="mt-1 text-xs text-slate-400">{stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}</p>
              </div>
            </div>
          ))}
          {!loading && !error && route?.stops.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              <MapPinned className="mb-2 size-5 text-brand-600" />
              No itinerary stops returned for this tour.
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
