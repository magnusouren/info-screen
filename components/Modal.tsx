"use client";

import { useEffect, useState, type ReactNode } from "react";

const EXIT_MS = 200;
const ENTER_MS = 320;

/** iOS sheet present/dismiss curves — approximate a critically damped spring
 *  (damping 1.0) without pulling in an animation library. */
const ENTER_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const EXIT_EASE = "cubic-bezier(0.32, 0, 0.67, 0)";

export default function Modal({
  onClose,
  panelClassName = "max-w-xl max-h-[85vh]",
  children,
}: {
  onClose: () => void;
  panelClassName?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setVisible(false);
    setTimeout(onClose, EXIT_MS);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-8 bg-black/70 backdrop-blur-sm transition-opacity ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ transitionDuration: `${visible ? ENTER_MS : EXIT_MS}ms` }}
      onClick={close}
    >
      <div
        className={`bg-surface border border-border rounded-2xl w-full shadow-2xl flex flex-col transition-[opacity,transform] motion-reduce:transition-opacity ${
          visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-3 motion-reduce:scale-100 motion-reduce:translate-y-0"
        } ${panelClassName}`}
        style={{
          transitionDuration: `${visible ? ENTER_MS : EXIT_MS}ms`,
          transitionTimingFunction: visible ? ENTER_EASE : EXIT_EASE,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children(close)}
      </div>
    </div>
  );
}
