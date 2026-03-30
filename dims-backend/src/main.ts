import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

import cookieParser = require('cookie-parser');

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());

    app.setGlobalPrefix("api");

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.enableCors({
      origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
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
    console.log(`✅ DIMS API running on http://0.0.0.0:${port}/api`);
    console.log(`✅ Swagger docs at http://0.0.0.0:${port}/api/docs`);
  } catch (error) {
    console.error("❌ Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error("❌ Bootstrap failed:", err);
  process.exit(1);
});
