import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface ViralityUpdate {
  viralityScore: number;
  trendChange: number;
  timestamp: string;
}

interface TrendingContent {
  id: string;
  title: string;
  platform: string;
  topic: string;
  views: number;
  engagement: number;
  timestamp: string;
}

interface CreatorActivity {
  creator: {
    handle: string;
    avatar: string;
  };
  action: string;
  timestamp: string;
}

interface WebSocketState {
  isConnected: boolean;
  viralityScore: number;
  trendChange: number;
  lastUpdate: string | null;
  recentContent: TrendingContent[];
  recentActivity: CreatorActivity[];
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    viralityScore: 87.0,
    trendChange: 12,
    lastUpdate: null,
    recentContent: [],
    recentActivity: [],
  });

  useEffect(() => {
    // Connect to WebSocket server
    const socket = io({
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WebSocket] Connected to server");
      setState((prev) => ({ ...prev, isConnected: true }));
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected from server");
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    socket.on("initialData", (data: ViralityUpdate) => {
      setState((prev) => ({
        ...prev,
        viralityScore: data.viralityScore,
        trendChange: data.trendChange,
        lastUpdate: data.timestamp,
      }));
    });

    socket.on("viralityUpdate", (data: ViralityUpdate) => {
      setState((prev) => ({
        ...prev,
        viralityScore: data.viralityScore,
        trendChange: data.trendChange,
        lastUpdate: data.timestamp,
      }));
    });

    socket.on("newTrendingContent", (content: TrendingContent) => {
      setState((prev) => ({
        ...prev,
        recentContent: [content, ...prev.recentContent].slice(0, 10), // Keep last 10
      }));
    });

    socket.on("creatorActivity", (activity: CreatorActivity) => {
      setState((prev) => ({
        ...prev,
        recentActivity: [activity, ...prev.recentActivity].slice(0, 5), // Keep last 5
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribeTrend = useCallback((topic: string) => {
    if (socketRef.current) {
      socketRef.current.emit("subscribeTrend", topic);
    }
  }, []);

  const unsubscribeTrend = useCallback((topic: string) => {
    if (socketRef.current) {
      socketRef.current.emit("unsubscribeTrend", topic);
    }
  }, []);

  return {
    ...state,
    subscribeTrend,
    unsubscribeTrend,
  };
}
