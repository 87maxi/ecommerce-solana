'use client';

import { useState, useEffect } from 'react';

/**
 * A hook that returns true after the component has mounted on the client.
 * Useful for preventing hydration errors in Next.js when rendering
 * content that depends on client-side state (like window, localStorage, or wallet state).
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
