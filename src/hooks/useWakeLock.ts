import { useEffect, useRef } from "react";

/**
 * Hook to keep the screen awake and prevent dimming/sleep on mobile devices.
 * Uses the Screen Wake Lock API to maintain screen visibility.
 */
export function useWakeLock(enabled = false) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isRequestingRef = useRef(false);

  useEffect(() => {
    if (!("wakeLock" in navigator)) {
      return;
    }

    async function requestWakeLock() {
      if (!enabled) return;
      if (isRequestingRef.current) return;
      if (document.visibilityState !== "visible") return;
      if (wakeLockRef.current && !wakeLockRef.current.released) return;

      isRequestingRef.current = true;

      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");

        wakeLockRef.current.addEventListener("release", () => {
          wakeLockRef.current = null;
          setTimeout(() => {
            if (enabled && document.visibilityState === "visible") {
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
        } catch (err) {
          console.error("Failed to release Wake Lock:", err);
        }
      }
    }

    if (enabled) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, [enabled]);
}
