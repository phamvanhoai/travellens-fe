"use client";

import { useEffect, useMemo } from "react";
import L, { type LatLngExpression } from "leaflet";
import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { VietnamIslandsOverlay } from "@/components/maps/vietnam-islands-overlay";

type InteractiveMapProps = {
  position: LatLngExpression;
  onChange: (latitude: number, longitude: number) => void;
  places?: Array<{ id: number; name: string; address?: string; latitude: number; longitude: number }>;
  onPlaceSelect?: (place: { id: number; name: string; address?: string; latitude: number; longitude: number }) => void;
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

const selectedPositionIcon = L.divIcon({
  className: "custom-selected-map-marker",
  html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#f97316;border:3px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,.4);transform:rotate(-45deg)"><div style="width:8px;height:8px;border-radius:50%;background:#fff;margin:7px"></div></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
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

export default function InteractiveMap({ position, onChange, places = [], onPlaceSelect }: InteractiveMapProps) {
  const markerPosition = useMemo(() => L.latLng(position), [position]);

  return (
    <MapContainer center={position} zoom={13} scrollWheelZoom className="h-80 w-full">
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
      <MapController position={position} onChange={onChange} />
      <VietnamIslandsOverlay />
      <Marker
        draggable
        icon={selectedPositionIcon}
        position={markerPosition}
        eventHandlers={{
          dragend(event) {
            const nextPosition = event.target.getLatLng();
            onChange(nextPosition.lat, nextPosition.lng);
          }
        }}
      />
      {places.map((place) => (
        <Marker
          key={place.id}
          icon={markerIcon}
          position={[place.latitude, place.longitude]}
          eventHandlers={{ click: () => onPlaceSelect?.(place) }}
        >
          <Popup><strong>{place.name}</strong>{place.address ? <><br />{place.address}</> : null}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
