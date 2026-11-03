import { config } from "@/lib/config";
import type { Light } from "@/lib/types/lights";

export type LightGroupItem =
  | { kind: "single"; light: Light }
  | { kind: "group"; id: string; name: string; lights: Light[] };

// Folds configured multi-zone fixtures (e.g. "Trippel topp/midt/nede") into a
// single combined item, in the order their first member appears in `lights`.
// A configured group with fewer than 2 members actually present just falls
// through as a regular single light.
export function groupLights(lights: Light[]): LightGroupItem[] {
  const labelToGroup = new Map<string, string>();
  for (const [groupName, labels] of Object.entries(config.smartThings.lightGroups)) {
    for (const label of labels) labelToGroup.set(label, groupName);
  }

  const items: LightGroupItem[] = [];
  const seenGroups = new Set<string>();

  for (const light of lights) {
    const groupName = labelToGroup.get(light.label);
    if (!groupName) {
      items.push({ kind: "single", light });
      continue;
    }
    if (seenGroups.has(groupName)) continue;
    seenGroups.add(groupName);

    const members = lights.filter((l) => labelToGroup.get(l.label) === groupName);
    items.push(
      members.length > 1
        ? { kind: "group", id: groupName, name: groupName, lights: members }
        : { kind: "single", light: members[0] },
    );
  }

  return items;
}
