// Entur returns line colours as bare 3- or 6-digit hex (no leading "#").
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Brightness slider fill: blend from the neutral track color up to the full
// accent as the value rises, so a dim setting actually looks dim instead of
// just being a narrower bar of the same vivid color.
export function brightnessFill(pct: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return `color-mix(in srgb, var(--surface-2), var(--accent) ${clamped}%)`;
}

// Color-temperature slider fill: a real warm → neutral-white → cool ramp.
// A naive two-point lerp from orange straight to blue crosses through a
// muddy gray-brown in the middle; routing it through white keeps every
// point on the ramp looking like actual light instead of a color mistake.
const KELVIN_WARM: [number, number, number] = [255, 138, 61];
const KELVIN_WHITE: [number, number, number] = [255, 244, 224];
const KELVIN_COOL: [number, number, number] = [120, 170, 255];

function lerpChannel(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t);
}

function mixRgb(
  from: [number, number, number],
  to: [number, number, number],
  t: number
): string {
  return `rgb(${lerpChannel(from[0], to[0], t)}, ${lerpChannel(from[1], to[1], t)}, ${lerpChannel(from[2], to[2], t)})`;
}

export function kelvinFill(value: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return t <= 0.5
    ? mixRgb(KELVIN_WARM, KELVIN_WHITE, t / 0.5)
    : mixRgb(KELVIN_WHITE, KELVIN_COOL, (t - 0.5) / 0.5);
}

// Same warm → white → cool ramp as kelvinFill, as a left-to-right CSS
// gradient — for backgrounds that hint at the color-temperature axis itself.
export function kelvinGradient(): string {
  return `linear-gradient(to right, rgb(${KELVIN_WARM.join(", ")}), rgb(${KELVIN_WHITE.join(", ")}), rgb(${KELVIN_COOL.join(", ")}))`;
}

export function averageOf(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}
