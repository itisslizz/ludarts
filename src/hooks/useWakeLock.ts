import { useEffect, useRef } from "react";

/**
 * Hook to keep the screen awake and prevent dimming/sleep on mobile devices.
 * Uses the Screen Wake Lock API to maintain screen visibility.
 */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isRequestingRef = useRef(false);

  useEffect(() => {
    // Check if Wake Lock API is supported
    if (!("wakeLock" in navigator)) {
      console.log("Wake Lock API not supported in this browser");
      return;
    }

    async function requestWakeLock() {
      // Prevent multiple simultaneous requests
      if (isRequestingRef.current) return;
      
      // Only request if page is visible
      if (document.visibilityState !== "visible") return;
      
      // Don't request if we already have an active wake lock
      if (wakeLockRef.current && !wakeLockRef.current.released) return;

      isRequestingRef.current = true;
      
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        console.log("Wake Lock acquired - screen will stay awake");

        // Listen for wake lock release and re-acquire if still visible
        wakeLockRef.current.addEventListener("release", () => {
          console.log("Wake Lock released - will re-acquire if page is visible");
          wakeLockRef.current = null;
          
          // Re-acquire wake lock after a short delay if page is still visible
          setTimeout(() => {
            if (document.visibilityState === "visible") {
              requestWakeLock();
            }
          }, 100);
        });
      } catch (err) {
        console.error("Failed to acquire Wake Lock:", err);
      } finally {
        isRequestingRef.current = false;
      }
    }

    async function releaseWakeLock() {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          console.log("Wake Lock manually released");
        } catch (err) {
          console.error("Failed to release Wake Lock:", err);
        }
      }
    }

    // Request wake lock on mount
    requestWakeLock();

    // Re-request wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      } else {
        // Release when page becomes hidden to save battery
        releaseWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, []);
}
