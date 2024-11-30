import "reflect-metadata";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "0dcdbd5fbef54bea883414d73325697a",
  database: "hiplando",
  synchronize: false,
  logging: true,
  entities: [
    "src/**/entity/*.ts" // Glob pattern to load all entity files
  ],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
});