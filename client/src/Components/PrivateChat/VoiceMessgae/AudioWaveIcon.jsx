import React, { useEffect, useState } from "react";
import { useVoice } from "../../../context/VoiceContext";
import { StopCircle } from "lucide-react";

export default function AudioRecordingVisualizer({
  size = "md",
  recTime = 0
}) {
  const [bars, setBars] = useState([]);
  const { stopRecording } = useVoice();

  // Mobile-first responsive configurations with enhanced desktop sizes
  const sizes = {
    sm: {
      barCount: 10,
      minHeight: 2,
      maxHeight: 12,
      width: 2,
      gap: 1,
      padding: "4px 6px"
    },
    md: {
      barCount: 14,
      minHeight: 3,
      maxHeight: 20,
      width: 3,
      gap: 2,
      padding: "6px 10px"
    },
    lg: {
      barCount: 25, // Increased for desktop
      minHeight: 6,  // Increased min height
      maxHeight: 40, // Increased max height
      width: 4,      // Wider bars
      gap: 3,        // More gap
      padding: "12px 16px" // More padding
    }
  };

  const config = sizes[size];

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
          lastUpdate: Date.now()
        };
      });
    };

    setBars(generateBars());
  }, [config.barCount, config.minHeight, config.maxHeight]);

  // Audio recording animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prevBars =>
        prevBars.map((bar, i) => {
          const now = Date.now();
          const timeDelta = (now - bar.lastUpdate) / 1000;

          const centerDistance = Math.abs(i - config.barCount / 2) / (config.barCount / 2);
          const baseIntensity = 1 - centerDistance * 0.4;

          let newTargetHeight;
          if (Math.random() < 0.15) {
            newTargetHeight = config.maxHeight * baseIntensity * (0.7 + Math.random() * 0.3);
          } else if (Math.random() < 0.1) {
            newTargetHeight = config.minHeight;
          } else {
            newTargetHeight = config.minHeight +
              (config.maxHeight - config.minHeight) * baseIntensity *
              (0.3 + Math.random() * 0.4);
          }

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
    }, 50);

    return () => clearInterval(interval);
  }, [config]);

  const handleStopRecording = () => {
    stopRecording();
  };

  return (
 <div className="
  relative flex items-center gap-2 sm:gap-3 lg:gap-4
  transition-all duration-300
  w-full min-w-0 
  overflow-hidden
"
  style={{ padding: config.padding, backgroundColor: "transparent" }}>


      {/* Recording indicator */}
      <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
        <div className="w-2 h-2 lg:w-3 lg:h-3 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-xs lg:text-sm font-medium text-red-600 min-w-[25px] lg:min-w-[35px]">
          {recTime}
        </span>
      </div>

      {/* Waveform bars */}
      <div className="flex items-center justify-center flex-1 min-w-0" style={{
        height: `${config.maxHeight}px`,
        minWidth: `${Math.min((config.width + config.gap) * config.barCount, 200)}px`
      }}>
        {bars.map((bar, i) => (
          <div
            key={bar.id}
            className="
              bg-gray-400 rounded-sm lg:rounded
              transition-all duration-75 ease-out
              opacity-100
            "
            style={{
              width: `${config.width}px`,
              height: `${bar.height}px`,
              marginLeft: i === 0 ? 0 : `${config.gap}px`,
              transformOrigin: "center center"
            }}
          />
        ))}
      </div>

      {/* Status and Stop button */}
      <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
        <span className="text-xs lg:text-sm font-medium text-red-600 whitespace-nowrap hidden xs:block lg:block">
          Recording...
        </span>

        <button
          onClick={handleStopRecording}
          className="p-1 lg:p-2 hover:bg-red-50 rounded-full transition-colors touch-manipulation flex-shrink-0"
          title="Stop Recording"
          aria-label="Stop Recording"
        >
          <StopCircle className="w-4 h-4 lg:w-5 lg:h-5 text-red-500" />
        </button>
      </div>
    </div>
  );
}