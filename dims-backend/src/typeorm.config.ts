import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "Devpastey007",
  database: process.env.DB_NAME,

  entities: [__dirname + "/modules/**/*.entity{.ts,.js}"],
  migrations: ["src/database/migrations/*.ts"],
  namingStrategy: new SnakeNamingStrategy(),

  synchronize: false,
});