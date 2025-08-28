import React, { useEffect, useState } from "react";

export default function AudioRecordingVisualizer({
  variant = "classic", // "classic", "modern", "minimal", "pulse"
  size = "md" // "sm", "md", "lg"
}) {
  const [bars, setBars] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);

  // Size configurations
  const sizes = {
    sm: { barCount: 12, minHeight: 3, maxHeight: 20, width: 3, gap: 2, padding: "8px 12px" },
    md: { barCount: 16, minHeight: 4, maxHeight: 32, width: 4, gap: 3, padding: "12px 16px" },
    lg: { barCount: 20, minHeight: 5, maxHeight: 40, width: 5, gap: 4, padding: "16px 20px" }
  };

  const config = sizes[size];

  // Recording visualizer variants
  const variants = {
   
    classic: {
      colors: "bg-gray-400",
      containerBg: "bg-gray-50/90 backdrop-blur-sm border border-gray-200",
      borderRadius: "rounded-lg",
      shadow: "shadow-md shadow-gray-200",
      glowColor: "shadow-gray-400/20"
    },
  
  };

  const currentVariant = variants[variant];

  // Recording timer (always running when component is mounted)
  useEffect(() => {
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Generate realistic recording-style bars
  useEffect(() => {
    const generateBars = () => {
      return Array.from({ length: config.barCount }).map((_, i) => {
        const centerDistance = Math.abs(i - config.barCount / 2) / (config.barCount / 2);
        const baseHeight = config.minHeight +
          (config.maxHeight - config.minHeight) * (1 - centerDistance * 0.3);

        return {
          id: i,
          height: Math.floor(baseHeight * (0.3 + Math.random() * 0.7)),
          targetHeight: 0,
          animationSpeed: 0.8 + Math.random() * 0.4,
          intensity: Math.random(),
          lastUpdate: Date.now()
        };
      });
    };

    setBars(generateBars());
  }, [config.barCount, config.minHeight, config.maxHeight]);

  // Realistic audio recording simulation (always active)
  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prevBars =>
        prevBars.map((bar, i) => {
          const now = Date.now();
          const timeDelta = (now - bar.lastUpdate) / 1000;

          // Simulate realistic audio input patterns
          const centerDistance = Math.abs(i - config.barCount / 2) / (config.barCount / 2);
          const baseIntensity = 1 - centerDistance * 0.4;

          // Random spikes and valleys like real audio
          let newTargetHeight;
          if (Math.random() < 0.15) {
            // Sudden spike
            newTargetHeight = config.maxHeight * baseIntensity * (0.7 + Math.random() * 0.3);
          } else if (Math.random() < 0.1) {
            // Drop to minimum
            newTargetHeight = config.minHeight;
          } else {
            // Normal variation
            newTargetHeight = config.minHeight +
              (config.maxHeight - config.minHeight) * baseIntensity *
              (0.3 + Math.random() * 0.4);
          }

          // Smooth interpolation towards target
          const currentHeight = bar.height;
          const diff = newTargetHeight - currentHeight;
          const newHeight = currentHeight + (diff * bar.animationSpeed * timeDelta * 8);

          return {
            ...bar,
            height: Math.max(config.minHeight, Math.floor(newHeight)),
            targetHeight: newTargetHeight,
            lastUpdate: now
          };
        })
      );
    }, 50); // 20fps for smooth animation

    return () => clearInterval(interval);
  }, [config]);

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`
      relative inline-flex items-center gap-4
      ${currentVariant.containerBg}
      ${currentVariant.borderRadius}
      ${currentVariant.shadow}
      ${currentVariant.glowColor}
      transition-all duration-300
    `}
      style={{ padding: config.padding }}>

      {/* Recording indicator (always visible) */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-red-600 min-w-[40px]">
          {formatTime(recordingTime)}
        </span>
      </div>

      {/* Waveform bars */}
      <div className="flex items-center justify-center" style={{
        height: `${config.maxHeight}px`,
        minWidth: `${(config.width + config.gap) * config.barCount}px`
      }}>
        {bars.map((bar, i) => (
          <div
            key={bar.id}
            className={`
              ${currentVariant.colors}
              ${currentVariant.borderRadius === "rounded-full" ? "rounded-full" : "rounded-sm"}
              transition-all duration-75 ease-out
              opacity-100
            `}
            style={{
              width: `${config.width}px`,
              height: `${bar.height}px`,
              marginLeft: i === 0 ? 0 : `${config.gap}px`,
              transformOrigin: "center center",
              boxShadow: bar.height > config.minHeight * 1.5 ?
                `0 0 ${Math.floor(bar.height / 8)}px ${currentVariant.colors.includes('red') ? '#ef4444' :
                  currentVariant.colors.includes('blue') ? '#3b82f6' :
                    currentVariant.colors.includes('emerald') ? '#10b981' : '#6b7280'}40` : 'none'
            }}
          />
        ))}
      </div>

      {/* Status text (always shows recording) */}
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className={variant === 'modern' ? 'text-cyan-400' : 'text-red-600'}>
          Recording...
        </span>
      </div>

      
    </div>
  );
}
