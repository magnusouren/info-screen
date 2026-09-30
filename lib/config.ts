// ─── Infoskjerm-konfigurasjon ────────────────────────────────────────────────
// Endre disse verdiene for å tilpasse skjermen til din lokasjon.

export const config = {
    // Geografisk posisjon
    location: {
        lat: 59.92312062821025,
        lon: 10.77223142198102,
        name: 'Sofienberg',
    },

    // Busstopp fra Entur (NSR-format)
    // Finn din stopp-ID på: https://stoppested.entur.org/
    // Legg til flere objekter for å vise flere stopp.
    bus: {
        stops: [] as { stopId: string; maxDepartures: number }[],
    },

    // Strømprisområde
    // Gyldige verdier: NO1 (Oslo), NO2 (Kristiansand), NO3 (Trondheim),
    //                  NO4 (Tromsø), NO5 (Bergen)
    electricity: {
        priceArea: 'NO1',
    },

    // Kalender (iCal-feed). Legg til så mange kilder du vil.
    // For Google Calendar: Innstillinger → Integrer kalender →
    //   "Hemmelig adresse i iCal-format". Lagre URL-en i .env.local under
    //   nøkkelen du oppgir i envKey under (f.eks. CALENDAR_URL_PRIVATE).
    calendar: {
        sources: [
            {
                name: 'Privat',
                envKey: 'CALENDAR_URL_PRIVATE',
                color: '#7aa2f7',
            },
            {
                name: 'Familie',
                envKey: 'CALENDAR_URL_FAMILY',
                color: '#f7d87a',
            },
        ],
        daysAhead: 14,
        maxEvents: 6,
    },

    // SmartThings (smarthjem-scener). Kobles til via en egen OAuth-In SmartApp
    // (opprettet med `smartthings apps:create`) — se lib/smartthingsAuth.ts.
    smartThings: {
        // Valgfri mapping fra scene-navn (slik det er skrevet i SmartThings-appen)
        // til ikon i UI-et. Scener uten mapping her får standardikonet.
        sceneIcons: {
            'Se på TV': 'filmreel',
            'God natt': 'moonstars',
            'God morgen': 'lightbulb',
            'Legge seg': 'moonstars',
            Borte: 'power',
            'Alt på': 'lightbulb',
            'Rolig belysning': 'lightbulb',
            Hjemme: 'power',
        } as Record<string, string>,

        // Mapping fra SmartThings sin roomId til visningsnavn for lys-siden.
        // Finn roomId-ene dine ved å inspisere enhetene via SmartThings API
        // (GET /v1/devices) — vi ber ikke om r:locations:*-scope for å slippe
        // å hente de faktiske romnavnene derfra.
        rooms: {
            '8b374516-caa5-45e9-97ff-5eea6338f155': 'Stue',
            'd33aae1f-06e9-4d3a-9c74-a09e6504bd30': 'Kjøkken',
            'fb744aae-6342-47a1-9058-0547c837136d': 'Soverom',
            'b870030c-92d3-436a-8677-21b88be89c9d': 'Bod',
        } as Record<string, string>,
    },
} as const;

export type Config = typeof config;
