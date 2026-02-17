"use client";

import { useEffect, useRef, useState } from "react";

export function NeonCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trailPosition, setTrailPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const cursor = cursorRef.current;
    const trail = trailRef.current;
    if (!cursor || !trail) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { x: target.x, y: target.y };
    const trailPos = { x: target.x, y: target.y };

    const setHover = (hover: boolean) => {
      cursor.classList.toggle("hover", hover);
    };

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const hover =
        !!el &&
        (el.closest("button, a, input, textarea, select, [role='button'], img") != null ||
          el.getAttribute("data-cursor") === "hover");
      setHover(hover);
      const neon = el?.closest("[data-neon]")?.getAttribute("data-neon");
      const color = neon || "#22d3ee";
      cursor.style.setProperty("--cursor-color", color);
      trail.style.setProperty("--cursor-color", color);
      
      // Update position state
      setPosition({ x: target.x, y: target.y });
      setTrailPosition({ x: target.x, y: target.y });
    };

    let raf = 0;
    const render = () => {
      pos.x += (target.x - pos.x) * 0.3;
      pos.y += (target.y - pos.y) * 0.3;
      trailPos.x += (target.x - trailPos.x) * 0.12;
      trailPos.y += (target.y - trailPos.y) * 0.12;
      cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      trail.style.transform = `translate3d(${trailPos.x}px, ${trailPos.y}px, 0)`;
      raf = window.requestAnimationFrame(render);
    };
    raf = window.requestAnimationFrame(render);

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(raf);
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div 
        ref={trailRef} 
        className="neon-cursor-trail"
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          transform: `translate3d(${trailPosition.x}px, ${trailPosition.y}px, 0)`,
        }}
      />
      <div 
        ref={cursorRef} 
        className="neon-cursor"
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          opacity: mounted ? 1 : 0,
        }}
      />
    </>
  );
}
