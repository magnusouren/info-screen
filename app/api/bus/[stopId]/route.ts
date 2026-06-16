import { NextResponse, type NextRequest } from "next/server";
import { fetchStop } from "@/lib/entur";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stopId: string }> }
) {
  const { stopId } = await params;
  const countParam = Number(request.nextUrl.searchParams.get("count"));
  const count = Number.isFinite(countParam) && countParam > 0
    ? Math.min(Math.floor(countParam), 50)
    : 20;

  const stop = await fetchStop(stopId, count);
  if (!stop) {
    return NextResponse.json(
      { error: "Kunne ikke hente avganger for stoppestedet" },
      { status: 503 }
    );
  }
  return NextResponse.json(stop);
}
