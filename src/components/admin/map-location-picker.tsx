"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Crosshair, LoaderCircle } from "lucide-react";
import type { LatLngExpression } from "leaflet";
import { Button } from "@/components/ui/button";

const InteractiveMap = dynamic(() => import("./map-location-picker-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-80 place-items-center bg-slate-50 text-sm font-semibold text-slate-500">
      <LoaderCircle className="animate-spin" size={20} />
    </div>
  )
});

const DEFAULT_POSITION: LatLngExpression = [10.7769, 106.7009];

type MapLocationPickerProps = {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
};

export function MapLocationPicker({ latitude, longitude, onChange }: MapLocationPickerProps) {
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);

  const position = useMemo<LatLngExpression>(() => {
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (
      Number.isFinite(parsedLatitude)
      && Number.isFinite(parsedLongitude)
      && parsedLatitude >= -90
      && parsedLatitude <= 90
      && parsedLongitude >= -180
      && parsedLongitude <= 180
    ) {
      return [parsedLatitude, parsedLongitude];
    }

    return DEFAULT_POSITION;
  }, [latitude, longitude]);

  useEffect(() => {
    setLocationError("");
  }, [latitude, longitude]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("Your browser does not support location access.");
      return;
    }

    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange(coords.latitude.toFixed(6), coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocationError("Cannot access your current location. Check browser permission.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Location on Map</p>
          <p className="mt-0.5 text-xs font-normal text-slate-500">Click the map or drag the marker to choose the exact position.</p>
        </div>
        <Button type="button" variant="outline" className="h-9 px-3" onClick={useCurrentLocation} disabled={locating}>
          {locating ? <LoaderCircle className="animate-spin" size={16} /> : <Crosshair size={16} />}
          Current Location
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <InteractiveMap
          position={position}
          onChange={(nextLatitude, nextLongitude) => onChange(nextLatitude.toFixed(6), nextLongitude.toFixed(6))}
        />
      </div>

      {locationError ? <p className="mt-2 text-xs font-semibold text-rose-600">{locationError}</p> : null}
    </div>
  );
}
