import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { saveFigmaPanelEnabled } from "../../settings/model/settings";
import {
  FIGMA_ACTIVITY_EVENT,
  loadFigmaBridgeStatus,
  subscribeFigmaBridge,
  type FigmaActivity,
  type FigmaBridgeStatus,
} from "../model/figma";

let lastActivity: FigmaActivity | null = null;
const activityListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener(FIGMA_ACTIVITY_EVENT, (event) => {
    lastActivity = (event as CustomEvent<FigmaActivity>).detail;
    for (const listener of activityListeners) listener();
  });
}

function subscribeActivity(listener: () => void) {
  activityListeners.add(listener);
  return () => {
    activityListeners.delete(listener);
  };
}

export function useFigmaActivity(): FigmaActivity | null {
  return useSyncExternalStore(
    subscribeActivity,
    () => lastActivity,
    () => null,
  );
}

export function useFigmaBridge() {
  const [status, setStatus] = useState<FigmaBridgeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await loadFigmaBridgeStatus());
      setError(null);
    } catch (reason) {
      setError(String(reason instanceof Error ? reason.message : reason));
    }
  }, []);

  useEffect(() => {
    if (status) saveFigmaPanelEnabled(status.enabled);
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    const stop = subscribeFigmaBridge(
      (next) => {
        if (!cancelled) setStatus(next);
      },
      (message) => {
        if (!cancelled) setError(message);
      },
    );
    void loadFigmaBridgeStatus()
      .then((next) => {
        if (!cancelled) setStatus(next);
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(String(reason instanceof Error ? reason.message : reason));
      });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return { status, setStatus, error, setError, refresh };
}
