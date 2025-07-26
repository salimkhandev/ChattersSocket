import React, { useEffect, useState } from "react";

export default function BarWaveform() {
  const [bars, setBars] = useState([]);

  useEffect(() => {
    const barCount = 50;
    const generatedBars = Array.from({ length: barCount }).map(() => {
      return {
        height: Math.floor(Math.random() * 50), // 40 to 100 px
        delay: Math.random() * 1, // seconds
        duration: Math.random() * 1.5 + 0.5, // 0.5 to 2s
      };
    });
    setBars(generatedBars);
  }, []);

  return (
    <div className="flex items-end justify-center gap-1 h-33 bg-white rounded-md  p-4">
      {bars.map((bar, i) => (
        <div
          key={i}
          className="w-[5px] bg-black rounded-full animate-bounce-bar"
          style={{
            animationDuration: `${bar.duration}s`,
            animationDelay: `${bar.delay}s`,
            height: `${bar.height}px`,
          }}
        ></div>
      ))}
      <style jsx>{`
        @keyframes bounce-bar {
          0%, 100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1.2);
          }
        }
        .animate-bounce-bar {
          animation-name: bounce-bar;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}
