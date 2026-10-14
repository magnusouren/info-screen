"use client";

import { BicycleIcon as Bicycle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { getCoords } from "@/lib/geolocation";
import type { CityBikeStation } from "@/lib/types/citybike";

export default function CityBike() {
	const [station, setStation] = useState<CityBikeStation | null>(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			try {
				const coords = await getCoords();
				const params = coords
					? `?lat=${coords.lat}&lon=${coords.lon}`
					: "";
				const res = await fetch(`/api/citybike${params}`);
				if (!res.ok) throw new Error();
				const json = (await res.json()) as CityBikeStation[];
				if (cancelled) return;
				setStation(json[0] ?? null);
				setError(false);
			} catch {
				if (!cancelled) setError(true);
			}
		};
		load();
		const id = setInterval(load, 30 * 1000);
		return () => {
			cancelled = true;
			clearInterval(id);
		};
	}, []);

	if (!station) {
		return (
			<div>
				<div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
					<Bicycle size={13} weight="light" />
					Bysykkel
				</div>
				<div className="text-text-5 text-sm animate-pulse">
					{error ? "Bysykkeldata utilgjengelig" : "Laster…"}
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
				<Bicycle size={13} weight="light" />
				{station.name}
			</div>
			<div className="flex items-baseline gap-2 text-sm">
				<span className="text-text-2 font-light">
					{station.bikesAvailable}{" "}
					{station.bikesAvailable === 1 ? "sykkel ledig" : "sykler ledig"}
				</span>
				{station.vehicleTypes.length > 0 && (
					<span className="text-text-4 text-xs font-light">
						(
						{station.vehicleTypes
							.map((v) => `${v.count} ${v.name}`)
							.join(", ")}
						)
					</span>
				)}
			</div>
		</div>
	);
}
