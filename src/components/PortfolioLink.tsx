import type { CSSProperties } from "react";

const TILTS = ["-6deg", "5deg", "-4deg", "6.5deg", "-5deg", "4.5deg", "-6.5deg", "4deg"];
const LIFTS = ["-0.38em", "-0.26em", "-0.46em", "-0.3em", "-0.42em", "-0.28em"];

export function PortfolioLink({
  children,
  href,
  target,
  showArrow = false,
}: {
  children: string;
  href: string;
  target?: string;
  showArrow?: boolean;
}) {
  let charIndex = 0;
  const words = children.split(" ");

  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      aria-label={children}
      className="portfolio-link"
    >
      {showArrow && (
        <svg
          className="link-arrow"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          <path d="M2.5 9.5L9.5 2.5M3.5 2.5H9.5V8.5" />
        </svg>
      )}
      <span className="link-text" aria-hidden="true">
        {words.map((word, wIdx) => (
          <span key={wIdx} className="link-word">
            {word.split("").map((char) => {
              const i = charIndex++;
              return (
                <span
                  key={i}
                  className="link-char"
                  style={
                    {
                      "--i": i,
                      "--tilt": TILTS[i % TILTS.length],
                      "--lift": LIFTS[i % LIFTS.length],
                    } as CSSProperties
                  }
                >
                  {char}
                </span>
              );
            })}
            {wIdx < words.length - 1 && <span className="link-space">{" "}</span>}
          </span>
        ))}
      </span>
    </a>
  );
}
