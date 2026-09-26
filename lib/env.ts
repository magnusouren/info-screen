// Server-side environment values. Do NOT import into client components.

export const metContact = process.env.MET_CONTACT_EMAIL ?? "";

// User-Agent sent to api.met.no — they require a contact e-mail per their TOS.
// See https://api.met.no/doc/TermsOfService
export const userAgent = `infoskjerm/1.0 ${metContact}`.trim();

// SmartThings Personal Access Token. Lag en på
// https://account.smartthings.com/tokens med scopes r:scenes:* og x:scenes:*.
export const smartThingsToken = process.env.SMARTTHINGS_TOKEN ?? "";

// Passord som beskytter hele infoskjermen når den er deployet offentlig
// (f.eks. på Vercel). Sett en egen verdi i .env.local / Vercel sine
// miljøvariabler — se proxy.ts og app/login.
export const dashboardPassword = process.env.DASHBOARD_PASSWORD ?? "";
