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
        stops: [
        ],
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
    },
} as const;

export type Config = typeof config;
