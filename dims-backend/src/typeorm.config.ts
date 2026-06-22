import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { buildPostgresOptions } from "./config/database.config";

dotenv.config();

const options = buildPostgresOptions(process.env);

export const AppDataSource = new DataSource({
  ...options,

  entities: [__dirname + "/modules/**/*.entity{.ts,.js}"],
  migrations: ["src/database/migrations/*.ts"],
  namingStrategy: new SnakeNamingStrategy(),

  synchronize: false,
});
