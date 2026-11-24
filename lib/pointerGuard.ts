/**
 * Høyde (px) nederst på skjermen der berøring regnes som starten på en
 * systemgest (f.eks. sveip opp fra hjem-indikatoren på iPhone) og ignoreres
 * av slidere og lys-paden.
 */
const BOTTOM_EDGE_PX = 40;

/** True hvis en berøring starter så nær bunnkanten at den trolig er en systemgest. */
export function startsInSystemGestureZone(e: React.PointerEvent): boolean {
  if (e.pointerType !== "touch") return false;
  return e.clientY > window.innerHeight - BOTTOM_EDGE_PX;
}
