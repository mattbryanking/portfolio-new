import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AnimateIn } from "./AnimateIn";

const FONT_INTERVAL_MS = 2500;
const LOCKED_FONT_INDEX: number | null = null;

interface NameFont {
  family: string;
  scale: number;
  lineHeight: number;
  yOffset: string;
  kerning: Partial<Record<"MA" | "AT" | "TT" | "TH" | "HE" | "EW" | "KI" | "IN" | "NG", number>>;
}

const NAME_FONTS: NameFont[] = [
  { family: '"Sniglet", cursive', scale: 1, lineHeight: 0.9, yOffset: ".05em", kerning: {} },
  { family: '"0xA000-Dots", monospace', scale: 1.05, lineHeight: 0.9, yOffset: "0.1em", kerning: { AT: -0.1, TT: -0.1, TH: -0.05 } },
  { family: '"Isobare-Regular", sans-serif', scale: 1, lineHeight: 0.9, yOffset: "0em", kerning: {} },
  { family: '"Toren-Rotalic", sans-serif', scale: 0.95, lineHeight: 0.9, yOffset: "0.1em", kerning: { MA: 0.05, AT: -0.1, EW: -0.05 } },
  { family: '"BTCSpaceForce", sans-serif', scale: 1, lineHeight: 0.9, yOffset: ".15em", kerning: {} },
  { family: '"Basteleur-Bold", serif', scale: 1, lineHeight: 0.9, yOffset: ".1em", kerning: {} },  
  { family: '"Kikuta", sans-serif', scale: 1, lineHeight: 0.9, yOffset: ".15em", kerning: {} },
  { family: '"BTCGhostWriter-Ink", sans-serif', scale: 1, lineHeight: 0.9, yOffset: ".05em", kerning: {} },
];

function renderKernedWord(word: string, kerning: NameFont["kerning"]) {
  return word.split("").map((char, i) => {
    const pair = i < word.length - 1 ? (`${char}${word[i + 1]}` as keyof NameFont["kerning"]) : null;
    const offset = pair ? kerning[pair] : undefined;
    return (
      <span
        key={i}
        aria-hidden="true"
        style={offset ? { marginRight: `${offset}em` } : undefined}
      >
        {char}
      </span>
    );
  });
}

function getLockedFontIndex(): number | null {
  if (LOCKED_FONT_INDEX !== null) return LOCKED_FONT_INDEX;
  if (typeof window === "undefined") return null;
  const param = new URLSearchParams(window.location.search).get("font");
  if (param === null) return null;
  const parsed = Number(param);
  return Number.isInteger(parsed) && parsed >= 0 && parsed < NAME_FONTS.length ? parsed : null;
}

export default function NameCarousel({
  subtitle,
  staggerDelay = 0.05,
}: {
  subtitle: string;
  staggerDelay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const lockedIndex = getLockedFontIndex();
  const [fontIndex, setFontIndex] = useState(
    () => lockedIndex ?? Math.floor(Math.random() * NAME_FONTS.length),
  );
  const [paused, setPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(() => (typeof document !== "undefined" ? document.hidden : false));

  useEffect(() => {
    NAME_FONTS.forEach((font) => {
      void document.fonts?.load(`48px ${font.family}`, "MATTHEW KING");
    });
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const isPaused = paused || tabHidden || Boolean(prefersReducedMotion) || lockedIndex !== null;

  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(() => {
      setFontIndex((i) => (i + 1) % NAME_FONTS.length);
    }, FONT_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isPaused]);

  const activeFont = NAME_FONTS[lockedIndex ?? fontIndex];

  return (
    <div className="hero-section">
      <AnimateIn delay={staggerDelay}>
        <div className="portfolio-name-slot">
          <AnimatePresence initial={false}>
            <motion.h1
              key={fontIndex}
              className="portfolio-name"
              aria-label="MATTHEW KING"
              initial={prefersReducedMotion ? false : { y: "-115%" }}
              animate={{ y: "0%" }}
              exit={prefersReducedMotion ? undefined : { y: "115%" }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: activeFont.family,
                fontSize: `calc(1em * ${activeFont.scale})`,
                lineHeight: activeFont.lineHeight,
                translateY: activeFont.yOffset,
              }}
            >
              <span>
                {renderKernedWord("MATTHEW", activeFont.kerning)}
                <br />
                {renderKernedWord("KING", activeFont.kerning)}
              </span>
            </motion.h1>
          </AnimatePresence>
        </div>
      </AnimateIn>

      <AnimateIn delay={staggerDelay * 2}>
        <div className="portfolio-subtitle-row">
          <p className="portfolio-subtitle">{subtitle}</p>

          {lockedIndex === null && (
            <button
              type="button"
              className="font-toggle-btn"
              onClick={
                prefersReducedMotion
                  ? () => setFontIndex((i) => (i + 1) % NAME_FONTS.length)
                  : () => setPaused((p) => !p)
              }
              aria-pressed={prefersReducedMotion ? undefined : paused}
              aria-label={
                prefersReducedMotion
                  ? "Next name font"
                  : paused
                    ? "Resume name font animation"
                    : "Pause name font animation"
              }
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                {prefersReducedMotion ? (
                  <>
                    <path d="M2.5 2.2v9.6L9.5 7 2.5 2.2Z" />
                    <rect x="10" y="2.2" width="1.8" height="9.6" />
                  </>
                ) : paused ? (
                  <path d="M3.5 2.2v9.6l8-4.8-8-4.8Z" />
                ) : (
                  <>
                    <rect x="3" y="2.2" width="2.6" height="9.6" />
                    <rect x="8.4" y="2.2" width="2.6" height="9.6" />
                  </>
                )}
              </svg>
            </button>
          )}
        </div>
      </AnimateIn>
    </div>
  );
}
