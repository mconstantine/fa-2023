import { DataSource } from "typeorm"
import { Category } from "./models/Category"
import { Transaction } from "./models/Transaction"

export const AppDataSource = new DataSource({
  type: "postgres",
  url: "postgres://postgres:postgres@db:5432/fa_2023",
  entities: [Category, Transaction],
  migrations: ["./src/migrations/*.ts"],
  useUTC: true,
  logging: "all",
})
