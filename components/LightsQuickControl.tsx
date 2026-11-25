"use client";

import { CaretRightIcon as CaretRight, LightbulbIcon as Lightbulb } from "@phosphor-icons/react";
import { useState } from "react";
import { averageOf, brightnessFill, kelvinFill, kelvinGradient } from "@/lib/colorUtils";
import { config } from "@/lib/config";
import { useLights } from "@/lib/useLights";
import LightPad from "./LightPad";
import { LightTileShell } from "./LightTile";
import LightsModal from "./LightsModal";
import Skeleton from "./Skeleton";
import Slider from "./Slider";

const MIN_KELVIN = 2200;
const MAX_KELVIN = 6500;
const DEFAULT_KELVIN = 4000;

// "Bod" (bryterom) skal aldri rikkes av den globale sliderne — eget lys man
// typisk vil styre for seg, ikke få dratt med i et "dimme alle"-kall.
const EXCLUDED_ROOM = "Bod";

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

	const controllableLights = controllableRooms.flatMap((r) => r.lights);
	const anyOn = controllableLights.some((l) => l.switch === "on");
	const toggleAll = () => {
		for (const light of controllableLights) {
			setLight(light.id, { switch: anyOn ? "off" : "on" });
		}
	};

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

	if (!data && !error) {
		return (
			<div className="flex-1 min-h-0 flex flex-col">
				<div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
					<Lightbulb size={13} weight="light" />
					Lys
				</div>
				{config.smartThings.quickControl === "card" ? (
					<Skeleton className="w-full h-40 rounded-2xl mt-2" />
				) : (
					<Skeleton className="w-full flex-1 min-h-0 max-sm:aspect-square max-sm:flex-none mt-4" />
				)}
			</div>
		);
	}

	return (
		<>
			<div className="flex-1 min-h-0 flex flex-col">
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest hover:text-text-2 transition-colors mb-2"
				>
					<Lightbulb size={13} weight="light" />
					Lys
				</button>

				{config.smartThings.quickControl === "card" ? (
					controllableLights.length > 0 && (
						<div className="mt-2">
							<LightTileShell
								label="Alle lys"
								on={anyOn}
								onToggle={toggleAll}
								dimmable={dimmableLights.length > 0}
								level={master}
								onLevelChange={setMaster}
								onLevelCommit={applyMaster}
								tunable={tunableLights.length > 0}
								temp={temp}
								onTempCommit={(next) => {
									setTemp(next);
									applyTemp(next);
								}}
								corner={
									<button
										type="button"
										onClick={() => setOpen(true)}
										className="flex items-center gap-1 shrink-0 rounded-full border border-border bg-surface-2 pl-3 pr-2 py-1.5 text-xs text-text-2 hover:text-text active:scale-95 transition-[color,transform]"
									>
										Rom
										<CaretRight size={12} weight="bold" />
									</button>
								}
							/>
						</div>
					)
				) : dimmableLights.length > 0 && tunableLights.length > 0 ? (
					<LightPad
						brightness={master}
						colorTemp={temp}
						minTemp={MIN_KELVIN}
						maxTemp={MAX_KELVIN}
						onChange={(b, t) => {
							setMaster(b);
							setTemp(t);
						}}
						onCommit={(b, t) => {
							applyMaster(b);
							applyTemp(t);
						}}
						ariaLabel="Lysstyrke og fargetemperatur for alle lys"
						ringColor={kelvinFill(temp, MIN_KELVIN, MAX_KELVIN)}
						fillColor={brightnessFill(master)}
						backgroundGradient={kelvinGradient()}
						className="w-full flex-1 min-h-0 max-sm:aspect-square max-sm:flex-none mt-4"
					/>
				) : (
					<>
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
					</>
				)}
			</div>

			{open && <LightsModal onClose={() => setOpen(false)} />}
		</>
	);
}
