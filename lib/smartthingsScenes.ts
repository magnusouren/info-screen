import { config } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { Scene, SceneIcon } from "@/lib/types/scenes";

const API_BASE = "https://api.smartthings.com/v1";
const DEFAULT_ICON: SceneIcon = "power";

function toIcon(name: string): SceneIcon {
  const mapped = config.smartThings.sceneIcons[name];
  return (mapped as SceneIcon | undefined) ?? DEFAULT_ICON;
}

export async function fetchScenes(token: string): Promise<Scene[]> {
  const res = await fetchWithTimeout(`${API_BASE}/scenes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SmartThings svarte ${res.status}`);
  const json = (await res.json()) as {
    items?: { sceneId: string; sceneName: string }[];
  };
  return (json.items ?? []).map((item) => ({
    id: item.sceneId,
    name: item.sceneName,
    icon: toIcon(item.sceneName),
  }));
}

export async function executeScene(token: string, id: string): Promise<void> {
  const res = await fetchWithTimeout(
    `${API_BASE}/scenes/${encodeURIComponent(id)}/execute`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`SmartThings svarte ${res.status}`);
}
