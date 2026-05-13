import { NestFactory } from "@nestjs/core";
import session from "express-session";
import passport from "passport";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import * as dotenv from "dotenv";
dotenv.config();

import cookieParser = require("cookie-parser");

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      abortOnError: true, // This will force the app to crash and show the error
      logger: ["error", "warn", "log", "debug"], // Enable debug logs
    });

    const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean);

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    });

    //Initialize ioredis client
    // const redisClient = new Redis({
    //   host: process.env.REDIS_HOST || 'localhost',
    //   port: parseInt(process.env.REDIS_PORT) || 6379,
    // });

    const redisPassword = process.env.REDIS_PASSWORD;
    const resolvedRedisUrl =
      process.env.REDIS_URL ||
      (redisPassword
        ? `redis://:${redisPassword}@${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`
        : `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`);
    const isTls = resolvedRedisUrl.startsWith("rediss://");
    const redisClient = createClient({
      url: resolvedRedisUrl,
      socket: isTls ? { tls: true, rejectUnauthorized: false } : undefined,
    });

    redisClient.on("error", (error) => {
      console.error("Redis session client error:", error);
    });

    await redisClient.connect();

    const isProduction = process.env.NODE_ENV === "production";
    const sessionSecret = process.env.SESSION_SECRET;

    if (isProduction && !sessionSecret) {
      throw new Error("SESSION_SECRET must be configured in production");
    }

    app.getHttpAdapter().getInstance().set("trust proxy", 1);

    app.use(cookieParser());

    app.use(
      session({
        store: new RedisStore({ client: redisClient, prefix: "sess:" }),
        secret: sessionSecret || "dev-session-secret",
        resave: false,
        saveUninitialized: false,
        name: "dims_sid",
        cookie: {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          maxAge: 1000 * 60 * 60 * 24,
        },
      }),
    );

    app.use(passport.initialize());
    app.use(passport.session());

    app.setGlobalPrefix("api");

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true, // Helps with converting strings to numbers automatically
        },
      }),
    );

    const swaggerConfig = new DocumentBuilder()
      .setTitle("DIMS API")
      .setDescription("Dana Internal Mail & Intranet System — REST API")
      .setVersion("1.0")
      .addBearerAuth()
      .addTag("auth", "Authentication endpoints")
      .addTag("mail", "Internal mail endpoints")
      .addTag("users", "User & directory endpoints")
      .addTag("files", "File upload & download endpoints")
      .addTag("announcements", "Announcements endpoints")
      .addTag("search", "Full-text search endpoints")
      .addTag("departments", "Department & subsidiary endpoints")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);

    const port = process.env.PORT ?? 8000;
    await app.listen(port, "0.0.0.0");
    console.log(`✅ DIMS API running on http://localhost:${port}/api`);
    console.log(`✅ Swagger docs at http://localhost:${port}/api/docs`);
  } catch (error) {
    console.error("❌ Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error("❌ Bootstrap failed:", err);
  process.exit(1);
});
