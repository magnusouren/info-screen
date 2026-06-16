"use client";

import dynamic from "next/dynamic";

const ElectricityPrice = dynamic(() => import("./ElectricityPrice"), {
  ssr: false,
  loading: () => (
    <div className="text-zinc-700 text-sm animate-pulse">Laster priser…</div>
  ),
});

export default function ElectricityPriceClient() {
  return <ElectricityPrice />;
}
