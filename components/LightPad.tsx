"use client";

import { useCallback, useRef, useState } from "react";

function clamp(v: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, v));
}

interface LightPadProps {
	brightness: number;
	colorTemp: number;
	minTemp: number;
	maxTemp: number;
	tempStep?: number;
	onChange: (brightness: number, colorTemp: number) => void;
	onCommit?: (brightness: number, colorTemp: number) => void;
	disabled?: boolean;
	ariaLabel: string;
	/** Dot ring color — typically computed from colorTemp (see lib/colorUtils). */
	ringColor: string;
	/** Dot fill color — typically computed from brightness (see lib/colorUtils). */
	fillColor: string;
	className?: string;
}

export default function LightPad({
	brightness,
	colorTemp,
	minTemp,
	maxTemp,
	tempStep = 100,
	onChange,
	onCommit,
	disabled,
	ariaLabel,
	ringColor,
	fillColor,
	className = "",
}: LightPadProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const [dragging, setDragging] = useState(false);

	const xPct = ((colorTemp - minTemp) / (maxTemp - minTemp)) * 100;
	const yPct = 100 - ((brightness - 1) / 99) * 100;

	const valuesFromPointer = useCallback(
		(clientX: number, clientY: number) => {
			const el = trackRef.current;
			if (!el) return { brightness, colorTemp };
			const rect = el.getBoundingClientRect();
			const xRatio = clamp((clientX - rect.left) / rect.width, 0, 1);
			const yRatio = clamp((clientY - rect.top) / rect.height, 0, 1);
			const nextTemp =
				Math.round((minTemp + xRatio * (maxTemp - minTemp)) / tempStep) * tempStep;
			const nextBrightness = Math.round(1 + (1 - yRatio) * 99);
			return {
				brightness: clamp(nextBrightness, 1, 100),
				colorTemp: clamp(nextTemp, minTemp, maxTemp),
			};
		},
		[brightness, colorTemp, minTemp, maxTemp, tempStep],
	);

	const handlePointerDown = (e: React.PointerEvent) => {
		if (disabled) return;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		setDragging(true);
		const v = valuesFromPointer(e.clientX, e.clientY);
		onChange(v.brightness, v.colorTemp);
	};
	const handlePointerMove = (e: React.PointerEvent) => {
		if (!dragging) return;
		const v = valuesFromPointer(e.clientX, e.clientY);
		onChange(v.brightness, v.colorTemp);
	};
	const handlePointerUp = (e: React.PointerEvent) => {
		if (!dragging) return;
		setDragging(false);
		const v = valuesFromPointer(e.clientX, e.clientY);
		onCommit?.(v.brightness, v.colorTemp);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (disabled) return;
		let nextBrightness = brightness;
		let nextTemp = colorTemp;
		if (e.key === "ArrowUp") nextBrightness = clamp(brightness + 1, 1, 100);
		else if (e.key === "ArrowDown") nextBrightness = clamp(brightness - 1, 1, 100);
		else if (e.key === "ArrowRight") nextTemp = clamp(colorTemp + tempStep, minTemp, maxTemp);
		else if (e.key === "ArrowLeft") nextTemp = clamp(colorTemp - tempStep, minTemp, maxTemp);
		else return;
		e.preventDefault();
		onChange(nextBrightness, nextTemp);
		onCommit?.(nextBrightness, nextTemp);
	};

	return (
		<div
			ref={trackRef}
			role="slider"
			tabIndex={disabled ? -1 : 0}
			aria-label={ariaLabel}
			aria-valuemin={1}
			aria-valuemax={100}
			aria-valuenow={brightness}
			aria-valuetext={`Lysstyrke ${brightness}%, fargetemperatur ${colorTemp}K`}
			aria-disabled={disabled}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
			onKeyDown={handleKeyDown}
			className={`relative rounded-xl border border-border bg-surface/40 touch-none transition-colors ${
				disabled ? "opacity-30" : "cursor-pointer hover:bg-surface/70"
			} ${className}`}
		>
			<div
				className="absolute w-5 h-5 rounded-full border-4 transition-colors"
				style={{
					left: `${xPct}%`,
					top: `${yPct}%`,
					transform: "translate(-50%, -50%)",
					borderColor: ringColor,
					backgroundColor: fillColor,
				}}
			/>
		</div>
	);
}
