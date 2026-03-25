import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export default (config: ConfigService): TypeOrmModuleOptions => ({
  type: "postgres",
  host: config.get("DB_HOST", "localhost"),
  port: config.get<number>("DB_PORT", 5432),
  database: config.get("DB_NAME", "dims_db"),
  username: config.get("DB_USER", "dims_user"),
  password: config.get("DB_PASSWORD", "dims_password"),
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/../migrations/*{.ts,.js}"],
  synchronize: config.get("DB_SYNCHRONIZE", "false") === "true",
  logging: config.get("DB_LOGGING", "false") === "true",
  ssl:
    config.get("NODE_ENV") === "production"
      ? { rejectUnauthorized: false }
      : false,
});
