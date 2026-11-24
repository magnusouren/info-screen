export type Coords = { lat: number; lon: number } | null;

const STORAGE_KEY = "info-screen:coords";

function readCached(): Coords {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat?: unknown; lon?: unknown };
    if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
      return { lat: parsed.lat, lon: parsed.lon };
    }
  } catch {
    // Privat modus / blokkert lagring: oppfør oss som om ingenting er lagret.
  }
  return null;
}

function writeCached(coords: NonNullable<Coords>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
  } catch {
    // Ignorer — lagringen er bare en bekvemmelighet.
  }
}

/** "granted" | "denied" | "prompt", eller null hvis nettleseren ikke støtter Permissions API. */
async function permissionState(): Promise<PermissionState | null> {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });
    return status?.state ?? null;
  } catch {
    return null;
  }
}

function requestPosition(): Promise<Coords> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        writeCached(coords);
        resolve(coords);
      },
      (err) => {
        console.warn(`Geolocation error (${err.code}): ${err.message}`);
        resolve(null);
      },
      { timeout: 20000, maximumAge: 60 * 60 * 1000, enableHighAccuracy: false }
    );
  });
}

async function resolveCoords(): Promise<Coords> {
  const cached = readCached();
  const state = await permissionState();

  // Tillatelsen er allerede gitt: hent fersk posisjon uten å spørre.
  if (state === "granted") return (await requestPosition()) ?? cached;
  // Nektet: ikke spør, bruk det vi har (ellers faller API-ene tilbake på config).
  if (state === "denied") return cached;
  // Ville gitt en dialog: bruk lagret posisjon hvis vi har en, og spør bare
  // første gang (eller etter at lagringen er tømt).
  if (cached) return cached;
  return requestPosition();
}

let inFlight: Promise<Coords> | null = null;

/**
 * Henter brukerens posisjon. Lagrer siste kjente posisjon i localStorage slik
 * at nettleseren bare spør om tillatelse når vi ikke har noen posisjon fra før.
 * Samtidige kall (vær, soloppgang, bysykkel …) deler én forespørsel.
 */
export function getCoords(): Promise<Coords> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  if (!inFlight) {
    inFlight = resolveCoords().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
