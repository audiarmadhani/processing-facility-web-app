"use client";

import { useEffect, useState } from "react";

const DEFAULT_HEIGHT = 500;

function computeHeight() {
  if (typeof window === "undefined") return DEFAULT_HEIGHT;
  const vh = window.innerHeight;
  if (vh < 600) return Math.round(vh * 0.45);
  if (vh < 900) return Math.round(vh * 0.5);
  if (vh < 1200) return Math.round(vh * 0.55);
  return Math.round(vh * 0.6);
}

export default function useResponsiveChartHeight(fallback = DEFAULT_HEIGHT) {
  const [height, setHeight] = useState(fallback);

  useEffect(() => {
    const update = () => setHeight(computeHeight());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return height;
}
