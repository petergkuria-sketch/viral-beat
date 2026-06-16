import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

let io: Server | null = null;

// Store connected clients
const connectedClients = new Map<string, Socket>();

// Current virality data (simulated real-time updates)
let currentViralityScore = 87.0;
let currentTrendChange = 12;

export function initializeWebSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socket.io",
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    connectedClients.set(socket.id, socket);

    // Send initial data to the newly connected client
    socket.emit("initialData", {
      viralityScore: currentViralityScore,
      trendChange: currentTrendChange,
      timestamp: new Date().toISOString(),
    });

    // Handle client requesting specific trend updates
    socket.on("subscribeTrend", (topic: string) => {
      console.log(`[WebSocket] Client ${socket.id} subscribed to trend: ${topic}`);
      socket.join(`trend:${topic}`);
    });

    socket.on("unsubscribeTrend", (topic: string) => {
      console.log(`[WebSocket] Client ${socket.id} unsubscribed from trend: ${topic}`);
      socket.leave(`trend:${topic}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      connectedClients.delete(socket.id);
    });
  });

  // Start simulating real-time updates
  startRealTimeUpdates();

  console.log("[WebSocket] Server initialized");
  return io;
}

// Simulate real-time virality score updates
function startRealTimeUpdates() {
  setInterval(() => {
    if (!io || connectedClients.size === 0) return;

    // Simulate small fluctuations in virality score
    const fluctuation = (Math.random() - 0.5) * 2; // -1 to +1
    currentViralityScore = Math.max(0, Math.min(100, currentViralityScore + fluctuation));
    currentViralityScore = Math.round(currentViralityScore * 10) / 10;

    // Occasionally update trend change percentage
    if (Math.random() > 0.8) {
      currentTrendChange = Math.round(currentTrendChange + (Math.random() - 0.5) * 4);
    }

    // Broadcast to all connected clients
    io.emit("viralityUpdate", {
      viralityScore: currentViralityScore,
      trendChange: currentTrendChange,
      timestamp: new Date().toISOString(),
    });
  }, 5000); // Update every 5 seconds

  // Simulate new trending content appearing
  setInterval(() => {
    if (!io || connectedClients.size === 0) return;

    const trendingTopics = ["AI", "Crypto", "Gaming", "Music", "Sports"];
    const platforms = ["YouTube", "TikTok", "Twitter", "Instagram"];
    const randomTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
    const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];

    const newContent = {
      id: `content-${Date.now()}`,
      title: `New viral ${randomTopic} content on ${randomPlatform}`,
      platform: randomPlatform,
      topic: randomTopic,
      views: Math.floor(Math.random() * 1000000) + 100000,
      engagement: Math.floor(Math.random() * 50000) + 5000,
      timestamp: new Date().toISOString(),
    };

    io.emit("newTrendingContent", newContent);
  }, 15000); // New content every 15 seconds

  // Simulate creator activity updates
  setInterval(() => {
    if (!io || connectedClients.size === 0) return;

    const creators = [
      { handle: "TrendMaster", avatar: "🎯" },
      { handle: "ArtBotAlpha", avatar: "🎨" },
      { handle: "CreativeAI_Pro", avatar: "🤖" },
      { handle: "FutureCanvas", avatar: "🖼️" },
    ];

    const randomCreator = creators[Math.floor(Math.random() * creators.length)];
    const actions = ["posted new content", "went viral", "gained 10K followers", "trending now"];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];

    io.emit("creatorActivity", {
      creator: randomCreator,
      action: randomAction,
      timestamp: new Date().toISOString(),
    });
  }, 20000); // Creator activity every 20 seconds
}

// Export function to emit custom events
export function emitToAll(event: string, data: unknown) {
  if (io) {
    io.emit(event, data);
  }
}

// Export function to emit to specific trend subscribers
export function emitToTrend(topic: string, event: string, data: unknown) {
  if (io) {
    io.to(`trend:${topic}`).emit(event, data);
  }
}

export function getIO() {
  return io;
}

export function getConnectedClientsCount() {
  return connectedClients.size;
}
