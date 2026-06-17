// ─── Infoskjerm-konfigurasjon ────────────────────────────────────────────────
// Endre disse verdiene for å tilpasse skjermen til din lokasjon.

export const config = {
    // Geografisk posisjon (Trondheim sentrum som standard)
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
            { stopId: 'NSR:StopPlace:58246', maxDepartures: 5 },
            { stopId: 'NSR:StopPlace:58190', maxDepartures: 5 },
            { stopId: 'NSR:StopPlace:59421', maxDepartures: 5 },
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

    // Fotball: følg disse landslagene / klubbene (TheSportsDB team-ID).
    // Sikrer at kampene deres alltid kommer med, selv når TheSportsDBs
    // eventsday-feed er ufullstendig for store turneringer.
    // Finn ID-en på: https://www.thesportsdb.com/team.php?t=<lagnavn>
    football: {
        followTeamIds: [
            '136516', // Norge (herrer)
            '134574', // Vålerenga
            '133602', // Liverpool
        ],
    },
} as const;

export type Config = typeof config;
