import React, { useEffect } from 'react';

interface AdBannerProps {
  adSlot?: string;
  adClient?: string;
  className?: string;
}

export function AdBanner({ 
  adSlot = (import.meta as any).env.VITE_GOOGLE_ADSENSE_SLOT || "8674527519", 
  adClient = (import.meta as any).env.VITE_GOOGLE_ADSENSE_ID || "ca-pub-3759653446231226",
  className = "" 
}: AdBannerProps) {
  const adRef = React.useRef<HTMLModElement>(null);

  useEffect(() => {
    // Check if initializing script is loaded
    const scriptId = 'google-adsense-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Check if initialization was already done
    if (adRef.current && adRef.current.getAttribute('data-adsbygoogle-status') === 'done') {
      return;
    }

    const pushAd = () => {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err: any) {
        if (err.message && err.message.includes("already have ads")) {
          // Suppress this specific AdSense error caused by React Strict Mode
          return;
        }
        console.error("AdSense error:", err);
      }
    };

    if (adRef.current) {
      if (adRef.current.clientWidth > 0) {
        pushAd();
      } else {
        let isDisconnected = false;
        const observer = new ResizeObserver((entries) => {
          if (entries[0].contentRect.width > 0 && !isDisconnected) {
            pushAd();
            isDisconnected = true;
            try {
              observer.disconnect();
            } catch(e) {}
          }
        });
        observer.observe(adRef.current);
        return () => {
          if (!isDisconnected) {
            isDisconnected = true;
            try {
              observer.disconnect();
            } catch(e) {}
          }
        };
      }
    }
  }, [adClient]);

  return (
    <div className={`w-full overflow-hidden flex justify-center items-center bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl my-4 min-h-[90px] relative ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center", width: "100%" }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      {/* Fallback text when ads don't load in dev */}
      <span className="absolute text-gray-900 dark:text-white/20 text-xs font-mono tracking-widest uppercase pointer-events-none z-0">Advertisement</span>
    </div>
  );
}
