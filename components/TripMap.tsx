"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { TripLeg } from "@/lib/types/trip";
import { decodePolyline } from "@/lib/polyline";

const WALK_COLOR = "#9ca3af";
const FALLBACK_TRANSIT_COLOR = "#34d399";
const START_COLOR = "#34d399";
const END_COLOR = "#f87171";

export default function TripMap({ legs }: { legs: TripLeg[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || legs.length === 0) return;
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, { attributionControl: false });
      L.control.attribution({ prefix: false }).addTo(map).addAttribution(
        "&copy; OpenStreetMap-bidragsytere"
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const bounds: [number, number][] = [];

      for (const leg of legs) {
        const isWalk = leg.mode === "foot";
        const points: [number, number][] = leg.points
          ? decodePolyline(leg.points)
          : [
              [leg.fromLat, leg.fromLon],
              [leg.toLat, leg.toLon],
            ];
        bounds.push(...points);

        L.polyline(points, {
          color: isWalk ? WALK_COLOR : leg.lineColor ? `#${leg.lineColor}` : FALLBACK_TRANSIT_COLOR,
          weight: isWalk ? 3 : 5,
          opacity: isWalk ? 0.8 : 0.9,
          dashArray: isWalk ? "1 8" : undefined,
          lineCap: "round",
        }).addTo(map);
      }

      const first = legs[0];
      const last = legs[legs.length - 1];
      L.circleMarker([first.fromLat, first.fromLon], {
        radius: 6,
        color: "#fff",
        weight: 2,
        fillColor: START_COLOR,
        fillOpacity: 1,
      }).addTo(map);
      L.circleMarker([last.toLat, last.toLon], {
        radius: 6,
        color: "#fff",
        weight: 2,
        fillColor: END_COLOR,
        fillOpacity: 1,
      }).addTo(map);
      for (let i = 0; i < legs.length - 1; i++) {
        L.circleMarker([legs[i].toLat, legs[i].toLon], {
          radius: 4,
          color: "#fff",
          weight: 2,
          fillColor: "#71717a",
          fillOpacity: 1,
        }).addTo(map);
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [24, 24] });
      }
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [legs]);

  return <div ref={containerRef} className="w-full h-48 rounded-xl overflow-hidden" />;
}
