import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

interface HoveredTarget {
  el: HTMLElement;
  rect: DOMRect;
}

const SPRING_POS = { damping: 36, stiffness: 620, mass: 0.2 };
const SPRING_MORPH = { damping: 28, stiffness: 420, mass: 0.4 };

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<HoveredTarget | null>(null);
  const [pressed, setPressed] = useState(false);

  const hoveredRef = useRef<HoveredTarget | null>(null);
  const mousePos = useRef({ x: -100, y: -100 });

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const frameTargetX = useMotionValue(-100);
  const frameTargetY = useMotionValue(-100);

  const frameX = useSpring(frameTargetX, SPRING_POS);
  const frameY = useSpring(frameTargetY, SPRING_POS);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateEnabled = () => setEnabled(media.matches);
    updateEnabled();
    media.addEventListener("change", updateEnabled);
    return () => media.removeEventListener("change", updateEnabled);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let hasMoved = false;

    const updateFramePosition = (x: number, y: number, currentHover: HoveredTarget | null) => {
      if (currentHover) {
        const { left, top, width, height } = currentHover.rect;
        const cx = left + width / 2;
        const cy = top + height / 2;
        frameTargetX.set(cx + (x - cx) * 0.14);
        frameTargetY.set(cy + (y - cy) * 0.14);
      } else {
        frameTargetX.set(x);
        frameTargetY.set(y);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!hasMoved) {
        hasMoved = true;
        mouseX.jump(e.clientX);
        mouseY.jump(e.clientY);
        frameTargetX.jump(e.clientX);
        frameTargetY.jump(e.clientY);
      } else {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
        updateFramePosition(e.clientX, e.clientY, hoveredRef.current);
      }
      setVisible(true);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest("a, button") as HTMLElement | null;
      if (target) {
        const next: HoveredTarget = {
          el: target,
          rect: target.getBoundingClientRect(),
        };
        hoveredRef.current = next;
        setHovered(next);
        updateFramePosition(mousePos.current.x, mousePos.current.y, next);
      } else if (hoveredRef.current) {
        hoveredRef.current = null;
        setHovered(null);
        updateFramePosition(mousePos.current.x, mousePos.current.y, null);
      }
    };

    const onScroll = () => {
      const current = hoveredRef.current;
      if (!current) return;
      const rect = current.el.getBoundingClientRect();
      const updated = { ...current, rect };
      hoveredRef.current = updated;
      setHovered(updated);
      updateFramePosition(mousePos.current.x, mousePos.current.y, updated);
    };

    const onMouseDown = () => setPressed(true);
    const onMouseUp = () => setPressed(false);
    const onMouseLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseOver);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [enabled, mouseX, mouseY, frameTargetX, frameTargetY]);

  if (!enabled) return null;

  const isHovering = hovered !== null;
  const boxWidth = hovered ? hovered.rect.width + 20 : 12;
  const boxHeight = hovered ? hovered.rect.height + 12 : 12;

  return (
    <>
      <motion.div
        className="custom-cursor"
        aria-hidden="true"
        style={{
          x: frameX,
          y: frameY,
        }}
        animate={{
          opacity: visible && isHovering ? 1 : 0,
          scale: pressed && isHovering ? 0.94 : 1,
        }}
        transition={{ duration: 0.14 }}
      >
        <motion.div
          className="custom-cursor-frame"
          style={{ x: "-50%", y: "-50%" }}
          animate={{
            width: boxWidth,
            height: boxHeight,
          }}
          transition={SPRING_MORPH}
        >
          <span className="cursor-bracket cursor-bracket--tl" />
          <span className="cursor-bracket cursor-bracket--tr" />
          <span className="cursor-bracket cursor-bracket--bl" />
          <span className="cursor-bracket cursor-bracket--br" />
        </motion.div>
      </motion.div>

      <motion.div
        className="custom-cursor custom-cursor--dot-layer"
        aria-hidden="true"
        style={{
          x: mouseX,
          y: mouseY,
        }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: pressed ? 0.78 : 1,
        }}
        transition={{ duration: 0.14 }}
      >
        <motion.span
          className="custom-cursor-dot"
          style={{ x: "-50%", y: "-50%" }}
          animate={{
            backgroundColor: isHovering ? "#0038ff" : "#ffffff",
            scale: isHovering ? 0.75 : 1,
          }}
          transition={{ duration: 0.15 }}
        />
      </motion.div>
    </>
  );
}
