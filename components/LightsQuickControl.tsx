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

export default function LightsQuickControl() {
	const { data, error, setLight } = useLights();
	const [open, setOpen] = useState(false);
	const [master, setMaster] = useState(50);
	const [temp, setTemp] = useState(DEFAULT_KELVIN);
	const [initialized, setInitialized] = useState(false);

	if (!initialized && data) {
		const onDimmable = data
			.flatMap((r) => r.lights)
			.filter((l) => l.level !== null && l.switch === "on");
		if (onDimmable.length > 0) {
			const avg = Math.round(
				onDimmable.reduce((sum, l) => sum + (l.level ?? 0), 0) /
					onDimmable.length,
			);
			setMaster(avg);
		}

		const onTunable = data
			.flatMap((r) => r.lights)
			.filter((l) => l.colorTemperature !== null && l.switch === "on");
		if (onTunable.length > 0) {
			const avg = Math.round(
				onTunable.reduce((sum, l) => sum + (l.colorTemperature ?? 0), 0) /
					onTunable.length,
			);
			setTemp(avg);
		}
		setInitialized(true);
	}

	const dimmableLights =
		data?.flatMap((r) => r.lights).filter((l) => l.level !== null) ?? [];
	const tunableLights =
		data?.flatMap((r) => r.lights).filter((l) => l.colorTemperature !== null) ??
		[];

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
