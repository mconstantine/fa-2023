import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
  type: "postgres",
  url: "postgres://postgres:postgres@db:5432/fa_2023",
})
