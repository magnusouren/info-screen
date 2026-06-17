export type SceneIcon =
  | "power"
  | "lightbulb"
  | "moonstars"
  | "filmreel"
  | "broom"
  | "forkknife";

export interface Scene {
  id: string;
  name: string;
  icon: SceneIcon;
}

export interface ScenesData {
  scenes: Scene[];
  activeId: string | null;
}
