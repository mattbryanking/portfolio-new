import { MotionConfig } from "motion/react";
import Portfolio from "./components/Portfolio";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Portfolio />
    </MotionConfig>
  );
}
