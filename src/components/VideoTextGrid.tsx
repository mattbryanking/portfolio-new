import { useCallback, useEffect, useRef } from "react";
import { useVoidState, IDLE_RADIUS } from "../hooks/useVoidState";
import { initWebGL } from "../utils/webgl";
import { STAGGER, buildTextCanvas } from "../utils/textGrid";

const OVERLAY_FADE = 400;
const LABEL_RADIUS_RATIO = 0.7;
const LABEL_ROTATION_SPEED = 0.0004;
const TAU = 2 * Math.PI;
const IS_TOUCH = () => "ontouchstart" in window || navigator.maxTouchPoints > 0;

function sizeCanvas(c: HTMLCanvasElement, w: number, h: number, dpr: number) {
  c.width = w * dpr;
  c.height = h * dpr;
  c.style.width = w + "px";
  c.style.height = h + "px";
}

interface VideoTextGridProps {
  videoSrc: string;
  onComplete: () => void;
  invertVoid?: boolean;
}

export default function VideoTextGrid({ videoSrc, onComplete, invertVoid = false }: VideoTextGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef(0);
  const glRef = useRef<ReturnType<typeof initWebGL> | null>(null);
  const fadeStart = useRef<number | null>(null);
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const invertStartTime = useRef<number | null>(null);
  const INVERT_FADE_DURATION = 800;

  const { state: voidState, handleMouseMove, handleClick, handleTouchStart, tick } = useVoidState(onComplete);

  const buildTextTexture = useCallback(() => {
    const state = glRef.current;
    if (!state) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth,
      h = window.innerHeight;
    const { canvas: tc, charWidth, fontSize } = buildTextCanvas(w, h, dpr);

    sizeCanvas(canvasRef.current!, w, h, dpr);
    sizeCanvas(overlayRef.current!, w, h, dpr);

    const { gl, textTex, uniforms } = state;
    gl.viewport(0, 0, w * dpr, h * dpr);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc);
    gl.uniform2f(uniforms.uResolution, w, h);
    gl.uniform2f(uniforms.uCellSize, charWidth, fontSize);
    gl.uniform1f(uniforms.uStagger, charWidth * STAGGER);
  }, []);

  const render = useCallback(
    (now: number) => {
      const st = glRef.current,
        video = videoRef.current;
      if (!st || !video) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const { gl, videoTex, uniforms } = st;

      if (invertVoid) {
        // inverted mode: only letters inside void render, fading in from black
        if (invertStartTime.current === null) invertStartTime.current = now;
        // stay just above 0 to avoid flash of normal mask
        const fadeProgress = Math.min(1, Math.max(0.001, (now - invertStartTime.current) / INVERT_FADE_DURATION));

        gl.uniform1f(uniforms.uInvertVoid, fadeProgress);
        if (video.readyState >= 2) {
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, videoTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          gl.uniform1f(uniforms.uVideoAspect, video.videoWidth / video.videoHeight);
        }
        const mp = mousePos.current;
        if (IS_TOUCH()) {
          // no void on mobile, just the ambient grid
          gl.uniform3f(uniforms.uVoid, -9999, -9999, 0);
        } else {
          gl.uniform3f(uniforms.uVoid, mp.x, mp.y, IDLE_RADIUS * 0.55);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      // Normal mode
      tick(now);
      gl.uniform1f(uniforms.uInvertVoid, 0.0);
      const vs = voidState.current;

      if (vs.done) {
        const o = overlayRef.current;
        if (o) o.getContext("2d")!.clearRect(0, 0, o.width, o.height);
        return;
      }

      if (video.readyState >= 2) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, videoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.uniform1f(uniforms.uVideoAspect, video.videoWidth / video.videoHeight);
      }

      const [vx, vy, vr] = vs.active ? [vs.x, vs.y, vs.radius] : [-9999, -9999, 0];
      gl.uniform3f(uniforms.uVoid, vx, vy, vr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // overlay label
      const overlay = overlayRef.current;
      if (overlay) {
        const octx = overlay.getContext("2d")!;
        octx.clearRect(0, 0, overlay.width, overlay.height);

        if (vs.active && !vs.done) {
          if (vs.expanding && fadeStart.current === null) fadeStart.current = now;
          let alpha = 0.9;
          if (fadeStart.current !== null) alpha = 0.9 * Math.max(0, 1 - (now - fadeStart.current) / OVERLAY_FADE);

          if (alpha > 0.001) {
            const dpr = window.devicePixelRatio || 1;
            octx.save();
            octx.scale(dpr, dpr);
            const labelText = IS_TOUCH() ? "tap to enter" : "click to enter";
            const label = `${labelText}  ${labelText} `;
            const labelRadius = vs.radius * LABEL_RADIUS_RATIO;
            const rotation = now * LABEL_ROTATION_SPEED;
            const angleStep = TAU / label.length;

            octx.font = `20px 'JetBrains Mono', monospace`;
            octx.fillStyle = `rgba(100, 160, 255, ${alpha})`;
            octx.textBaseline = "middle";

            for (let i = 0; i < label.length; i++) {
              const angle = rotation + i * angleStep;
              octx.save();
              octx.translate(vs.x + Math.cos(angle) * labelRadius, vs.y + Math.sin(angle) * labelRadius);
              octx.rotate(angle + Math.PI / 2);
              octx.fillText(label[i], 0, 0);
              octx.restore();
            }
            octx.restore();
          }
        }
      }

      rafRef.current = requestAnimationFrame(render);
    },
    [tick, voidState, invertVoid],
  );

  useEffect(() => {
    const canvas = canvasRef.current!;
    glRef.current = initWebGL(canvas);
    buildTextTexture();

    // track mouse position so inverted mode has it ready
    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    if (invertVoid) {
      // rebuild on resize
      var onResize = () => {
        buildTextTexture();
      };
      window.addEventListener("resize", onResize);
    } else {
      // normal mode: void interaction
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("click", handleClick);
      canvas.addEventListener("touchstart", handleTouchStart, { passive: false });

      const centerVoid = () => {
        const s = voidState.current;
        if (!IS_TOUCH() || s.expanding || s.done) return;
        s.x = window.innerWidth / 2;
        s.y = window.innerHeight / 2;
        s.active = true;
      };
      if (IS_TOUCH()) centerVoid();

      var onResize = () => {
        buildTextTexture();
        centerVoid();
      };
      window.addEventListener("resize", onResize);
    }

    videoRef.current!.play().catch(() => {});
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      if (onResize) window.removeEventListener("resize", onResize);
      if (!invertVoid) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("click", handleClick);
        canvas.removeEventListener("touchstart", handleTouchStart);
      }
    };
  }, [buildTextTexture, handleMouseMove, handleClick, handleTouchStart, render, invertVoid]);

  return (
    <>
      <video ref={videoRef} src={videoSrc} loop muted playsInline className="video-hidden" />
      <canvas ref={canvasRef} className="fullscreen canvas-main" />
      <canvas ref={overlayRef} className="fullscreen canvas-overlay" />
    </>
  );
}
