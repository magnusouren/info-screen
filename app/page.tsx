import Clock from "@/components/Clock";
import Weather from "@/components/Weather";
import Sunrise from "@/components/Sunrise";
import BusDepartures from "@/components/BusDepartures";
import News from "@/components/News";
import ErrorBoundary from "@/components/ErrorBoundary";
import ElectricityPriceClient from "@/components/ElectricityPriceClient";

export default function Page() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-zinc-950 p-6 flex flex-col gap-4">
      {/* Top row: Clock + Weather + Sunrise */}
      <div className="flex items-start gap-8 shrink-0">
        <div className="flex-none">
          <ErrorBoundary label="Klokke">
            <Clock />
          </ErrorBoundary>
        </div>

        <div className="flex flex-col gap-2 justify-center pt-2 flex-none">
          <ErrorBoundary label="Vær">
            <Weather />
          </ErrorBoundary>
          <ErrorBoundary label="Sol">
            <Sunrise />
          </ErrorBoundary>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-900 shrink-0" />

      {/* Bottom row: Bus + Prices + News */}
      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-72 shrink-0 overflow-hidden">
          <ErrorBoundary label="Buss">
            <BusDepartures />
          </ErrorBoundary>
        </div>

        <div className="w-px bg-zinc-900 shrink-0" />

        <div className="flex-1 overflow-hidden">
          <ErrorBoundary label="Strømpris">
            <ElectricityPriceClient />
          </ErrorBoundary>
        </div>

        <div className="w-px bg-zinc-900 shrink-0" />

        <div className="w-80 shrink-0 overflow-hidden">
          <ErrorBoundary label="Nyheter">
            <News />
          </ErrorBoundary>
        </div>
      </div>
    </main>
  );
}
