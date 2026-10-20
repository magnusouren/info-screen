import { NextResponse, type NextRequest } from "next/server";
import { fetchServiceJourney } from "@/lib/entur";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=20, stale-while-revalidate=30",
};
const ERROR_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Mangler id" },
      { status: 400, headers: ERROR_HEADERS }
    );
  }

  try {
    const details = await fetchServiceJourney(id);
    if (!details) {
      return NextResponse.json(
        { error: "Fant ingen reisedetaljer" },
        { status: 503, headers: ERROR_HEADERS }
      );
    }
    return NextResponse.json(details, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente reisedetaljer" },
      { status: 503, headers: ERROR_HEADERS }
    );
  }
}
