import { useState, useEffect } from 'react';

/**
 * Custom hook to determine if the component is mounted on the client.
 * This is used to prevent hydration mismatches between server-rendered
 * and client-rendered content for components that rely on client-side state.
 * @returns {boolean} - True if the component is mounted, false otherwise.
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
