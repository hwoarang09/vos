import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * PerformanceMonitor
 * - Displays 5-second average CPU usage
 * - Updates every 5 seconds
 * - Positioned above Perf widget in bottom-right
 */
const PerformanceMonitor: React.FC = () => {
  const [avgCpu, setAvgCpu] = useState<number>(0);
  const frameTimesRef = useRef<number[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);
  const UPDATE_INTERVAL = 5; // seconds

  useFrame((state) => {
    const currentTime = state.clock.elapsedTime;
    const delta = state.clock.getDelta();

    // Collect frame time (in milliseconds)
    const frameTime = delta * 1000;
    frameTimesRef.current.push(frameTime);

    // Update every 5 seconds
    if (currentTime - lastUpdateTimeRef.current >= UPDATE_INTERVAL) {
      const frameTimes = frameTimesRef.current;

      if (frameTimes.length > 0) {
        // Calculate average frame time
        const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;

        // Calculate FPS from average frame time
        const avgFps = 1000 / avgFrameTime;

        // Estimate CPU usage (rough approximation)
        // Assuming 60 FPS is 0% CPU overhead, lower FPS = higher CPU usage
        const targetFps = 60;
        const cpuUsage = Math.max(0, Math.min(100, ((targetFps - avgFps) / targetFps) * 100 + 20));

        setAvgCpu(cpuUsage);
      }

      // Reset for next interval
      frameTimesRef.current = [];
      lastUpdateTimeRef.current = currentTime;
    }
  });

  return null;
};

/**
 * PerformanceMonitorUI
 * - HTML overlay component that displays the performance stats
 */
export const PerformanceMonitorUI: React.FC = () => {
  const [avgFps, setAvgFps] = useState<number>(0);
  const [avgMs, setAvgMs] = useState<number>(0);
  const [avgCpu, setAvgCpu] = useState<number>(0);
  const frameTimesRef = useRef<number[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const UPDATE_INTERVAL = 5000; // 5 seconds in milliseconds

  useEffect(() => {
    const updatePerformance = (currentTime: number) => {
      const delta = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;

      // Collect frame time (in milliseconds)
      frameTimesRef.current.push(delta);

      // Update every 5 seconds
      if (currentTime - lastUpdateTimeRef.current >= UPDATE_INTERVAL) {
        const frameTimes = frameTimesRef.current;

        if (frameTimes.length > 0) {
          // Calculate average frame time
          const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;

          // Calculate FPS from average frame time
          const fps = 1000 / avgFrameTime;

          // Estimate CPU usage (rough approximation)
          // Assuming 60 FPS is baseline, lower FPS = higher CPU usage
          const targetFps = 60;
          const cpuUsage = Math.max(0, Math.min(100, ((targetFps - fps) / targetFps) * 100 + 20));

          setAvgFps(fps);
          setAvgMs(avgFrameTime);
          setAvgCpu(cpuUsage);
        }

        // Reset for next interval
        frameTimesRef.current = [];
        lastUpdateTimeRef.current = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(updatePerformance);
    };

    // Start the animation loop
    lastUpdateTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updatePerformance);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "140px", // Higher above Perf widget
        right: "10px",
        padding: "10px 14px",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        color: "white",
        fontFamily: "monospace",
        fontSize: "15px",
        fontWeight: "bold",
        borderRadius: "6px",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        textShadow: "1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black",
        zIndex: 9999,
        pointerEvents: "none",
        userSelect: "none",
        display: "flex",
        flexDirection: "row",
        gap: "12px",
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: "16px", color: "#4ecdc4" }}>
        {avgFps.toFixed(1)} FPS
      </div>
      <div style={{ fontSize: "14px", color: "#9acd32" }}>
        {avgMs.toFixed(2)} ms
      </div>
      <div style={{ fontSize: "13px", color: "#aaa" }}>
        CPU: {avgCpu.toFixed(1)}%
      </div>
    </div>
  );
};

export default PerformanceMonitor;

