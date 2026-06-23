"use client";

import { useEffect, useMemo } from "react";
import L, { type LatLngExpression } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

type InteractiveMapProps = {
  position: LatLngExpression;
  onChange: (latitude: number, longitude: number) => void;
};

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapController({ position, onChange }: InteractiveMapProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [map, position]);

  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    }
  });

  return null;
}

export default function InteractiveMap({ position, onChange }: InteractiveMapProps) {
  const markerPosition = useMemo(() => L.latLng(position), [position]);

  return (
    <MapContainer center={position} zoom={13} scrollWheelZoom className="h-80 w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController position={position} onChange={onChange} />
      <Marker
        draggable
        icon={markerIcon}
        position={markerPosition}
        eventHandlers={{
          dragend(event) {
            const nextPosition = event.target.getLatLng();
            onChange(nextPosition.lat, nextPosition.lng);
          }
        }}
      />
    </MapContainer>
  );
}
