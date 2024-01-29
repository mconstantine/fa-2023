import { DataSource } from "typeorm"
import { Category } from "./models/Category"
import { Transaction } from "./models/Transaction"
import { Prediction } from "./models/Prediction"

export const AppDataSource = new DataSource({
  type: "postgres",
  url: "postgres://postgres:postgres@db:5432/fa_2023",
  entities: [Category, Transaction, Prediction],
  migrations: ["./src/migrations/*.ts"],
  useUTC: true,
  logging: ["error"],
})
