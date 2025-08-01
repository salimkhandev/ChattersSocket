import React, { useEffect, useState } from "react";

export default function BarWaveform() {
  const [bars, setBars] = useState([]);

  // Config - easily customizable
  const config = {
    barCount: 36,
    minHeight: 8,
    maxHeight: 72,
    width: 2,
    color: "linear-gradient(to top, #2563eb, #3b82f6)", // Blue gradient
    borderRadius: "6px 6px 3px 3px",
    animationDuration: 1.8, // Base duration
    animationDelaySpread: 0.6, // How staggered the animations are
    gap: 3
  };

  useEffect(() => {
    // Generate initial bars with smooth random heights
    const generateBars = () => {
      return Array.from({ length: config.barCount }).map((_, i) => {
        const positionFactor = i / config.barCount;
        return {
          height: Math.floor(
            config.minHeight +
            Math.sin(positionFactor * Math.PI) * (config.maxHeight - config.minHeight) * 0.8 +
            Math.random() * (config.maxHeight - config.minHeight) * 0.2
          ),
          delay: positionFactor * config.animationDelaySpread,
          duration: config.animationDuration * (0.8 + Math.random() * 0.4) // 0.8x to 1.2x base duration
        };
      });
    };

    setBars(generateBars());

    // Smoothly update heights periodically
    const interval = setInterval(() => {
      setBars(prevBars =>
        prevBars.map((bar, i) => {
          const positionFactor = i / config.barCount;
          return {
            ...bar,
            height: Math.floor(
              config.minHeight +
              Math.sin(positionFactor * Math.PI) * (config.maxHeight - config.minHeight) * 0.7 +
              Math.random() * (config.maxHeight - config.minHeight) * 0.3
            )
          };
        })
      );
    }, 1800); // Update rhythmically with animation duration

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-end justify-center" style={{
      height: `${config.maxHeight}px`,
      padding: "16px 12px",
      background: "rgba(255, 255, 255, 0.95)",
      borderRadius: "12px",

    }}>
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{
            width: `${config.width}px`,
            background: config.color,
            borderRadius: config.borderRadius,
            animation: `waveform ${bar.duration}s ease-in-out ${bar.delay}s infinite both`,
            height: `${bar.height}px`,
            margin: `0 ${config.gap}px`,
            transformOrigin: "bottom center",
            willChange: "transform, height",
            transition: "height 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)"
          }}
        />
      ))}

      <style jsx global>{`
        @keyframes waveform {
          0%, 100% {
            transform: scaleY(0.6) translateY(4px);
            opacity: 0.85;
          }
          25% {
            transform: scaleY(0.9) translateY(2px);
          }
          50% {
            transform: scaleY(1.1) translateY(0);
            opacity: 1;
          }
          75% {
            transform: scaleY(0.8) translateY(3px);
          }
        }
      `}</style>
    </div>
  );
}