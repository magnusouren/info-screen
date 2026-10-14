"use client";

import { useCallback, useRef, useState } from "react";

function clamp(v: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, v));
}

interface SliderProps {
	value: number;
	min: number;
	max: number;
	step?: number;
	ariaLabel: string;
	onChange: (value: number) => void;
	onCommit?: (value: number) => void;
	disabled?: boolean;
	/** Color of the straight-line value marker — typically computed from the
	 *  value itself (see lib/colorUtils) so it reflects what's being set. */
	indicatorColor: string;
	className?: string;
}

export default function Slider({
	value,
	min,
	max,
	step = 1,
	ariaLabel,
	onChange,
	onCommit,
	disabled,
	indicatorColor,
	className = "",
}: SliderProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const [dragging, setDragging] = useState(false);

	const pct = ((value - min) / (max - min)) * 100;

	const valueFromPointer = useCallback(
		(clientX: number) => {
			const el = trackRef.current;
			if (!el) return value;
			const rect = el.getBoundingClientRect();
			const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
			const raw = min + ratio * (max - min);
			return clamp(Math.round(raw / step) * step, min, max);
		},
		[min, max, step, value],
	);

	const handlePointerDown = (e: React.PointerEvent) => {
		if (disabled) return;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		setDragging(true);
		onChange(valueFromPointer(e.clientX));
	};
	const handlePointerMove = (e: React.PointerEvent) => {
		if (!dragging) return;
		onChange(valueFromPointer(e.clientX));
	};
	const handlePointerUp = (e: React.PointerEvent) => {
		if (!dragging) return;
		setDragging(false);
		onCommit?.(valueFromPointer(e.clientX));
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (disabled) return;
		let next: number | null = null;
		if (e.key === "ArrowRight" || e.key === "ArrowUp") next = clamp(value + step, min, max);
		if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = clamp(value - step, min, max);
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
			aria-disabled={disabled}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
			onKeyDown={handleKeyDown}
			className={`relative h-12 rounded-xl border border-border bg-surface/40 touch-none transition-colors ${
				disabled ? "opacity-30" : "cursor-pointer hover:bg-surface/70"
			} ${className}`}
		>
			<div
				className="absolute top-1/2 w-4.5 h-9 rounded-full transition-colors border-6"
				style={{
					left: `${pct}%`,
					transform: "translate(-50%, -50%)",
					borderColor: indicatorColor,
				}}
			/>
		</div>
	);
}
