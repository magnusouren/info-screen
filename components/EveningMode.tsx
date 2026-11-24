"use client";

import { useEffect } from "react";
import { config } from "@/lib/config";
import { inWindow, toMinutes } from "@/lib/timeWindow";

const FROM = toMinutes(config.layout.evening.from);
const TO = toMinutes(config.layout.evening.to);

/**
 * Inline-skript som setter <html data-evening> før første tegning, så
 * rekkefølgen ikke hopper når siden lastes på kvelden.
 */
export const eveningBootstrap = `
(function () {
  var d = new Date(), n = d.getHours() * 60 + d.getMinutes(), f = ${FROM}, t = ${TO};
  var on = f <= t ? n >= f && n < t : n >= f || n < t;
  if (on) document.documentElement.dataset.evening = "";
})();
`;

function apply() {
  const d = new Date();
  const on = inWindow(d.getHours() * 60 + d.getMinutes(), FROM, TO);
  if (on) document.documentElement.dataset.evening = "";
  else delete document.documentElement.dataset.evening;
}

/** Holder <html data-evening> oppdatert mens siden står åpen. */
export default function EveningMode() {
  useEffect(() => {
    apply();
    const id = setInterval(apply, 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") apply();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
