import "reflect-metadata"
import { DataSource } from "typeorm"
import { Category } from "./models/Category"
import { Transaction } from "./models/Transaction"

export const TestDataSource = new DataSource({
  type: "postgres",
  url: "postgres://postgres:postgres@db:5432/fa_2023_test",
  entities: [Category, Transaction],
  migrations: [],
  synchronize: true,
  dropSchema: true,
})
