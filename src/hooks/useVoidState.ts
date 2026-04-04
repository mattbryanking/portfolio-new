import { useCallback, useRef } from "react";

export interface VoidState {
  x: number;
  y: number;
  radius: number;
  active: boolean;
  expanding: boolean;
  done: boolean;
}

export const IDLE_RADIUS = 100;
const EXPAND_DURATION = 1400;
const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);

export function useVoidState(onDone: () => void) {
  const state = useRef<VoidState>({
    x: -9999,
    y: -9999,
    radius: IDLE_RADIUS,
    active: false,
    expanding: false,
    done: false,
  });
  const expandStart = useRef(0);
  const expandTo = useRef(0);

  const maxRadius = (x: number, y: number) => {
    const w = window.innerWidth,
      h = window.innerHeight;
    return Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
  };

  const startExpand = useCallback(() => {
    const s = state.current;
    if (s.expanding || s.done) return;
    s.expanding = true;
    expandStart.current = performance.now();
    expandTo.current = maxRadius(s.x, s.y) + 50;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const s = state.current;
    if (s.expanding || s.done) return;
    s.x = e.clientX;
    s.y = e.clientY;
    s.active = true;
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const s = state.current;
      s.x = e.clientX;
      s.y = e.clientY;
      startExpand();
    },
    [startExpand],
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      startExpand();
    },
    [startExpand],
  );

  const firedOnDone = useRef(false);

  const tick = useCallback(
    (now: number) => {
      const s = state.current;
      if (!s.expanding || s.done) return;
      const t = Math.min((now - expandStart.current) / EXPAND_DURATION, 1);
      s.radius = IDLE_RADIUS + (expandTo.current - IDLE_RADIUS) * easeInOutQuart(t);
      if (!firedOnDone.current && t >= 0.4) {
        firedOnDone.current = true;
        onDone();
      }
      if (t >= 1) {
        s.done = true;
        s.expanding = false;
      }
    },
    [onDone],
  );

  return { state, handleMouseMove, handleClick, handleTouchStart, tick };
}
