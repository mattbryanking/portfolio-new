import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AnimateIn } from "./AnimateIn";

const FONT_INTERVAL_MS = 2500;
const DEBUG_FONT_INDEX: number | null = null;

interface NameFont {
  family: string;
  scale: number;
  lineHeight: number;
  yOffset: string;
  letterSpacing: string;
}

const NAME_FONTS: NameFont[] = [
  { family: '"Sniglet", cursive', scale: 1, lineHeight: 0.9, yOffset: "0em", letterSpacing: "0em" },
  { family: '"Super Bugly", sans-serif', scale: 1.1, lineHeight: 0.9, yOffset: "-0.05em", letterSpacing: "0em" },
  { family: '"Toren-Rotalic", sans-serif', scale: 0.95, lineHeight: 0.9, yOffset: "0.1em", letterSpacing: "0em" },
  { family: '"Ghost Terror", sans-serif', scale: 0.9, lineHeight: 1, yOffset: "0.05em", letterSpacing: "0.1em" },
  { family: '"Mezicola", sans-serif', scale: 1, lineHeight: 0.9, yOffset: "0em", letterSpacing: "0em" },
];

export default function NameCarousel({
  subtitle,
  staggerDelay = 0.05,
}: {
  subtitle: string;
  staggerDelay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [fontIndex, setFontIndex] = useState(() => Math.floor(Math.random() * NAME_FONTS.length));
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    NAME_FONTS.forEach((font) => {
      void document.fonts?.load(`48px ${font.family}`, "MATTHEW KING");
    });
  }, []);

  const isPaused = paused || Boolean(prefersReducedMotion) || DEBUG_FONT_INDEX !== null;

  useEffect(() => {
    if (isPaused) return;
    let id: number | undefined;

    const syncTimer = () => {
      window.clearInterval(id);
      if (!document.hidden) {
        id = window.setInterval(() => {
          setFontIndex((i) => (i + 1) % NAME_FONTS.length);
        }, FONT_INTERVAL_MS);
      }
    };

    syncTimer();
    document.addEventListener("visibilitychange", syncTimer);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", syncTimer);
    };
  }, [isPaused]);

  const activeFont = NAME_FONTS[DEBUG_FONT_INDEX ?? fontIndex];

  return (
    <div className="hero-section">
      <AnimateIn delay={staggerDelay}>
        <h1 className="portfolio-name-slot" aria-label="MATTHEW KING">
          <AnimatePresence initial={false}>
            <motion.div
              key={DEBUG_FONT_INDEX !== null ? "debug" : fontIndex}
              className="portfolio-name"
              aria-hidden="true"
              initial={prefersReducedMotion ? false : { y: "-100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { y: "100%", opacity: 0 }}
              transition={{
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span
                className="portfolio-name-text"
                style={{
                  fontFamily: activeFont.family,
                  fontSize: `${activeFont.scale}em`,
                  lineHeight: activeFont.lineHeight,
                  letterSpacing: activeFont.letterSpacing,
                  transform: `translateY(${activeFont.yOffset})`,
                }}
              >
                {"MATTHEW\nKING"}
              </span>
            </motion.div>
          </AnimatePresence>
        </h1>
      </AnimateIn>

      <AnimateIn delay={staggerDelay * 2}>
        <div className="portfolio-subtitle-row">
          <p className="portfolio-subtitle">{subtitle}</p>

          <button
            type="button"
            className="font-toggle-btn"
            onClick={(e) => {
              if (!prefersReducedMotion) {
                e.currentTarget.animate(
                  [
                    { scale: "1", easing: "ease-out" },
                    { scale: "0.91", offset: 0.35, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
                    { scale: "1" },
                  ],
                  { duration: 320 },
                );
              }
              if (prefersReducedMotion) {
                setFontIndex((i) => (i + 1) % NAME_FONTS.length);
              } else {
                setPaused((p) => !p);
              }
            }}
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
        </div>
      </AnimateIn>
    </div>
  );
}
