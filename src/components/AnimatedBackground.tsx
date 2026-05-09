import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';

export function AnimatedBackground() {
  const [points, setPoints] = useState('');
  const [points2, setPoints2] = useState('');
  
  const generatePoints = useMemo(() => (offset: number) => {
    const pts = [];
    let y = 60;
    for (let x = 0; x <= 100; x += 5) {
      y += (Math.random() - 0.5) * 40;
      y = Math.max(20, Math.min(80, y));
      pts.push(`${x},${y + offset}`);
    }
    return pts.join(' ');
  }, []);

  useEffect(() => {
    setPoints(generatePoints(0));
    setPoints2(generatePoints(10));
    
    const interval = setInterval(() => {
      setPoints(generatePoints(0));
      setPoints2(generatePoints(10));
    }, 6000);

    return () => clearInterval(interval);
  }, [generatePoints]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-50 mix-blend-screen" aria-hidden="true">
      {/* 3D-like grid perspective */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[60vh] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHBhdGggZD0iTTAgMGg4MHY4MEgwem03OSA3OWgtNzh2LTc4aDc4eiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-30"
        style={{ transformOrigin: 'bottom', transform: 'perspective(500px) rotateX(60deg) scale(2)' }}
      />
      
      {/* Glowing orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15],
          x: ['-20%', '10%', '-20%']
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.15, 0.25, 0.15],
          x: ['20%', '-10%', '20%']
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px]"
      />

      {/* Animated Chart SVG */}
      <svg 
        className="absolute bottom-0 left-0 w-full h-[60vh] text-blue-500 stroke-current drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" 
        preserveAspectRatio="none" 
        viewBox="0 0 100 100"
        style={{ transformOrigin: 'bottom', transform: 'perspective(500px) rotateX(20deg)' }}
      >
        <defs>
          <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(59,130,246,0.4)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
          <linearGradient id="chart-gradient-purple" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(168,85,247,0.3)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Back Area */}
        <motion.polygon
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, points: `0,100 ${points2} 100,100` }}
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          points={`0,100 ${points2} 100,100`}
          fill="url(#chart-gradient-purple)"
        />
        {/* Back Line */}
        <motion.polyline 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1, points: points2 }}
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          points={points2}
          fill="none" 
          stroke="rgba(168,85,247,0.6)" 
          strokeWidth="0.5" 
          filter="url(#glow)"
        />

        {/* Front Area */}
        <motion.polygon
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, points: `0,100 ${points} 100,100` }}
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          points={`0,100 ${points} 100,100`}
          fill="url(#chart-gradient)"
        />
        {/* Front Line */}
        <motion.polyline 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1, points: points }}
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          points={points}
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
}
