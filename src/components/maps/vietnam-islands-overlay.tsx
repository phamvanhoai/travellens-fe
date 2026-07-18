"use client";

import { useEffect, useState } from "react";
import type { GeoJsonObject, Feature } from "geojson";
import type { Layer } from "leaflet";
import { GeoJSON } from "react-leaflet";

export function VietnamIslandsOverlay() {
  const [data, setData] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    fetch("/data/hoang-sa-truong-sa.geojson")
      .then((response) => response.ok ? response.json() as Promise<GeoJsonObject> : Promise.reject())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  return <>
    <GeoJSON
      data={data}
      interactive={false}
      style={{ color: "#ffffff", weight: 7, opacity: 0.78, fillOpacity: 0 }}
    />
    <GeoJSON
      data={data}
      style={{ color: "#dc2626", weight: 3, opacity: 1, fillColor: "#fb923c", fillOpacity: 0.26, dashArray: "7 5", lineCap: "round", lineJoin: "round" }}
      onEachFeature={(feature: Feature, layer: Layer) => {
        const label = String(feature.properties?.label ?? feature.properties?.name ?? "");
        if (!label || !("bindTooltip" in layer)) return;
        const styledLayer = layer as Layer & { setStyle: (style: { fillOpacity: number; weight: number }) => void };
        layer.bindTooltip(`<span class="vietnam-islands-flag">★</span><span>${label}</span>`, { permanent: true, direction: "center", className: "vietnam-islands-label" });
        layer.bindPopup(`<div class="vietnam-islands-popup"><strong>${label}</strong><small>Lớp phủ dữ liệu địa lý Việt Nam</small></div>`);
        layer.on("mouseover", () => styledLayer.setStyle({ fillOpacity: 0.42, weight: 4 }));
        layer.on("mouseout", () => styledLayer.setStyle({ fillOpacity: 0.26, weight: 3 }));
      }}
    />
  </>;
}
