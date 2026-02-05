'use client';

import { useEffect, useState } from 'react';

interface ThemeBackgroundProps {
  theme: string;
}

export function ThemeBackground({ theme }: ThemeBackgroundProps) {
  const [prevTheme, setPrevTheme] = useState(theme);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (theme !== prevTheme) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setPrevTheme(theme);
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [theme, prevTheme]);

  return (
    <>
      {/* Base layer: neutral dark background */}
      <div className="fixed inset-0 -z-30 bg-[#0a0a0f]" />

      {/* Previous theme: corner/edge gradients */}
      <div
        data-theme={prevTheme}
        className="fixed inset-0 -z-20"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 0% 0%, var(--league-bg-start) 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 100% 0%, var(--league-bg-start) 0%, transparent 40%),
            radial-gradient(ellipse 50% 40% at 100% 100%, var(--league-bg-start) 0%, transparent 35%),
            radial-gradient(ellipse 40% 50% at 0% 100%, var(--league-bg-start) 0%, transparent 30%)
          `,
          opacity: 0.4,
        }}
      />

      {/* New theme overlay: fading in */}
      <div
        data-theme={theme}
        className={`fixed inset-0 -z-10 transition-opacity duration-300 ${
          isTransitioning ? 'opacity-100' : theme !== prevTheme ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 0% 0%, var(--league-bg-start) 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 100% 0%, var(--league-bg-start) 0%, transparent 40%),
            radial-gradient(ellipse 50% 40% at 100% 100%, var(--league-bg-start) 0%, transparent 35%),
            radial-gradient(ellipse 40% 50% at 0% 100%, var(--league-bg-start) 0%, transparent 30%)
          `,
          opacity: 0.4,
        }}
      />
    </>
  );
}
