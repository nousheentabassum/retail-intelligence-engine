import { app } from "./app.js";
import { env } from "./config/env.js";
import { initDb } from "./config/db.js";
import { initRedis } from "./config/redis.js";
import { startJobs } from "./jobs/index.js";
import { websocketService } from "./services/websocket.service.js";

async function start() {
  try {
    await initDb();
    await initRedis();
    startJobs();

    const server = app.listen(env.port, () => {
      console.log(`Backend listening on port ${env.port}`);
    });

    // Initialize WebSocket service
    websocketService.initialize(server);
    console.log('WebSocket service initialized');
    
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();

