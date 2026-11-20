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

        // Lys som skal vises samlet med én felles fader i lys-modalen (men kan
        // utvides for å styre hvert lys for seg). Nøkkelen er gruppenavnet som
        // vises i UI-et, verdien er de nøyaktige lys-labelene (slik de står i
        // SmartThings-appen) som hører til gruppen.
        lightGroups: {
            Trippel: ['Trippel Topp', 'Trippel Midt', 'Trippel Nede 1'],
            'Tak Kjøkken': ['Tak Kjøkken 1', 'Tak Kjøkken 2', 'Tak Kjøkken 3'],
        } as Record<string, string[]>,

        // "Smarte" scene-forslag som vises øverst på mobil. Første regel som
        // matcher nåværende ukedag og klokkeslett vinner, og de første (maks to)
        // scenene i lista som faktisk finnes i SmartThings vises.
        // Ukedager: 1 = mandag … 7 = søndag. Tidsvinduer kan gå over midnatt
        // (f.eks. 22:00–02:00); `to` er eksklusiv.
        suggestions: [
            { days: [1, 2, 3, 4, 5], from: '05:30', to: '09:00', scenes: ['God morgen', 'Borte'] },
            { days: [6, 7], from: '07:00', to: '11:00', scenes: ['God morgen', 'Hjemme'] },
            { days: [1, 2, 3, 4, 5], from: '15:00', to: '18:00', scenes: ['Hjemme', 'Rolig belysning'] },
            { days: [1, 2, 3, 4, 5], from: '18:00', to: '21:00', scenes: ['Rolig belysning', 'Se på TV'] },
            { days: [1, 2, 3, 4, 5, 6, 7], from: '21:00', to: '02:00', scenes: ['God natt', 'Legge seg'] },
        ] as { days: number[]; from: string; to: string; scenes: string[] }[],

        // Adaptive scener: når scenen aktiveres, kjøres den som vanlig i
        // SmartThings, og deretter justeres styrke og fargetemperatur på alle
        // lys som er på etter klokkeslettet. Verdiene interpoleres lineært
        // mellom punktene, og kurven går rundt midnatt (siste punkt → første).
        // Lys uten fargetemperatur får bare styrken justert.
        adaptiveScenes: {
            Hjemme: [
                { time: '06:00', level: 40, kelvin: 2700 },
                { time: '08:00', level: 80, kelvin: 3500 },
                { time: '12:00', level: 100, kelvin: 4000 },
                { time: '17:00', level: 90, kelvin: 3300 },
                { time: '20:00', level: 60, kelvin: 2700 },
                { time: '22:30', level: 30, kelvin: 2200 },
                { time: '02:00', level: 15, kelvin: 2200 },
            ],
        } as Record<string, { time: string; level: number; kelvin: number }[]>,
    },
} as const;

export type Config = typeof config;
