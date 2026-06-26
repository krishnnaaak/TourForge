import { useState, useEffect, useRef, useCallback } from "react";
import type { Hotspot } from "../types";
import api from "../services/api";

/**
 * Polls a hotspot's status every 2 seconds until it reaches a terminal state
 * (completed or failed). This is the client-side of the queue pattern.
 *
 * Why polling instead of WebSockets here?
 * For a small project, polling is simpler and sufficient.
 * In a production system, you'd use WebSockets or SSE for real-time pushes.
 * Worth mentioning in interviews — you know the trade-off.
 */
const useHotspotPoller = (hotspotId: string | null, initialStatus?: string) => {
  const [hotspot, setHotspot] = useState<Hotspot | null>(null);
  const [error, setError] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    if (!hotspotId) return;
    try {
      const res = await api.get(`/hotspots/${hotspotId}`);
      const updated: Hotspot = res.data.hotspot;
      setHotspot(updated);

      // Stop polling when job reaches a terminal state
      if (updated.status === "completed" || updated.status === "failed") {
        stopPolling();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Polling failed";
      setError(msg);
      stopPolling();
    }
  }, [hotspotId, stopPolling]);

  useEffect(() => {
    if (!hotspotId) return;

    // If already terminal, no need to poll
    if (initialStatus === "completed" || initialStatus === "failed") return;

    poll(); // immediate first fetch
    intervalRef.current = setInterval(poll, 2000);

    return () => stopPolling();
  }, [hotspotId, initialStatus, poll, stopPolling]);

  return { hotspot, error };
};

export default useHotspotPoller;
