"use client";

import { useEffect, useRef, useState } from "react";
import { useSpring, useMotionValue } from "framer-motion";

export function NeonCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);
  const [isClient, setIsClient] = useState(false);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const trailX = useMotionValue(0);
  const trailY = useMotionValue(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const cursor = cursorRef.current;
    const trail = trailRef.current;
    if (!cursor || !trail) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

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
      
      // Update motion values for smooth animation
      cursorX.set(target.x);
      cursorY.set(target.y);
      trailX.set(target.x);
      trailY.set(target.y);
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
    };
  }, [isClient, cursorX, cursorY, trailX, trailY]);

  // Animate cursor position with spring
  const cursorStyle = useSpring({
    x: cursorX as any,
    y: cursorY as any,
  });

  const trailStyle = useSpring({
    x: trailX as any,
    y: trailY as any,
  });

  if (!isClient) {
    return null;
  }

  return (
    <>
      <div 
        ref={trailRef} 
        className="neon-cursor-trail"
        style={{
          transform: (trailStyle as any).to((x: any, y: any) => `translate3d(${x}px, ${y}px, 0)`),
        }}
      />
      <div 
        ref={cursorRef} 
        className="neon-cursor"
        style={{
          transform: (cursorStyle as any).to((x: any, y: any) => `translate3d(${x}px, ${y}px, 0)`),
          opacity: isClient ? 1 : 0,
        }}
      />
    </>
  );
}
