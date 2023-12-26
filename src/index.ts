import { AppDataSource } from "./AppDataSource"

AppDataSource.initialize()
  .then(() => {
    console.log("Database works")
  })
  .catch((e) => {
    console.log(e)
  })
