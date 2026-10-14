import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { CityBikeStation, VehicleTypeCount } from "@/lib/types/citybike";

const BASE = "https://gbfs.urbansharing.com/oslobysykkel.no";

const VEHICLE_TYPE_NAMES: Record<string, string> = {
  bike: "vanlig sykkel",
  ebike: "elsykkel",
};

interface StationInformation {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
}

interface StationStatus {
  station_id: string;
  is_installed: boolean;
  is_renting: boolean;
  num_bikes_available: number;
  num_docks_available: number;
  vehicle_types_available?: { vehicle_type_id: string; count: number }[];
}

interface VehicleType {
  vehicle_type_id: string;
  name?: string;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchNearestStations(
  lat: number,
  lon: number,
  limit: number
): Promise<CityBikeStation[]> {
  const [infoRes, statusRes, typesRes] = await Promise.all([
    fetchWithTimeout(`${BASE}/station_information.json`, { cache: "no-store" }),
    fetchWithTimeout(`${BASE}/station_status.json`, { cache: "no-store" }),
    fetchWithTimeout(`${BASE}/vehicle_types.json`, { cache: "no-store" }),
  ]);
  if (!infoRes.ok || !statusRes.ok) return [];

  const infoJson = await infoRes.json();
  const statusJson = await statusRes.json();
  const typesJson = typesRes.ok ? await typesRes.json() : null;

  const typeNameById = new Map<string, string>();
  const vehicleTypes: VehicleType[] = typesJson?.data?.vehicle_types ?? [];
  for (const vt of vehicleTypes) {
    typeNameById.set(
      vt.vehicle_type_id,
      VEHICLE_TYPE_NAMES[vt.vehicle_type_id] ?? vt.name ?? vt.vehicle_type_id
    );
  }

  const statusById = new Map<string, StationStatus>();
  for (const s of (statusJson.data.stations as StationStatus[]) ?? []) {
    statusById.set(s.station_id, s);
  }

  const stations: CityBikeStation[] = [];
  for (const info of (infoJson.data.stations as StationInformation[]) ?? []) {
    const status = statusById.get(info.station_id);
    if (!status?.is_installed || !status.is_renting) continue;

    const types: VehicleTypeCount[] = (status.vehicle_types_available ?? [])
      .filter((v) => v.count > 0)
      .map((v) => ({
        id: v.vehicle_type_id,
        name: typeNameById.get(v.vehicle_type_id) ?? v.vehicle_type_id,
        count: v.count,
      }));

    stations.push({
      stationId: info.station_id,
      name: info.name,
      distanceMeters: Math.round(distanceMeters(lat, lon, info.lat, info.lon)),
      bikesAvailable: status.num_bikes_available,
      docksAvailable: status.num_docks_available,
      vehicleTypes: types,
    });
  }

  stations.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return stations.slice(0, limit);
}
