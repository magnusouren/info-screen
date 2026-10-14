export interface VehicleTypeCount {
  id: string;
  name: string;
  count: number;
}

export interface CityBikeStation {
  stationId: string;
  name: string;
  distanceMeters: number;
  bikesAvailable: number;
  docksAvailable: number;
  vehicleTypes: VehicleTypeCount[];
}
