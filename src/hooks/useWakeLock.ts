import { useEffect, useRef } from "react";

/**
 * Hook to keep the screen awake and prevent dimming/sleep on mobile devices.
 * Uses the Screen Wake Lock API to maintain screen visibility.
 */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if Wake Lock API is supported
    if (!("wakeLock" in navigator)) {
      console.log("Wake Lock API not supported in this browser");
      return;
    }

    async function requestWakeLock() {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        console.log("Wake Lock acquired - screen will stay awake");

        // Listen for wake lock release (e.g., if battery is very low)
        wakeLockRef.current.addEventListener("release", () => {
          console.log("Wake Lock released");
        });
      } catch (err) {
        console.error("Failed to acquire Wake Lock:", err);
      }
    }

    async function releaseWakeLock() {
      if (wakeLockRef.current) {
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
