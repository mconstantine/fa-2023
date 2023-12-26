import "reflect-metadata"
import { DataSource } from "typeorm"
import { Category } from "./models/Category"

export const AppDataSource = new DataSource({
  type: "postgres",
  url: "postgres://postgres:postgres@db:5432/fa_2023",
  entities: [Category],
  migrations: ["./src/migrations/*.ts"],
})
