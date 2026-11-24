// ─── Infoskjerm-konfigurasjon ────────────────────────────────────────────────
// Endre disse verdiene for å tilpasse skjermen til din lokasjon.

export const config = {
    // Geografisk posisjon
    location: {
        lat: 59.92312062821025,
        lon: 10.77223142198102,
        name: 'Sofienberg',
    },

    // Kveldsoppsett på mobil: i dette tidsvinduet flyttes Scener og Lys over
    // Avganger og Bysykkel. Vinduet kan gå over midnatt; `to` er eksklusiv.
    layout: {
        evening: { from: '18:00', to: '05:00' },
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
            Kveldsbelysning: 'moonstars',
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
            { days: [1, 2, 3, 4, 5, 6, 7], from: '05:00', to: '11:00', scenes: ['God morgen', 'Borte'] },
            { days: [1, 2, 3, 4, 5, 6, 7], from: '11:00', to: '15:00', scenes: ['Hjemme', 'Borte'] },
            { days: [1, 2, 3, 4, 5, 6, 7], from: '15:00', to: '21:00', scenes: ['Rolig belysning', 'Kveldsbelysning'] },
            { days: [1, 2, 3, 4, 5, 6, 7], from: '21:00', to: '00:00', scenes: ['God natt', 'Legge seg'] },
            { days: [1, 2, 3, 4, 5, 6, 7], from: '00:00', to: '05:00', scenes: ['God natt', 'God morgen'] },
        ] as { days: number[]; from: string; to: string; scenes: string[] }[],
    },
} as const;

export type Config = typeof config;
