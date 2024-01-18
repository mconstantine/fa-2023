import "reflect-metadata"
import { DataSource } from "typeorm"
import { Category } from "./models/Category"
import { Transaction } from "./models/Transaction"
import { Prediction } from "./models/Prediction"

export const TestDataSource = new DataSource({
  type: "postgres",
  url: "postgres://postgres:postgres@db:5432/fa_2023_test",
  entities: [Category, Transaction, Prediction],
  migrations: [],
  useUTC: true,
  synchronize: true,
  dropSchema: true,
})
