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

    app.use(
      session({
        store: new RedisStore({ client: redisClient, prefix: "sess:" }),
        secret: process.env.SESSION_SECRET || (() => { throw new Error('SESSION_SECRET environment variable is required'); })(),
        resave: false,
        saveUninitialized: false,
        name: "dims_sid", // Custom cookie name
        cookie: {
          httpOnly: true, // Prevents XSS
          secure: process.env.NODE_ENV === "production",
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          sameSite: "lax", // Helps with CSRF
        },
      }),
    );

    app.use(cookieParser());
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

    const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    function isOriginAllowed(origin: string): boolean {
      return allowedOrigins.some((p) =>
        p.startsWith("*.") ? origin.endsWith(p.slice(1)) : origin === p,
      );
    }

    app.enableCors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin || isOriginAllowed(requestOrigin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    });

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

    const port = process.env.PORT ?? 3000;
    await app.listen(port, "0.0.0.0");
    if (process.env.NODE_ENV !== "production") {
      console.log(`✅ DIMS API running on http://localhost:${port}/api`);
      console.log(`✅ Swagger docs at http://localhost:${port}/api/docs`);
    }
  } catch (error) {
    console.error("❌ Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error("❌ Bootstrap failed:", err);
  process.exit(1);
});
