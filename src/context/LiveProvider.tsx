import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { WS_URL } from "../lib/api";
import { useAuth } from "./auth";
import { LiveContext, type LiveEvent, type LiveHandler, type LiveStatus } from "./live";

export function LiveProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const handlers = useRef(new Set<LiveHandler>());

  const subscribe = useCallback((handler: LiveHandler) => {
    handlers.current.add(handler);
    return () => {
      handlers.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    let socket: WebSocket | undefined;
    let timer: number | undefined;
    let attempts = 0;
    let stopped = false;

    const connect = () => {
      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        socket?.send(JSON.stringify({ type: "auth", token: localStorage.getItem("access_token") }));
      };

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "ready") {
            attempts = 0;
            setStatus("open");
            return;
          }
          handlers.current.forEach((handler) => handler(data as LiveEvent));
        } catch {
          // ignore anything that isn't valid JSON
        }
      };

      socket.onclose = (e) => {
        setStatus("closed");
        if (stopped || e.code === 1008) return; // 1008 means the server refused our token, so don't retry
        attempts += 1;
        timer = window.setTimeout(connect, Math.min(30000, 1000 * 2 ** attempts));
      };
    };

    connect();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      socket?.close();
    };
  }, [userId]);

  return <LiveContext.Provider value={{ status, subscribe }}>{children}</LiveContext.Provider>;
}