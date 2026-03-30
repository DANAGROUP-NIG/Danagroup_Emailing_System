import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export default (config: ConfigService): TypeOrmModuleOptions => ({
  type: "postgres",

  host: config.get<string>("DB_HOST", "localhost"),
  port: config.get<number>("DB_PORT", 5432),

  database: config.get<string>("DB_NAME", "dims_db"),
  username: config.get<string>("DB_USER", "dims_user"),
  password: config.get<string>("DB_PASSWORD", "password"),

  autoLoadEntities: true,

  synchronize: false, // never true in prod

  logging:
    config.get("NODE_ENV") === "development"
      ? ["query", "error"]
      : ["error"],

  migrations: ["dist/migrations/*.js"],
  migrationsTableName: "migrations",

  namingStrategy: new SnakeNamingStrategy(),

  ssl:
    config.get("NODE_ENV") === "production"
      ? { rejectUnauthorized: false }
      : false,

  extra: {
    max: 20,
  },

  keepConnectionAlive: true,
});