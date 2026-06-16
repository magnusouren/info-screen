"use client";

import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Drop,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

type IconComponent = Icon;

const symbolMap: Record<string, IconComponent> = {
  clearsky_day: Sun,
  clearsky_night: Moon,
  clearsky_polartwilight: Sun,
  fair_day: CloudSun,
  fair_night: CloudMoon,
  partlycloudy_day: CloudSun,
  partlycloudy_night: CloudMoon,
  cloudy: Cloud,
  fog: CloudFog,
  lightrain: CloudRain,
  rain: CloudRain,
  heavyrain: CloudRain,
  lightrainshowers_day: CloudRain,
  lightrainshowers_night: CloudRain,
  rainshowers_day: CloudRain,
  rainshowers_night: CloudRain,
  heavyrainshowers_day: CloudRain,
  heavyrainshowers_night: CloudRain,
  lightsleet: Drop,
  sleet: Drop,
  lightsnow: CloudSnow,
  snow: CloudSnow,
  heavysnow: CloudSnow,
  lightsnowshowers_day: CloudSnow,
  lightsnowshowers_night: CloudSnow,
  thunder: CloudLightning,
  rainandthunder: CloudLightning,
  snowandthunder: CloudLightning,
  lightrainandthunder: CloudLightning,
};

interface Props {
  symbolCode: string;
  size?: number;
  className?: string;
}

export default function WeatherIcon({ symbolCode, size = 40, className = "" }: Props) {
  const base = symbolCode.replace(/_day|_night|_polartwilight/, "");
  const IconComponent = symbolMap[symbolCode] ?? symbolMap[base] ?? Cloud;

  return (
    <IconComponent
      size={size}
      weight="thin"
      className={className}
      aria-label={symbolCode}
    />
  );
}
