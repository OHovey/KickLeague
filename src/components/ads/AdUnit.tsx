"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ADSENSE_PUBLISHER_ID } from "./ad-config";

/* ------------------------------------------------------------------ */
/*  Global type augmentation                                          */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

/* ------------------------------------------------------------------ */
/*  Module-level script loader (shared across all AdUnit instances)    */
/* ------------------------------------------------------------------ */

let scriptPromise: Promise<void> | null = null;

function loadAdSenseScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    // Script already in DOM (e.g. inserted by another mechanism)
    if (document.querySelector('script[src*="adsbygoogle"]')) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("AdSense script blocked"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/* ------------------------------------------------------------------ */
/*  AdUnit component                                                  */
/* ------------------------------------------------------------------ */

type AdStatus = "loading" | "loaded" | "blocked" | "unfilled";

interface AdUnitProps {
  slotId: string;
  format?: string;
  className?: string;
}

export function AdUnit({
  slotId,
  format = "auto",
  className,
}: AdUnitProps) {
  const [adStatus, setAdStatus] = useState<AdStatus>("loading");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);
  const pathname = usePathname();

  /* ----- IntersectionObserver + script load + ad push ------------- */

  const triggerAd = useCallback(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setAdStatus("loaded");

      // Unfilled detection: check data-ad-status after 3 s
      setTimeout(() => {
        const ins = wrapperRef.current?.querySelector("ins.adsbygoogle");
        if (ins && ins.getAttribute("data-ad-status") === "unfilled") {
          setAdStatus("unfilled");
        }
      }, 3000);
    } catch {
      setAdStatus("blocked");
    }
  }, []);

  useEffect(() => {
    // Reset on route change
    pushedRef.current = false;
    setAdStatus("loading");

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let observer: IntersectionObserver | null = null;
    let scriptLoaded = false;

    loadAdSenseScript()
      .then(() => {
        scriptLoaded = true;

        observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting && scriptLoaded) {
              triggerAd();
              observer?.disconnect();
            }
          },
          { rootMargin: "200px" },
        );

        observer.observe(wrapper);
      })
      .catch(() => {
        setAdStatus("blocked");
      });

    return () => {
      observer?.disconnect();
    };
  }, [pathname, triggerAd]);

  /* ----- Early return when not configured ------------------------- */

  if (!ADSENSE_PUBLISHER_ID || !slotId) return null;

  /* ----- Graceful collapse when blocked / unfilled ---------------- */

  if (adStatus === "blocked" || adStatus === "unfilled") return null;

  /* ----- Render --------------------------------------------------- */

  return (
    <div
      ref={wrapperRef}
      className={`rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden ${className ?? ""}`}
    >
      <span className="block text-[10px] text-white/20 uppercase tracking-widest text-center pt-2">
        Ad
      </span>

      {/* Skeleton placeholder while loading */}
      {adStatus === "loading" && (
        <div className="min-h-[100px] animate-pulse bg-white/[0.03] rounded-lg m-2" />
      )}

      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
        key={pathname}
      />
    </div>
  );
}
