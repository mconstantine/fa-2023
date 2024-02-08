import { initDatabase } from "./database/init"
import express from "express"
import { env } from "./env"
import { CategoryRouter } from "./routes/category"
import { TransactionRouter } from "./routes/transaction"

const app = express()

;(async () => {
  await initDatabase()

  app.use(express.json())

  app
    .use("/categories", CategoryRouter.toExpressRouter())
    .use("/transactions", TransactionRouter.toExpressRouter())

  app.listen(env.SERVER_PORT, () => {
    console.log(`Server ready on port ${env.SERVER_PORT.toString(10)}`)
  })
})()
  .then(() => {})
  .catch(console.log)
