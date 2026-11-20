import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { AdaptiveTarget } from "@/lib/adaptiveLighting";

const API_BASE = "https://api.smartthings.com/v1";
const MIN_KELVIN = 2200;
const MAX_KELVIN = 6500;

// Capabilities that rule a device out even though it has `switch` —
// TVs, media players, sensors and buttons all expose `switch` on SmartThings
// but aren't lights we want on the lights page.
const NON_LIGHT_CAPS = new Set([
  "tvChannel",
  "mediaPlayback",
  "mediaTrackControl",
  "mediaInputSource",
  "mediaGroup",
  "mediaPresets",
  "audioVolume",
  "audioMute",
  "audioNotification",
  "audioTrackData",
  "contactSensor",
  "button",
  "presenceSensor",
  "bridge",
  "illuminanceMeasurement",
  "relativeBrightness",
  "knob",
]);

export interface SmartThingsDevice {
  deviceId: string;
  label?: string;
  name?: string;
  roomId?: string;
  components?: { capabilities?: { id: string }[] }[];
}

export function deviceCapabilities(device: SmartThingsDevice): Set<string> {
  const caps = new Set<string>();
  for (const component of device.components ?? []) {
    for (const cap of component.capabilities ?? []) caps.add(cap.id);
  }
  return caps;
}

function isLight(device: SmartThingsDevice): boolean {
  const caps = deviceCapabilities(device);
  if (!caps.has("switch")) return false;
  for (const bad of NON_LIGHT_CAPS) if (caps.has(bad)) return false;
  return true;
}

/** Henter alle enheter fra SmartThings som ser ut som lys. */
export async function fetchLightDevices(
  token: string
): Promise<SmartThingsDevice[]> {
  const res = await fetch(`${API_BASE}/devices`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SmartThings svarte ${res.status}`);
  const json = (await res.json()) as { items?: SmartThingsDevice[] };
  return (json.items ?? []).filter(isLight);
}

async function isOn(token: string, deviceId: string): Promise<boolean> {
  const res = await fetchWithTimeout(
    `${API_BASE}/devices/${deviceId}/components/main/capabilities/switch/status`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return false;
  const json = (await res.json()) as { switch?: { value?: string } };
  return json.switch?.value === "on";
}

/**
 * Setter styrke og fargetemperatur på alle dimbare lys som er på. Lys som er
 * av røres ikke (setLevel ville ellers skrudd dem på). Returnerer antall lys
 * som ble justert.
 */
export async function applyToLightsThatAreOn(
  token: string,
  target: AdaptiveTarget
): Promise<number> {
  const devices = (await fetchLightDevices(token)).filter((d) =>
    deviceCapabilities(d).has("switchLevel")
  );

  const level = Math.max(1, Math.min(100, Math.round(target.level)));
  const kelvin = Math.max(MIN_KELVIN, Math.min(MAX_KELVIN, Math.round(target.kelvin)));

  const results = await Promise.allSettled(
    devices.map(async (device) => {
      if (!(await isOn(token, device.deviceId))) return false;
      const commands: Record<string, unknown>[] = [
        {
          component: "main",
          capability: "switchLevel",
          command: "setLevel",
          arguments: [level],
        },
      ];
      if (deviceCapabilities(device).has("colorTemperature")) {
        commands.push({
          component: "main",
          capability: "colorTemperature",
          command: "setColorTemperature",
          arguments: [kelvin],
        });
      }
      const res = await fetchWithTimeout(
        `${API_BASE}/devices/${device.deviceId}/commands`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ commands }),
        }
      );
      return res.ok;
    })
  );
  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}
