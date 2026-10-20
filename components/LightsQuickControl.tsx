"use client";

import { LightbulbIcon as Lightbulb } from "@phosphor-icons/react";
import { useState } from "react";
import { brightnessFill, kelvinFill } from "@/lib/colorUtils";
import { useLights } from "@/lib/useLights";
import LightsModal from "./LightsModal";
import Slider from "./Slider";

const MIN_KELVIN = 2200;
const MAX_KELVIN = 6500;
const DEFAULT_KELVIN = 4000;

// "Bod" (bryterom) skal aldri rikkes av den globale sliderne — eget lys man
// typisk vil styre for seg, ikke få dratt med i et "dimme alle"-kall.
const EXCLUDED_ROOM = "Bod";

function averageOf(values: number[]): number | null {
	if (values.length === 0) return null;
	return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export default function LightsQuickControl() {
	const { data, error, setLight } = useLights();
	const [open, setOpen] = useState(false);

	const controllableRooms = data?.filter((r) => r.name !== EXCLUDED_ROOM) ?? [];
	const dimmableLights = controllableRooms
		.flatMap((r) => r.lights)
		.filter((l) => l.level !== null);
	const tunableLights = controllableRooms
		.flatMap((r) => r.lights)
		.filter((l) => l.colorTemperature !== null);

	const liveMasterAvg = averageOf(
		dimmableLights.filter((l) => l.switch === "on").map((l) => l.level!),
	);
	const [syncedMasterAvg, setSyncedMasterAvg] = useState(liveMasterAvg);
	const [master, setMaster] = useState(liveMasterAvg ?? 50);
	if (liveMasterAvg !== null && liveMasterAvg !== syncedMasterAvg) {
		setSyncedMasterAvg(liveMasterAvg);
		setMaster(liveMasterAvg);
	}

	const liveTempAvg = averageOf(
		tunableLights.filter((l) => l.switch === "on").map((l) => l.colorTemperature!),
	);
	const [syncedTempAvg, setSyncedTempAvg] = useState(liveTempAvg);
	const [temp, setTemp] = useState(liveTempAvg ?? DEFAULT_KELVIN);
	if (liveTempAvg !== null && liveTempAvg !== syncedTempAvg) {
		setSyncedTempAvg(liveTempAvg);
		setTemp(liveTempAvg);
	}

	const applyMaster = (next: number) => {
		for (const light of dimmableLights) {
			setLight(light.id, { switch: "on", level: next });
		}
	};

	const applyTemp = (next: number) => {
		for (const light of tunableLights) {
			setLight(light.id, { switch: "on", colorTemperature: next });
		}
	};

	if (!data && !error) return null;

	return (
		<>
			<div>
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest hover:text-text-2 transition-colors mb-2"
				>
					<Lightbulb size={13} weight="light" />
					Lys
				</button>

				{dimmableLights.length > 0 && (
					<Slider
						value={master}
						min={1}
						max={100}
						onChange={setMaster}
						onCommit={applyMaster}
						ariaLabel="Dimme alle lys"
						indicatorColor={brightnessFill(master)}
						className="w-full mb-4 mt-4"
					/>
				)}

				{tunableLights.length > 0 && (
					<Slider
						value={temp}
						min={MIN_KELVIN}
						max={MAX_KELVIN}
						step={100}
						onChange={setTemp}
						onCommit={applyTemp}
						ariaLabel="Fargetemperatur på alle lys"
						indicatorColor={kelvinFill(temp, MIN_KELVIN, MAX_KELVIN)}
						className="w-full"
					/>
				)}
			</div>

			{open && <LightsModal onClose={() => setOpen(false)} />}
		</>
	);
}
