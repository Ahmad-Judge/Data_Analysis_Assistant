import React, { useState, useEffect } from "react";
import { Database, BarChart3, Cpu, Sparkles } from "lucide-react";
import CSVUploader from "./csvuploader";
import Chart from "./charts";

function HeroSection() {
  const [csvData, setCsvData] = useState([]);   // state to hold parsed CSV

  // Animated counter component
  function AnimatedCounter({ target, duration = 1000, label }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (target === 0) {
        setCount(0);
        return;
      }

      let startTime;
      let animationFrame;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentCount = Math.floor(easeOutCubic * target);
        
        setCount(currentCount);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }, [target, duration]);

    return (
      <h2 className="text-xl sm:text-2xl font-bold transition-all duration-300">
        {count.toLocaleString()}
      </h2>
    );
  }

  return (
    <>
      <div
        className="w-full text-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16"
        style={{
          backgroundImage: `linear-gradient(
            to right,
            oklch(0.51 0.11 223.9) 0%,
            oklch(0.15 0.02 232.54) 50%,
            black 100%
          )`,
        }}
      >
        {/* Top badge */}
        <div className="bg-white/20 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-4 sm:mb-6 shadow-md">
          AI-Powered Data Analysis
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-center mb-3 sm:mb-4 px-2">
          Unlock Insights from Your{" "}
          <span className="text-blue-200">CSV Data</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-center max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl mb-6 sm:mb-8 opacity-90 px-2">
          Upload your CSV files, visualize data with interactive charts, and
          chat with AI to discover hidden patterns and insights.
        </p>

        {/* Feature Tags */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 max-w-full px-2">
          <span className="bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm hover:text-blue-300 cursor-pointer transition-colors duration-200">
            CSV Upload
          </span>
          <span className="bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm hover:text-blue-300 cursor-pointer transition-colors duration-200">
            Interactive Charts
          </span>
          <span className="bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm hover:text-blue-300 cursor-pointer transition-colors duration-200">
            AI Assistant
          </span>
          <span className="bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm hover:text-blue-300 cursor-pointer transition-colors duration-200">
            Parameter Tuning
          </span>
          <span className="bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm hover:text-blue-300 cursor-pointer transition-colors duration-200">
            Data Export
          </span>
        </div>

        {/* Stats Section with animations */}
        {csvData.length > 0 && (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-xs xs:max-w-sm sm:max-w-2xl lg:max-w-5xl animate-in fade-in duration-500 px-2">
            <div className="bg-white/10 p-4 sm:p-6 rounded-xl shadow-lg flex flex-col items-start transform transition-all duration-300 hover:bg-white/15 hover:scale-105 min-h-[120px] sm:min-h-[140px]">
              <Database className="w-5 h-5 sm:w-6 sm:h-6 mb-2 text-pink-200" />
              <p className="text-xs sm:text-sm opacity-80 mb-1">Records</p>
              <AnimatedCounter target={csvData.length} duration={1200} />
            </div>

            <div className="bg-white/10 p-4 sm:p-6 rounded-xl shadow-lg flex flex-col items-start transform transition-all duration-300 hover:bg-white/15 hover:scale-105 min-h-[120px] sm:min-h-[140px]">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mb-2 text-pink-200" />
              <p className="text-xs sm:text-sm opacity-80 mb-1">Columns</p>
              <AnimatedCounter 
                target={csvData.length > 0 ? Object.keys(csvData[0]).length : 0} 
                duration={1000} 
              />
            </div>

            <div className="bg-white/10 p-4 sm:p-6 rounded-xl shadow-lg flex flex-col items-start transform transition-all duration-300 hover:bg-white/15 hover:scale-105 min-h-[120px] sm:min-h-[140px]">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6 mb-2 text-pink-200" />
              <p className="text-xs sm:text-sm opacity-80 mb-1">Analysis Type</p>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold transition-all duration-500">
                {csvData.length > 0 ? "CSV Loaded" : "None"}
              </h2>
            </div>

            <div className="bg-white/10 p-4 sm:p-6 rounded-xl shadow-lg flex flex-col items-start transform transition-all duration-300 hover:bg-white/15 hover:scale-105 min-h-[120px] sm:min-h-[140px] xs:col-span-2 lg:col-span-1">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mb-2 text-pink-200 animate-pulse" />
              <p className="text-xs sm:text-sm opacity-80 mb-1">Status</p>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-300 transition-all duration-500">
                {csvData.length > 0 ? "Ready" : "Waiting"}
              </h2>
            </div>
          </div>
        )}
      </div>

      {/* Pass handler into uploader */}
      <CSVUploader onDataParsed={setCsvData} />

      {/* Show preview (optional) */}
    </>
  );
}

export default HeroSection;