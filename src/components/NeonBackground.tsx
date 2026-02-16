"use client";

import { useEffect, useRef } from "react";

export function NeonBackground() {
  const bgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const smooth = { x: target.x, y: target.y };

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
    };

    let raf = 0;
    const render = () => {
      smooth.x += (target.x - smooth.x) * 0.08;
      smooth.y += (target.y - smooth.y) * 0.08;
      bg.style.setProperty("--mx", `${smooth.x}px`);
      bg.style.setProperty("--my", `${smooth.y}px`);
      raf = window.requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", onMove);
    raf = window.requestAnimationFrame(render);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={bgRef}
      className="fixed inset-0 -z-10 opacity-90 pointer-events-none"
      style={{
        background:
          "radial-gradient(600px 320px at var(--mx) var(--my), rgba(34,211,238,0.2), transparent 70%), radial-gradient(520px 300px at 80% 20%, rgba(168,85,247,0.16), transparent 70%), radial-gradient(520px 360px at 20% 80%, rgba(244,114,182,0.14), transparent 70%)",
      }}
      aria-hidden="true"
    />
  );
}
