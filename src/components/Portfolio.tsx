import { motion } from "motion/react";

const STAGGER_DELAY = 0.05;

interface PortfolioProps {
  onAnimationDone: () => void;
}

interface Project {
  label: string;
  url: string;
}

const AnimateIn = ({
  children,
  delay = 0,
  onComplete,
}: {
  children: React.ReactNode;
  delay?: number;
  onComplete?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    onAnimationComplete={onComplete}
  >
    {children}
  </motion.div>
);

const PortfolioLink = ({ children, href, target }: { children: React.ReactNode; href: string; target?: string }) => {
  return (
    <span className="portfolio-link-wrap">
      <motion.a href={href} target={target} className="portfolio-link" initial="initial" whileHover="hover">
        <span>{children}</span>
        <motion.div
          className="reveal-block"
          variants={{
            initial: { width: 0 },
            hover: { width: "100%" },
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <span className="reveal-text">{children}</span>
        </motion.div>
      </motion.a>
    </span>
  );
};



export default function Portfolio({ onAnimationDone }: PortfolioProps) {

  const projects: Project[] = [
    {
      label: "[consoleify]",
      url: "https://github.com/mattbryanking/ConsoleifyCLI",
    },
    {
      label: "[native ios camera clone]",
      url: "https://github.com/mattbryanking/iOSCameraClone",
    },
    {
      label: "[raycasting arena]",
      url: "https://github.com/mattbryanking/ARENA",
    },
  ];
  const links = [
    { label: "[email me]", url: "mailto: matthewbrking@gmail.com" },
    { label: "[github]", url: "https://github.com/mattbryanking" },
    { label: "[linkedin]", url: "https://www.linkedin.com/in/matthewbryanking/" },
    { label: "[resume]", url: "/2025_resume.pdf" },
  ];

  return (
    <div className="portfolio">
      <AnimateIn delay={0}>
        <div className="portfolio-text">my name is</div>
      </AnimateIn>

      <AnimateIn delay={STAGGER_DELAY}>
        <div className="portfolio-name">MATTHEW KING</div>
      </AnimateIn>

      <AnimateIn delay={STAGGER_DELAY * 2} onComplete={onAnimationDone}>
        <div className="portfolio-text">
          a software developer
          <br />
          based in Detroit, MI.
        </div>
      </AnimateIn>

      <AnimateIn delay={STAGGER_DELAY * 3}>
        <div className="portfolio-divider" />
      </AnimateIn>

      {/* projects */}
      <AnimateIn delay={STAGGER_DELAY * 4}>
        <div className="portfolio-header">PROJECTS</div>
      </AnimateIn>

      {projects.map((project, i) => (
        <AnimateIn key={project.label} delay={STAGGER_DELAY * (5 + i)}>
          <div className="portfolio-text portfolio-project">
            <PortfolioLink target="_blank" href={project.url}>
              {project.label}
            </PortfolioLink>
          </div>
        </AnimateIn>
      ))}



      <AnimateIn delay={STAGGER_DELAY * 8}>
        <div className="portfolio-divider" />
      </AnimateIn>

      {/* experience */}
      <AnimateIn delay={STAGGER_DELAY * 9}>
        <div className="portfolio-header">EXPERIENCE</div>
      </AnimateIn>

      <AnimateIn delay={STAGGER_DELAY * 10}>
        <div className="portfolio-text">
          currently building things at{" "}
          <PortfolioLink href="https://www.globalpayments.com/genius" target="_blank">
            {"[Global Payments]"}
          </PortfolioLink>
        </div>
      </AnimateIn>

      <AnimateIn delay={STAGGER_DELAY * 11}>
        <div className="portfolio-text">
          b.s. in computer science from{" "}
          <PortfolioLink href="https://www.gvsu.edu/computing/computer-science-bs-170" target="_blank">
            {"[Grand Valley State University]"}
          </PortfolioLink>
        </div>
      </AnimateIn>

      <AnimateIn delay={STAGGER_DELAY * 12}>
        <div className="portfolio-divider" />
      </AnimateIn>

      <AnimateIn delay={STAGGER_DELAY * 13}>
        <div className="portfolio-header">LINKS</div>
      </AnimateIn>

      {links.map((link, i) => (
        <AnimateIn key={link.label} delay={STAGGER_DELAY * (14 + i)}>
          <div className="portfolio-text">
            <PortfolioLink target="_blank" href={link.url}>
              {link.label}
            </PortfolioLink>
          </div>
        </AnimateIn>
      ))}

      <AnimateIn delay={STAGGER_DELAY * 18}>
        <div className="portfolio-divider" />
      </AnimateIn>

      <AnimateIn delay={STAGGER_DELAY * 19}>
        <div className="portfolio-header">ABOUT</div>
      </AnimateIn>

      <AnimateIn delay={STAGGER_DELAY * 20}>
        <div className="portfolio-text">
          i spent my time at GVSU studying the intersection of computer science and psychology to understand how people
          interact with digital tools. right now, i'm applying that knowledge to facilitate meaningful user experiences
          in the fintech industry. when i'm not coding, you can find me playing old tony hawk games, making a mess on
          the stove, or tinkering with niche hardware.
        </div>
      </AnimateIn>
    </div>
  );
}
