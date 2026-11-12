import { AnimateIn } from "./AnimateIn";
import NameCarousel from "./NameCarousel";
import { PortfolioLink } from "./PortfolioLink";

const STAGGER_DELAY = 0.05;

interface Project {
  label: string;
  url: string;
}

export default function Portfolio() {
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
    { label: "[resume]", url: "/2025_resume.pdf" },
    { label: "[GitHub]", url: "https://github.com/mattbryanking" },
    { label: "[LinkedIn]", url: "https://www.linkedin.com/in/matthewbryanking/" },
    { label: "[email me]", url: "mailto: matthewbrking@gmail.com" },
  ];

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />

      <main className="portfolio">
        <div className="portfolio-inner">
          <NameCarousel
            subtitle="software developer based in Detroit, MI."
            staggerDelay={STAGGER_DELAY}
          />

          <div className="portfolio-grid">
            <section className="portfolio-section">
              <AnimateIn delay={STAGGER_DELAY * 4}>
                <h2 className="portfolio-header">PROJECTS</h2>
              </AnimateIn>

              {projects.map((project, i) => (
                <AnimateIn key={project.label} delay={STAGGER_DELAY * (5 + i)}>
                  <div className="portfolio-text">
                    <PortfolioLink target="_blank" href={project.url}>
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
                  <PortfolioLink href="https://www.globalpayments.com/genius" target="_blank">
                    {"[Global Payments]"}
                  </PortfolioLink>
                </div>
              </AnimateIn>

              <AnimateIn delay={STAGGER_DELAY * 10}>
                <div className="portfolio-text">
                  b.s. in computer science &
                  <br />
                  minor in psychology from{" "}
                  <br />
                  <PortfolioLink href="https://www.gvsu.edu/computing/computer-science-bs-170" target="_blank">
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
                    <PortfolioLink target="_blank" href={link.url}>
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
