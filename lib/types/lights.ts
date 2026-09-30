export interface Light {
  id: string;
  label: string;
  switch: "on" | "off";
  level: number | null;
}

export interface LightRoom {
  id: string;
  name: string;
  lights: Light[];
}

export type LightsData = LightRoom[];
