import React, { useEffect, useRef } from 'react';

interface HilltopAdsBannerProps {
  zoneId?: string;
  className?: string;
}

export function HilltopAdsBanner({ 
  zoneId = (import.meta as any).env.VITE_HILLTOP_ZONE_ID || "YOUR_ZONE_ID",
  className = "" 
}: HilltopAdsBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous scripts if any
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    const scriptBaseUrl = (import.meta as any).env.VITE_HILLTOP_SCRIPT_URL || `//example.com/apu.php`;
    script.src = `${scriptBaseUrl}?zoneid=${zoneId}`;
    script.setAttribute('data-cfasync', 'false');

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [zoneId]);

  return (
    <div className={`w-full overflow-hidden flex justify-center items-center bg-white/5 border border-white/10 rounded-xl my-4 min-h-[90px] relative ${className}`}>
      <div ref={containerRef} className="w-full flex justify-center z-10" />
      {/* Fallback text when ads don't load in dev */}
      <span className="absolute text-white/20 text-xs font-mono tracking-widest uppercase pointer-events-none z-0">Advertisement</span>
    </div>
  );
}
