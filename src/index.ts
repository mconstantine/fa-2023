import { AppDataSource } from "./DataSource"

AppDataSource.initialize()
  .then(() => {
    console.log("Database works")
  })
  .catch((e) => {
    console.log(e)
  })
