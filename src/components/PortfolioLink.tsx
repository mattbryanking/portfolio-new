import { useEffect, useState } from "react";
import { motion } from "motion/react";

function useCanHover() {
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return canHover;
}

export function PortfolioLink({
  children,
  href,
  target,
}: {
  children: React.ReactNode;
  href: string;
  target?: string;
}) {
  const canHover = useCanHover();
  const content =
    typeof children === "string" && children.startsWith("[") && children.endsWith("]") ? (
      <>
        <span className="link-bracket">[</span>
        {children.slice(1, -1)}
        <span className="link-bracket">]</span>
      </>
    ) : (
      children
    );

  if (!canHover) {
    return (
      <a href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined} className="portfolio-link">
        <span>{content}</span>
      </a>
    );
  }

  return (
    <motion.a href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined} className="portfolio-link" initial="initial" whileHover="hover">
      <span>{content}</span>
      <motion.div
        className="reveal-block"
        aria-hidden="true"
        variants={{
          initial: { width: 0 },
          hover: { width: "100%" },
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        <span className="reveal-text">{content}</span>
      </motion.div>
    </motion.a>
  );
}
