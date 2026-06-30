import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint: number = 768): boolean {
  // Initialize with false for Server-Side Rendering (SSR) safety
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // 1. Define the media query string using Tailwind's default md breakpoint (768px)
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    // 2. Set the initial state correctly on the client
    setIsMobile(mediaQuery.matches);

    // 3. Create a listener callback function
    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // 4. Register the event listener (handles modern and legacy browser syntax)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaQueryChange);
    } else {
      mediaQuery.addListener(handleMediaQueryChange); // Fallback for older Safari/browsers
    }

    // 5. Clean up the listener when the component unmounts
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaQueryChange);
      } else {
        mediaQuery.removeListener(handleMediaQueryChange);
      }
    };
  }, [breakpoint]);

  return isMobile;
}
