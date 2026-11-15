import { useEffect, useRef, useState } from "react";
import { AnimateIn } from "./AnimateIn";

const LINES = ["MATTHEW", "KING"] as const;

type FontMode = "blimp-outline" | "blimp-solid" | "roboto-serif";

const FONT_MODES: { id: FontMode; label: string }[] = [
  { id: "blimp-outline", label: "Blimp Outline" },
  { id: "blimp-solid", label: "Blimp Solid" },
  { id: "roboto-serif", label: "Roboto Serif" },
];

// --- Animation & Variable Font Tuning ---
// 1 & 2. OC Blimp (Outline & Solid)
const BASE_PUMP = 200; // Default "pump" at rest (min: 0, max: 500)
const PEAK_PUMP = 400; // Swollen "pump" under cursor
const BASE_BBLE = 0; // Default "bble" at rest (min: 0, max: 100)
const PEAK_BBLE = 100; // Swollen "bble" under cursor
const BASE_FLOT = 0; // Default "flot" at rest (min: 0, max: 300)
const PEAK_FLOT = 150; // Swollen "flot" under cursor

// Whimsical per-letter tilt angles (in degrees) when floating in Blimp modes
// corresponds to M-A-T-T-H-E-W and K-I-N-G
const GLYPH_TILT_ANGLES = [-9, 7, -6, 10, -8, 6, -11, 8, -7, 9, -8];
const TILT_STRENGTH = 1; // Multiplier to dial the tilt intensity up or down

// 3. Roboto Serif (the original Option 1 font)
const BASE_WDTH = 100; // Default width at rest (50..150)
const PEAK_WDTH = 150; // Swollen width under cursor
const BASE_WGHT = 300; // Default weight at rest (100..900)
const PEAK_WGHT = 900; // Swollen weight under cursor
const BASE_OPSZ = 144; // Default optical size at rest (8..144)
const PEAK_OPSZ = 14; // Swollen optical size under cursor
const BASE_GRAD = -20; // Default grade at rest (-50..100)
const PEAK_GRAD = 100; // Swollen grade under cursor

// Shared physics / reach
const RADIUS = 220; // Horizontal cursor reach in px
const ROW_LERP = 0.14; // Smoothness when switching between MATTHEW and KING (0.05 = slow, 0.3 = snappy)
const GLYPH_LERP = 0.16; // Smoothness of individual letter interpolation
const ROW_PAD_Y = 48; // Extra vertical hit-area padding above/below the heading in px

interface GlyphMeta {
  el: HTMLSpanElement | null;
  lineIdx: number;
  tiltAngle: number;
  pump: number;
  bble: number;
  flot: number;
  rot: number;
  wdth: number;
  wght: number;
  opsz: number;
  grad: number;
}

export default function NameCarousel({
  subtitle,
  staggerDelay = 0.05,
}: {
  subtitle: string;
  staggerDelay?: number;
}) {
  const [modeIndex, setModeIndex] = useState(0);
  const currentMode = FONT_MODES[modeIndex];
  const modeRef = useRef<FontMode>(currentMode.id);

  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const glyphsRef = useRef<GlyphMeta[]>(
    LINES.flatMap((line, lineIdx) =>
      line.split("").map((_, charIdx) => {
        const flatIdx = lineIdx === 0 ? charIdx : LINES[0].length + charIdx;
        return {
          el: null,
          lineIdx,
          tiltAngle: GLYPH_TILT_ANGLES[flatIdx % GLYPH_TILT_ANGLES.length],
          pump: BASE_PUMP,
          bble: BASE_BBLE,
          flot: BASE_FLOT,
          rot: 0,
          wdth: BASE_WDTH,
          wght: BASE_WGHT,
          opsz: BASE_OPSZ,
          grad: BASE_GRAD,
        };
      })
    )
  );

  const pointerRef = useRef({
    x: -9999,
    y: -9999,
    active: false,
  });

  // Smoothed 0..1 envelope per row so switching rows never snaps
  const rowStrengthRef = useRef<number[]>([0, 0]);

  useEffect(() => {
    modeRef.current = currentMode.id;
  }, [currentMode.id]);

  useEffect(() => {
    let rafId = 0;

    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      pointerRef.current.active = true;
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);

    const tick = () => {
      const p = pointerRef.current;
      const lineEls = lineRefs.current;
      const rowStrength = rowStrengthRef.current;
      const glyphs = glyphsRef.current;
      const mode = modeRef.current;

      // 1. Determine which single row (if any) owns the cursor right now
      let activeRow = -1;

      if (p.active && lineEls[0] && lineEls[1]) {
        const r0 = lineEls[0].getBoundingClientRect();
        const r1 = lineEls[1].getBoundingClientRect();
        const midY = (r0.bottom + r1.top) * 0.5;
        const maxRight = Math.max(r0.right, r1.right) + RADIUS;
        const minLeft = Math.min(r0.left, r1.left) - RADIUS;

        if (p.x >= minLeft && p.x <= maxRight) {
          if (p.y >= r0.top - ROW_PAD_Y && p.y < midY) {
            activeRow = 0;
          } else if (p.y >= midY && p.y <= r1.bottom + ROW_PAD_Y) {
            activeRow = 1;
          }
        }
      }

      // 2. Smoothly ramp each row's activation envelope (0..1) so row transitions glide
      for (let r = 0; r < LINES.length; r++) {
        const targetRowStrength = r === activeRow ? 1 : 0;
        rowStrength[r] += (targetRowStrength - rowStrength[r]) * ROW_LERP;
      }

      // 3. Update each glyph's variation settings based on active font mode
      for (let i = 0; i < glyphs.length; i++) {
        const g = glyphs[i];
        const el = g.el;
        if (!el) continue;

        const rStrength = rowStrength[g.lineIdx];
        let t = 0;

        if (rStrength > 0.001) {
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width * 0.5;
          const dx = Math.abs(p.x - cx);

          if (dx < RADIUS) {
            const horizCurve = 0.5 * (1 + Math.cos((Math.PI * dx) / RADIUS));
            t = horizCurve * rStrength;
          }
        }

        if (mode === "roboto-serif") {
          const targetWdth = BASE_WDTH + (PEAK_WDTH - BASE_WDTH) * t;
          const targetWght = BASE_WGHT + (PEAK_WGHT - BASE_WGHT) * t;
          const targetOpsz = BASE_OPSZ + (PEAK_OPSZ - BASE_OPSZ) * t;
          const targetGrad = BASE_GRAD + (PEAK_GRAD - BASE_GRAD) * t;

          g.wdth += (targetWdth - g.wdth) * GLYPH_LERP;
          g.wght += (targetWght - g.wght) * GLYPH_LERP;
          g.opsz += (targetOpsz - g.opsz) * GLYPH_LERP;
          g.grad += (targetGrad - g.grad) * GLYPH_LERP;
          g.rot += (0 - g.rot) * GLYPH_LERP;

          el.style.fontVariationSettings = `"wght" ${g.wght.toFixed(1)}, "wdth" ${g.wdth.toFixed(1)}, "opsz" ${g.opsz.toFixed(1)}, "GRAD" ${g.grad.toFixed(1)}`;
          el.style.transform = "rotate(0deg)";
        } else {
          const targetPump = BASE_PUMP + (PEAK_PUMP - BASE_PUMP) * t;
          const targetBble = BASE_BBLE + (PEAK_BBLE - BASE_BBLE) * t;
          const targetFlot = BASE_FLOT + (PEAK_FLOT - BASE_FLOT) * t;
          const targetRot = g.tiltAngle * TILT_STRENGTH * t;

          g.pump += (targetPump - g.pump) * GLYPH_LERP;
          g.bble += (targetBble - g.bble) * GLYPH_LERP;
          g.flot += (targetFlot - g.flot) * GLYPH_LERP;
          g.rot += (targetRot - g.rot) * GLYPH_LERP;

          el.style.fontVariationSettings = `"pump" ${g.pump.toFixed(1)}, "bble" ${g.bble.toFixed(1)}, "flot" ${g.flot.toFixed(1)}`;
          el.style.transform = `rotate(${g.rot.toFixed(2)}deg)`;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, []);

  const cycleFontMode = () => {
    setModeIndex((prev) => (prev + 1) % FONT_MODES.length);
  };

  let charIndex = 0;

  return (
    <div className="hero-section">
      <button
        type="button"
        onClick={cycleFontMode}
        className="debug-font-btn"
      >
        {currentMode.label} ({modeIndex + 1}/{FONT_MODES.length})
      </button>

      <AnimateIn delay={staggerDelay}>
        <h1
          className={`portfolio-name portfolio-name--${currentMode.id}`}
          aria-label="MATTHEW KING"
        >
          {LINES.map((line, lineIdx) => (
            <span
              key={line}
              ref={(el) => {
                lineRefs.current[lineIdx] = el;
              }}
              className="portfolio-name-line"
              aria-hidden="true"
            >
              {line.split("").map((char) => {
                const idx = charIndex++;
                return (
                  <span
                    key={idx}
                    ref={(el) => {
                      glyphsRef.current[idx].el = el;
                    }}
                    className="portfolio-glyph"
                  >
                    {char}
                  </span>
                );
              })}
            </span>
          ))}
        </h1>
      </AnimateIn>

      <AnimateIn delay={staggerDelay * 2}>
        <div className="portfolio-subtitle-row">
          <p className="portfolio-subtitle">{subtitle}</p>
        </div>
      </AnimateIn>
    </div>
  );
}
