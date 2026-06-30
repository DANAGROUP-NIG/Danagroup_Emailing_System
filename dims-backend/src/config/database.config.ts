import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const parseOptionalBoolean = (value: string | undefined): boolean | undefined =>
  value === undefined ? undefined : parseBoolean(value);

const parseInteger = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const buildPostgresOptions = (
  env: Record<string, string | undefined>,
): PostgresConnectionOptions => {
  const databaseUrl = env.DATABASE_URL;
  const sslEnabled =
    parseBoolean(env.DB_SSL) ||
    Boolean(
      databaseUrl?.match(/sslmode=(require|verify-full|verify-ca|prefer)/),
    );
  const rejectUnauthorized = parseBoolean(
    env.DB_SSL_REJECT_UNAUTHORIZED,
    true,
  );
  const queryLogging =
    parseOptionalBoolean(env.DB_LOGGING) ?? env.NODE_ENV === "development";

  return {
    type: "postgres",

    ...(databaseUrl
      ? { url: databaseUrl }
      : {
          host: env.DB_HOST ?? "localhost",
          port: parseInteger(env.DB_PORT, 5432),
          database: env.DB_NAME ?? "dims_db",
          username: env.DB_USER ?? "dims_user",
          password: env.DB_PASSWORD ?? "password",
        }),

    synchronize: false,

    logging: queryLogging ? ["query", "error"] : ["error"],

    migrations: ["dist/database/migrations/*.js"],
    migrationsTableName: "migrations",

    namingStrategy: new SnakeNamingStrategy(),

    ssl: sslEnabled ? { rejectUnauthorized } : false,

    extra: {
      max: parseInteger(env.DB_POOL_MAX, 20),
      idleTimeoutMillis: parseInteger(env.DB_IDLE_TIMEOUT_MS, 10000),
      connectionTimeoutMillis: parseInteger(env.DB_CONNECTION_TIMEOUT_MS, 5000),
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    },
  };
};

export default (config: ConfigService): TypeOrmModuleOptions =>
  ({
    ...buildPostgresOptions({
      DATABASE_URL: config.get<string>("DATABASE_URL"),
      DB_HOST: config.get<string>("DB_HOST"),
      DB_PORT: config.get<string>("DB_PORT"),
      DB_NAME: config.get<string>("DB_NAME"),
      DB_USER: config.get<string>("DB_USER"),
      DB_PASSWORD: config.get<string>("DB_PASSWORD"),
      DB_SSL: config.get<string>("DB_SSL"),
      DB_SSL_REJECT_UNAUTHORIZED: config.get<string>(
        "DB_SSL_REJECT_UNAUTHORIZED",
      ),
      DB_LOGGING: config.get<string>("DB_LOGGING"),
      DB_POOL_MAX: config.get<string>("DB_POOL_MAX"),
      DB_IDLE_TIMEOUT_MS: config.get<string>("DB_IDLE_TIMEOUT_MS"),
      DB_CONNECTION_TIMEOUT_MS: config.get<string>("DB_CONNECTION_TIMEOUT_MS"),
      NODE_ENV: config.get<string>("NODE_ENV"),
    }),
    autoLoadEntities: true,
    keepConnectionAlive: true,
  });
