import { useCallback, useEffect, useRef } from "react";
import { useCursorState, IDLE_RADIUS } from "../hooks/useCursorState";
import { initWebGL } from "../utils/webgl";
import { STAGGER, buildTextCanvas } from "../utils/textGrid";


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
  invertCursor?: boolean;
}

export default function VideoTextGrid({ videoSrc, onComplete, invertCursor = false }: VideoTextGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef(0);
  const glRef = useRef<ReturnType<typeof initWebGL> | null>(null);
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const invertStartTime = useRef<number | null>(null);
  const INVERT_FADE_DURATION = 800;

  const { state: cursorState, handleMouseMove, handleClick, handleTouchStart, tick } = useCursorState(onComplete);

  const buildTextTexture = useCallback(() => {
    const state = glRef.current;
    if (!state) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth,
      h = window.innerHeight;
    const { canvas: tc, charWidth, fontSize } = buildTextCanvas(w, h, dpr);
    const { canvas: altTc } = buildTextCanvas(w, h, dpr, IS_TOUCH() ? "taptoenter" : "clicktoenter", IS_TOUCH());

    sizeCanvas(canvasRef.current!, w, h, dpr);

    const { gl, textTex, altTextTex, uniforms } = state;
    gl.viewport(0, 0, w * dpr, h * dpr);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, altTextTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, altTc);
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

      if (invertCursor) {
        // inverted mode: only letters inside cursor render, fading in from black
        if (invertStartTime.current === null) invertStartTime.current = now;
        // stay just above 0 to avoid flash of normal mask
        const fadeProgress = Math.min(1, Math.max(0.001, (now - invertStartTime.current) / INVERT_FADE_DURATION));

        gl.uniform1f(uniforms.uInvertCursor, fadeProgress);
        if (video.readyState >= 2) {
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, videoTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          gl.uniform1f(uniforms.uVideoAspect, video.videoWidth / video.videoHeight);
        }
        const mp = mousePos.current;
        if (IS_TOUCH()) {
          // no cursor on mobile, just the ambient grid
          gl.uniform3f(uniforms.uCursor, -9999, -9999, 0);
        } else {
          gl.uniform3f(uniforms.uCursor, mp.x, mp.y, IDLE_RADIUS * 0.55);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      // Normal mode
      tick(now);
      gl.uniform1f(uniforms.uInvertCursor, 0.0);
      const cs = cursorState.current;

      if (cs.done) return;

      if (video.readyState >= 2) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, videoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.uniform1f(uniforms.uVideoAspect, video.videoWidth / video.videoHeight);
      }

      const [vx, vy, vr] = cs.active ? [cs.x, cs.y, cs.radius] : [-9999, -9999, 0];
      gl.uniform3f(uniforms.uCursor, vx, vy, vr);
      gl.uniform1f(uniforms.uExpanding, cs.expanding ? cs.progress : 0.0);
      gl.uniform1f(uniforms.uIdleRadius, IDLE_RADIUS);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // we no longer render a label via overlay since it is baked into the shader!

      rafRef.current = requestAnimationFrame(render);
    },
    [tick, cursorState, invertCursor],
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

    if (invertCursor) {
      // rebuild on resize
      var onResize = () => {
        buildTextTexture();
      };
      window.addEventListener("resize", onResize);
    } else {
      // normal mode: cursor interaction
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("click", handleClick);
      canvas.addEventListener("touchstart", handleTouchStart, { passive: false });

      const centerCursor = () => {
        const s = cursorState.current;
        if (!IS_TOUCH() || s.expanding || s.done) return;
        s.x = window.innerWidth / 2;
        s.y = window.innerHeight / 2;
        s.active = true;
      };
      if (IS_TOUCH()) centerCursor();

      var onResize = () => {
        buildTextTexture();
        centerCursor();
      };
      window.addEventListener("resize", onResize);
    }

    videoRef.current!.play().catch(() => { });
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      if (onResize) window.removeEventListener("resize", onResize);
      if (!invertCursor) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("click", handleClick);
        canvas.removeEventListener("touchstart", handleTouchStart);
      }
    };
  }, [buildTextTexture, handleMouseMove, handleClick, handleTouchStart, render, invertCursor]);

  return (
    <>
      <video ref={videoRef} src={videoSrc} loop muted playsInline className="video-hidden" />
      <canvas ref={canvasRef} className="fullscreen canvas-main" />
    </>
  );
}
