import BusDepartures from "@/components/BusDepartures";
import Calendar from "@/components/Calendar";
import Clock from "@/components/Clock";
import Currency from "@/components/Currency";
import ElectricityPriceClient from "@/components/ElectricityPriceClient";
import ErrorBoundary from "@/components/ErrorBoundary";
import LightsQuickControl from "@/components/LightsQuickControl";
import News from "@/components/News";
import Scenes from "@/components/Scenes";
import Sunrise from "@/components/Sunrise";
import Weather from "@/components/Weather";

export default function Page() {
	return (
		<main className="min-h-dvh sm:h-dvh w-full overflow-y-auto sm:overflow-hidden bg-bg p-4 sm:p-5 lg:p-6 flex flex-col gap-3 lg:gap-4">
			{/* Top row: Clock + Weather + Calendar — same column template as the row below so they align */}
			<div className="flex flex-col sm:grid sm:grid-cols-[minmax(140px,0.9fr)_1px_minmax(160px,1fr)_1px_minmax(160px,1fr)] gap-4 md:gap-6 sm:items-start shrink-0 min-w-0">
				<div className="min-w-0">
					<ErrorBoundary label="Klokke">
						<Clock />
					</ErrorBoundary>
				</div>

				<div className="border-t border-border sm:border-t-0 sm:bg-border" />

				<div className="min-w-0 flex flex-col gap-2">
					<ErrorBoundary label="Vær">
						<Weather />
					</ErrorBoundary>
					<ErrorBoundary label="Sol">
						<Sunrise />
					</ErrorBoundary>
				</div>

				<div className="border-t border-border sm:border-t-0 sm:bg-border" />

				<div className="min-w-0">
					<ErrorBoundary label="Kalender">
						<Calendar />
					</ErrorBoundary>
				</div>
			</div>

			{/* Divider */}
			<div className="border-t border-border shrink-0" />

			{/* Bottom row: Bus + Home control + News/Prices */}
			<div className="flex flex-col sm:grid sm:grid-cols-[minmax(140px,0.9fr)_1px_minmax(160px,1fr)_1px_minmax(160px,1fr)] gap-4 md:gap-6 sm:flex-1 sm:min-h-0">
				<div className="min-w-0 overflow-hidden">
					<ErrorBoundary label="Buss">
						<BusDepartures />
					</ErrorBoundary>
				</div>

				<div className="border-t border-border sm:border-t-0 sm:bg-border" />

				<div className="min-w-0 overflow-hidden flex flex-col gap-4 lg:gap-6">
					<ErrorBoundary label="Scener">
						<Scenes />
					</ErrorBoundary>
					<div className="border-t border-border" />
					<ErrorBoundary label="Lys">
						<LightsQuickControl />
					</ErrorBoundary>
				</div>

				<div className="border-t border-border sm:border-t-0 sm:bg-border" />

				<div className="min-w-0 overflow-hidden flex flex-col gap-4 lg:gap-6">
					<div className="sm:flex-1 sm:min-h-0">
						<ErrorBoundary label="Nyheter">
							<News />
						</ErrorBoundary>
					</div>
					<div className="border-t border-border shrink-0" />
					<div className="shrink-0">
						<ErrorBoundary label="Strømpris">
							<ElectricityPriceClient />
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
