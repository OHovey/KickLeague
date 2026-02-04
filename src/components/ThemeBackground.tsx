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
      {/* Base layer: previous theme */}
      <div
        data-theme={prevTheme}
        className="fixed inset-0 -z-20 bg-gradient-to-b from-[var(--league-bg-start)] to-[var(--league-bg-end)]"
      />
      {/* Overlay layer: new theme fading in */}
      <div
        data-theme={theme}
        className={`fixed inset-0 -z-10 bg-gradient-to-b from-[var(--league-bg-start)] to-[var(--league-bg-end)] transition-opacity duration-300 ${
          isTransitioning ? 'opacity-100' : theme !== prevTheme ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </>
  );
}
