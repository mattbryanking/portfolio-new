import { useEffect, useState } from "react";
import { motion } from "motion/react";

const STAGGER_DELAY = 0.05;

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

interface Project {
  label: string;
  url: string;
}

const AnimateIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{ willChange: "transform, opacity" }}
  >
    {children}
  </motion.div>
);

const PortfolioLink = ({
  children,
  href,
  target,
  canHover,
}: {
  children: React.ReactNode;
  href: string;
  target?: string;
  canHover: boolean;
}) => {
  const renderContent = () => {
    if (typeof children === "string" && children.startsWith("[") && children.endsWith("]")) {
      return (
        <>
          <span className="link-bracket">[</span>
          {children.slice(1, -1)}
          <span className="link-bracket">]</span>
        </>
      );
    }
    return children;
  };

  if (!canHover) {
    return (
      <a href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined} className="portfolio-link">
        <span>{renderContent()}</span>
      </a>
    );
  }

  return (
    <motion.a href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined} className="portfolio-link" initial="initial" whileHover="hover">
      <span>{renderContent()}</span>
      <motion.div
        className="reveal-block"
        aria-hidden="true"
        variants={{
          initial: { width: 0 },
          hover: { width: "100%" },
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        <span className="reveal-text">{renderContent()}</span>
      </motion.div>
    </motion.a>
  );
};

export default function Portfolio() {
  const canHover = useCanHover();
  const projects: Project[] = [
    {
      label: "[consoleify]",
      url: "https://github.com/mattbryanking/ConsoleifyCLI",
    },
    {
      label: "[native iOS camera clone]",
      url: "https://github.com/mattbryanking/iOSCameraClone",
    },
    {
      label: "[raycasting arena]",
      url: "https://github.com/mattbryanking/ARENA",
    },
  ];

  const links = [
    { label: "[email me]", url: "mailto: matthewbrking@gmail.com" },
    { label: "[GitHub]", url: "https://github.com/mattbryanking" },
    { label: "[LinkedIn]", url: "https://www.linkedin.com/in/matthewbryanking/" },
    { label: "[resume]", url: "/2025_resume.pdf" },
  ];

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />

      <main className="portfolio">
        <div className="portfolio-inner">
          <AnimateIn delay={STAGGER_DELAY}>
            <h1 className="portfolio-name">MATTHEW KING</h1>
          </AnimateIn>

          <AnimateIn delay={STAGGER_DELAY * 2}>
            <p className="portfolio-subtitle">
              software developer based in Detroit, MI.
            </p>
          </AnimateIn>

          <div className="portfolio-grid">
            <section className="portfolio-section">
              <AnimateIn delay={STAGGER_DELAY * 4}>
                <h2 className="portfolio-header">PROJECTS</h2>
              </AnimateIn>

              {projects.map((project, i) => (
                <AnimateIn key={project.label} delay={STAGGER_DELAY * (5 + i)}>
                  <div className="portfolio-text">
                    <PortfolioLink target="_blank" href={project.url} canHover={canHover}>
                      {project.label}
                    </PortfolioLink>
                  </div>
                </AnimateIn>
              ))}
            </section>

            <section className="portfolio-section">
              <AnimateIn delay={STAGGER_DELAY * 8}>
                <h2 className="portfolio-header">EXPERIENCE</h2>
              </AnimateIn>

              <AnimateIn delay={STAGGER_DELAY * 9}>
                <div className="portfolio-text">
                  currently building things at{" "}
                  <PortfolioLink href="https://www.globalpayments.com/genius" target="_blank" canHover={canHover}>
                    {"[Global Payments]"}
                  </PortfolioLink>
                </div>
              </AnimateIn>

              <AnimateIn delay={STAGGER_DELAY * 10}>
                <div className="portfolio-text">
                  b.s. in computer science &
                  <br/>
                  minor in psychology from{" "}
                  <br/>
                  <PortfolioLink href="https://www.gvsu.edu/computing/computer-science-bs-170" target="_blank" canHover={canHover}>
                    {"[Grand Valley State University]"}
                  </PortfolioLink>
                </div>
              </AnimateIn>
            </section>

            <section className="portfolio-section">
              <AnimateIn delay={STAGGER_DELAY * 11}>
                <h2 className="portfolio-header">LINKS</h2>
              </AnimateIn>

              {links.map((link, i) => (
                <AnimateIn key={link.label} delay={STAGGER_DELAY * (12 + i)}>
                  <div className="portfolio-text">
                    <PortfolioLink target="_blank" href={link.url} canHover={canHover}>
                      {link.label}
                    </PortfolioLink>
                  </div>
                </AnimateIn>
              ))}
            </section>

            <section className="portfolio-section">
              <AnimateIn delay={STAGGER_DELAY * 16}>
                <h2 className="portfolio-header">ABOUT</h2>
              </AnimateIn>

              <AnimateIn delay={STAGGER_DELAY * 17}>
                <p className="portfolio-text">
                  i spent my time at GVSU writing software and obsessing over how people interact with it. currently working on software for restaurants and hospitality. find me tinkering with retro hardware and playing skateboarding games                
                </p>
              </AnimateIn>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
