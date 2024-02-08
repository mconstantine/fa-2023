import { initDatabase } from "./database/init"
import express from "express"
import { env } from "./env"
import { categoryRouter } from "./routes/category"
import { transactionRouter } from "./routes/transaction"
import { budgetRouter } from "./routes/budget"

const app = express()

;(async () => {
  await initDatabase()

  app.use(express.json())

  app
    .use("/categories", categoryRouter.toExpressRouter())
    .use("/transactions", transactionRouter.toExpressRouter())
    .use("/budgets", budgetRouter.toExpressRouter())

  app.listen(env.SERVER_PORT, () => {
    console.log(`Server ready on port ${env.SERVER_PORT.toString(10)}`)
  })
})()
  .then(() => {})
  .catch(console.log)
