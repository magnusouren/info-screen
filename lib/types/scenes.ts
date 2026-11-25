export type SceneIcon =
  | "power"
  | "lightbulb"
  | "moonstars"
  | "filmreel"
  | "broom"
  | "forkknife"
  | "moon"
  | "sun"
  | "sundim"
  | "sunhorizon"
  | "house"
  | "television";

export interface Scene {
  id: string;
  name: string;
  icon: SceneIcon;
}

export interface ScenesData {
  scenes: Scene[];
}
