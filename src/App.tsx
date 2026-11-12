import { MotionConfig } from "motion/react";
import Portfolio from "./components/Portfolio";
import CustomCursor from "./components/CustomCursor";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <CustomCursor />
      <Portfolio />
    </MotionConfig>
  );
}
