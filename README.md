This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Snarveier (iOS Shortcuts)

Scener kan kjøres fra iOS Snarveier, Siri, handlingsknappen eller NFC via
`/api/shortcuts/scenes`. Endepunktet bruker ikke innloggings-cookien, men et
eget token.

1. Lag et tilfeldig token, f.eks. `openssl rand -hex 32`, og sett det som
   miljøvariabelen `SHORTCUTS_TOKEN` (i Vercel og/eller `.env.local`).
   Uten token er endepunktet avslått.
2. I Snarveier: legg til handlingen **Hent innhold i URL** (Get Contents of URL):
   - URL: `https://<domenet>/api/shortcuts/scenes`
   - Metode: `POST`
   - Overskrifter: `Authorization` = `Bearer <token>`
   - Forespørselstekst: JSON, `name` = scenenavnet, f.eks. `Kveld`
3. `GET` med samme overskrift gir en liste over alle scenenavn — nyttig sammen
   med **Velg fra liste** for én snarvei som kan kjøre hvilken som helst scene.

Svaret er `{ "ok": true, "scene": "Kveld" }`, eller `{ "ok": false, "error": "…" }`
med feilmelding (f.eks. ukjent scenenavn, med liste over gyldige navn).

