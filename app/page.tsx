import Clock from "@/components/Clock";
import Weather from "@/components/Weather";
import Sunrise from "@/components/Sunrise";
import BusDepartures from "@/components/BusDepartures";
import News from "@/components/News";
import ErrorBoundary from "@/components/ErrorBoundary";
import ElectricityPriceClient from "@/components/ElectricityPriceClient";
import Football from "@/components/Football";
import Calendar from "@/components/Calendar";
import Currency from "@/components/Currency";
import Countdown from "@/components/Countdown";

export default function Page() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-bg p-6 flex flex-col gap-4">
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

        <div className="ml-auto pt-2 flex-none w-72">
          <ErrorBoundary label="Nedtelling">
            <Countdown />
          </ErrorBoundary>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border shrink-0" />

      {/* Bottom row: Bus + Prices + News */}
      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-72 shrink-0 overflow-hidden">
          <ErrorBoundary label="Buss">
            <BusDepartures />
          </ErrorBoundary>
        </div>

        <div className="w-px bg-border shrink-0" />

        <div className="flex-1 overflow-hidden flex flex-col gap-6">
          <ErrorBoundary label="Kalender">
            <Calendar />
          </ErrorBoundary>
          <div className="border-t border-border" />
          <ErrorBoundary label="Strømpris">
            <ElectricityPriceClient />
          </ErrorBoundary>
          <div className="border-t border-border" />
          <ErrorBoundary label="Fotball">
            <Football />
          </ErrorBoundary>
        </div>

        <div className="w-px bg-border shrink-0" />

        <div className="w-80 shrink-0 overflow-hidden flex flex-col gap-6">
          <div className="flex-1 min-h-0">
            <ErrorBoundary label="Nyheter">
              <News />
            </ErrorBoundary>
          </div>
          <div className="border-t border-border shrink-0" />
          <div className="shrink-0">
            <ErrorBoundary label="Valuta">
              <Currency />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </main>
  );
}
