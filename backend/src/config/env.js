import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.BACKEND_PORT) || 4000,
  postgresHost: process.env.POSTGRES_HOST || "localhost",
  postgresPort: Number(process.env.POSTGRES_PORT) || 5432,
  postgresUser: process.env.POSTGRES_USER || "retail_user",
  postgresPassword: process.env.POSTGRES_PASSWORD || "retail_password",
  postgresDb: process.env.POSTGRES_DB || "retail_intelligence",
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379
  },
  aiEngineUrl: process.env.AI_ENGINE_URL || "http://localhost:8000",
  jwtSecret: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12
};

