"use client";

import dynamic from "next/dynamic";
import { LightningIcon as Lightning } from "@phosphor-icons/react";
import Skeleton from "./Skeleton";

const ElectricityPrice = dynamic(() => import("./ElectricityPrice"), {
  ssr: false,
  loading: () => (
    <div>
      <div className="flex items-center gap-2 text-xs text-text-3 uppercase tracking-widest mb-2">
        <Lightning size={13} weight="light" />
        Strøm
      </div>
      <ul className="space-y-1.5">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-8 ml-auto" />
          </li>
        ))}
      </ul>
    </div>
  ),
});

export default function ElectricityPriceClient() {
  return <ElectricityPrice />;
}
