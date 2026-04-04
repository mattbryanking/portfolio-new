import { useState } from "react";
import VideoTextGrid from "./components/VideoTextGrid";
import Portfolio from "./components/Portfolio";

export default function App() {
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [invertVoid, setInvertVoid] = useState(false);

  return (
    <>
      <VideoTextGrid videoSrc="/metalheart.mp4" onComplete={() => setShowPortfolio(true)} invertVoid={invertVoid} />
      {showPortfolio && <Portfolio onAnimationDone={() => setInvertVoid(true)} />}
    </>
  );
}
