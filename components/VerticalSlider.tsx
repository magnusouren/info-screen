"use client";

import { useCallback, useRef, useState } from "react";

function clamp(v: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, v));
}

interface VerticalSliderProps {
	value: number;
	min: number;
	max: number;
	step?: number;
	ariaLabel: string;
	onChange: (value: number) => void;
	onCommit?: (value: number) => void;
	disabled?: boolean;
	/** "fill" draws a bottom-up bar for a quantity (brightness). "position"
	 *  draws a fixed background (e.g. a color ramp) with just a thumb marking
	 *  where the value sits on it — for an axis like color temperature where
	 *  the value is a position, not an amount. */
	mode?: "fill" | "position";
	/** Fill bar color — used in "fill" mode. */
	fillColor?: string;
	/** Fixed track background — typically a gradient — used in "position" mode. */
	trackBackground?: string;
	/** Thumb outline color in "position" mode. */
	thumbColor?: string;
	/** Formatted value shown next to the thumb while dragging. */
	formatValue?: (value: number) => string;
	className?: string;
}

export default function VerticalSlider({
	value,
	min,
	max,
	step = 1,
	ariaLabel,
	onChange,
	onCommit,
	disabled,
	mode = "fill",
	fillColor,
	trackBackground,
	thumbColor,
	formatValue,
	className = "",
}: VerticalSliderProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const [dragging, setDragging] = useState(false);

	const pct = ((value - min) / (max - min)) * 100;

	const valueFromPointer = useCallback(
		(clientY: number) => {
			const el = trackRef.current;
			if (!el) return value;
			const rect = el.getBoundingClientRect();
			const ratio = clamp((rect.bottom - clientY) / rect.height, 0, 1);
			const raw = min + ratio * (max - min);
			return clamp(Math.round(raw / step) * step, min, max);
		},
		[min, max, step, value],
	);

	const handlePointerDown = (e: React.PointerEvent) => {
		if (disabled) return;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		setDragging(true);
		onChange(valueFromPointer(e.clientY));
	};
	const handlePointerMove = (e: React.PointerEvent) => {
		if (!dragging) return;
		onChange(valueFromPointer(e.clientY));
	};
	const handlePointerUp = (e: React.PointerEvent) => {
		if (!dragging) return;
		setDragging(false);
		onCommit?.(valueFromPointer(e.clientY));
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (disabled) return;
		let next: number | null = null;
		if (e.key === "ArrowUp" || e.key === "ArrowRight") next = clamp(value + step, min, max);
		if (e.key === "ArrowDown" || e.key === "ArrowLeft") next = clamp(value - step, min, max);
		if (e.key === "Home") next = min;
		if (e.key === "End") next = max;
		if (next === null) return;
		e.preventDefault();
		onChange(next);
		onCommit?.(next);
	};

	return (
		<div
			ref={trackRef}
			role="slider"
			tabIndex={disabled ? -1 : 0}
			aria-label={ariaLabel}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-orientation="vertical"
			aria-disabled={disabled}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
			onKeyDown={handleKeyDown}
			className={`relative rounded-full border border-border bg-surface-2/50 touch-none overflow-visible transition-colors ${
				disabled ? "opacity-30" : "cursor-pointer hover:bg-surface-2/80"
			} ${className}`}
			style={mode === "position" ? { background: trackBackground } : undefined}
		>
			<div className="absolute inset-0 rounded-full overflow-hidden">
				{mode === "fill" && (
					<div
						className="absolute inset-x-0 bottom-0 transition-[height] duration-150 ease-out"
						style={{ height: `${pct}%`, background: fillColor }}
					/>
				)}
			</div>

			{dragging && formatValue && (
				<div
					className="absolute left-1/2 -translate-x-1/2 -translate-y-[calc(100%+10px)] px-1.5 py-0.5 rounded-md bg-surface border border-border-strong text-[10px] text-text-2 whitespace-nowrap shadow-lg z-10"
					style={{ bottom: `${pct}%` }}
				>
					{formatValue(value)}
				</div>
			)}

			<div
				className="absolute left-1/2 w-[80%] h-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-[bottom,transform] duration-150 ease-out"
				style={{
					bottom: `calc(${pct}% - 3px)`,
					transform: `translateX(-50%) scaleX(${dragging ? 1.15 : 1})`,
					background: mode === "position" ? "var(--surface)" : "rgba(255,255,255,0.92)",
					border:
						mode === "position"
							? `2px solid ${thumbColor ?? fillColor ?? "var(--accent)"}`
							: undefined,
				}}
			/>
		</div>
	);
}
