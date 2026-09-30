// Server-side environment values. Do NOT import into client components.

export const metContact = process.env.MET_CONTACT_EMAIL ?? "";

// User-Agent sent to api.met.no — they require a contact e-mail per their TOS.
// See https://api.met.no/doc/TermsOfService
export const userAgent = `infoskjerm/1.0 ${metContact}`.trim();

// SmartThings OAuth-In SmartApp (PAT-er varer bare 24t, så vi bruker en ordentlig
// OAuth-integrasjon i stedet). Opprettes med SmartThings CLI — se lib/smartthingsAuth.ts.
export const smartThingsClientId = process.env.SMARTTHINGS_CLIENT_ID ?? "";
export const smartThingsClientSecret =
  process.env.SMARTTHINGS_CLIENT_SECRET ?? "";
// Må matche nøyaktig redirectUri registrert på SmartApp-en,
// f.eks. https://ditt-domene.vercel.app/api/smartthings/callback
export const smartThingsRedirectUri =
  process.env.SMARTTHINGS_REDIRECT_URI ?? "";

// Passord som beskytter hele infoskjermen når den er deployet offentlig
// (f.eks. på Vercel). Sett en egen verdi i .env.local / Vercel sine
// miljøvariabler — se proxy.ts og app/login.
export const dashboardPassword = process.env.DASHBOARD_PASSWORD ?? "";
