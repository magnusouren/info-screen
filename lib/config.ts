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

    // Kontaktinfo brukt i User-Agent-header mot api.met.no
    // Bytt til din egen e-post per api.met.no sine retningslinjer
    metContact: 'magnut0203@gmail.com',
} as const;

export type Config = typeof config;
