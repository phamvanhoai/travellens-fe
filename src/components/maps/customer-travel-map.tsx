"use client";

import { useEffect, useMemo, useState } from "react";
import L, { type LatLngExpression } from "leaflet";
import { Circle, LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { LocateFixed, MapPin, RefreshCw, Search, Star, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { destinationService, type PublicDestinationCategory } from "@/services/destination.service";
import { mapService, type TravelMapFilterParams, type TravelMapMarker } from "@/services/map.service";

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

function MapBounds({ markers, userPosition }: { markers: TravelMapMarker[]; userPosition: LatLngExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((marker) => [marker.latitude, marker.longitude]));
      if (userPosition) bounds.extend(userPosition);
      map.fitBounds(bounds.pad(0.2), { animate: true, maxZoom: 15 });
      return;
    }

    if (userPosition) {
      map.setView(userPosition, 13, { animate: true });
    }
  }, [map, markers, userPosition]);

  return null;
}

export default function CustomerTravelMap() {
  const [markers, setMarkers] = useState<TravelMapMarker[]>([]);
  const [categories, setCategories] = useState<PublicDestinationCategory[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [destinationCategoryId, setDestinationCategoryId] = useState("");
  const [hasView360, setHasView360] = useState("");
  const [minRating, setMinRating] = useState("");
  const [popularOnly, setPopularOnly] = useState(false);
  const [radius, setRadius] = useState("5");
  const [userPosition, setUserPosition] = useState<LatLngExpression | null>(null);
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const visibleMarkers = useMemo(() => {
    const normalizedKeyword = keyword.toLowerCase();
    if (!normalizedKeyword) return markers;
    return markers.filter((marker) => `${marker.name} ${marker.description ?? ""} ${marker.category ?? ""}`.toLowerCase().includes(normalizedKeyword));
  }, [keyword, markers]);

  async function loadMapData(overrides: Partial<TravelMapFilterParams> = {}) {
    setLoading(true);
    setError("");

    try {
      const [lat, lng] = Array.isArray(userPosition) ? userPosition : [];
      const params: TravelMapFilterParams = {
        destination_category_id: destinationCategoryId ? Number(destinationCategoryId) : undefined,
        has_view360: hasView360 === "" ? undefined : hasView360 === "true",
        min_rating: minRating ? Number(minRating) : undefined,
        popular_only: popularOnly || undefined,
        lat: typeof lat === "number" ? lat : undefined,
        lng: typeof lng === "number" ? lng : undefined,
        radius: typeof lat === "number" && typeof lng === "number" ? Number(radius) || 5 : undefined,
        nearby_only: typeof lat === "number" && typeof lng === "number" ? true : undefined,
        ...overrides
      };

      setMarkers(await mapService.filter(params));
    } catch (err) {
      setError("Cannot filter map markers from API.");
    } finally {
      setLoading(false);
    }
  }

  async function loadNearbySuggestions(lat: number, lng: number, nextRadius = Number(radius) || 5) {
    setLoading(true);
    setError("");
    setNearbyRadiusKm(nextRadius);

    try {
      setMarkers(await mapService.nearby({ lat, lng, radius: nextRadius }));
    } catch (err) {
      setError("Cannot load nearby place suggestions from API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    destinationService.categories()
      .then(setCategories)
      .catch(() => setCategories([]));
    void loadMapData();
  }, []);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setKeyword(keywordInput.trim());
    void loadMapData();
  }

  function getCategoryId(category: PublicDestinationCategory) {
    return category.destination_category_id ?? category.id ?? 0;
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPosition: LatLngExpression = [position.coords.latitude, position.coords.longitude];
        const nextRadius = Number(radius) || 5;
        setUserPosition(nextPosition);
        setLocating(false);
        void loadNearbySuggestions(position.coords.latitude, position.coords.longitude, nextRadius);
      },
      () => {
        setLocating(false);
        setError("Cannot access your current location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Interactive Travel Map</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Explore destinations and locations from Travel360 API.</p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSearch}>
          <label className="block text-sm font-semibold">
            Search
            <span className="relative mt-2 block">
              <Search className="absolute left-3 top-3 size-5 text-slate-400" />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-brand-600"
                placeholder="Destination or location..."
              />
            </span>
          </label>

          <label className="block text-sm font-semibold">
            Category
            <select
              value={destinationCategoryId}
              onChange={(event) => {
                setDestinationCategoryId(event.target.value);
                void loadMapData({ destination_category_id: event.target.value ? Number(event.target.value) : undefined });
              }}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"
            >
              <option value="">All categories</option>
              {categories.map((item) => <option key={getCategoryId(item)} value={getCategoryId(item)}>{item.name}</option>)}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            View360
            <select
              value={hasView360}
              onChange={(event) => {
                setHasView360(event.target.value);
                void loadMapData({ has_view360: event.target.value === "" ? undefined : event.target.value === "true" });
              }}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"
            >
              <option value="">Any</option>
              <option value="true">Has 360</option>
              <option value="false">No 360</option>
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Minimum rating
            <select
              value={minRating}
              onChange={(event) => {
                setMinRating(event.target.value);
                void loadMapData({ min_rating: event.target.value ? Number(event.target.value) : undefined });
              }}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"
            >
              <option value="">Any rating</option>
              {["3", "4", "4.5", "5"].map((item) => <option key={item} value={item}>{item}+ stars</option>)}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={popularOnly}
              onChange={(event) => {
                setPopularOnly(event.target.checked);
                void loadMapData({ popular_only: event.target.checked || undefined });
              }}
              className="size-4 rounded border-slate-300 text-brand-600"
            />
            Popular only
          </label>

          <label className="block text-sm font-semibold">
            Nearby radius
            <select
              value={radius}
              onChange={(event) => setRadius(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"
            >
              {["2", "5", "10", "25", "50"].map((item) => <option key={item} value={item}>{item} km</option>)}
            </select>
          </label>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <RefreshCw className="size-4 animate-spin" /> : <Search size={16} />}
              Search Map
            </Button>
            <Button type="button" variant="outline" onClick={useCurrentLocation} disabled={locating || loading} className="w-full">
              {locating ? <RefreshCw className="size-4 animate-spin" /> : <LocateFixed size={16} />}
              Nearby Suggestions
            </Button>
          </div>
        </form>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div> : null}

        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="text-sm font-bold">{loading ? "Loading..." : `${visibleMarkers.length} places found`}</p>
          <div className="mt-3 max-h-[360px] space-y-3 overflow-auto pr-1">
            {visibleMarkers.map((marker) => (
              <a key={marker.id} href={marker.type === "location" ? `/locations/${marker.sourceId}` : `/destinations/${marker.sourceId}`} className="block rounded-lg border border-slate-200 p-3 hover:border-brand-500">
                <span className="flex items-start gap-3">
                  {marker.imageUrl ? <img src={marker.imageUrl} alt="" className="size-12 rounded-md object-cover" /> : <span className="grid size-12 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600"><MapPin size={18} /></span>}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{marker.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">{marker.category ?? marker.type}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      {marker.rating ? <span className="inline-flex items-center gap-1"><Star className="size-3 fill-amber-400 text-amber-400" /> {marker.rating}</span> : null}
                      {marker.hasView360 ? <span className="inline-flex items-center gap-1 text-brand-600"><Video className="size-3" /> 360</span> : null}
                      {marker.distanceKm !== undefined ? <span>{marker.distanceKm.toFixed(1)} km</span> : null}
                    </span>
                  </span>
                </span>
              </a>
            ))}
            {!loading && visibleMarkers.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No map markers found.</p> : null}
          </div>
        </div>
      </aside>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom className="h-[720px] min-h-[520px] w-full">
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
          <MapBounds markers={visibleMarkers} userPosition={userPosition} />
          {userPosition && nearbyRadiusKm ? (
            <Circle
              center={userPosition}
              radius={nearbyRadiusKm * 1000}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#3b82f6",
                fillOpacity: 0.12,
                opacity: 0.75,
                weight: 2
              }}
            />
          ) : null}
          {visibleMarkers.map((marker) => (
            <Marker key={marker.id} icon={markerIcon} position={[marker.latitude, marker.longitude]}>
              <Popup>
                <div className="w-56">
                  {marker.imageUrl ? <img src={marker.imageUrl} alt="" className="mb-2 h-24 w-full rounded object-cover" /> : null}
                  <p className="font-bold">{marker.name}</p>
                  {marker.category ? <p className="text-xs text-slate-500">{marker.category}</p> : null}
                  {marker.description ? <p className="mt-2 text-sm text-slate-600">{marker.description}</p> : null}
                  <a className="mt-3 inline-block text-sm font-bold text-brand-600" href={marker.type === "location" ? `/locations/${marker.sourceId}` : `/destinations/${marker.sourceId}`}>View detail</a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
