import { initDatabase } from "./database/init"
import express, { Router } from "express"
import { env } from "./env"
import { categoryRouter } from "./routes/category"
import { transactionRouter } from "./routes/transaction"
import { budgetRouter } from "./routes/budget"
import cors from "cors"
import { userRouter } from "./routes/user"

const app = express()

;(async () => {
  await initDatabase()

  app.use(express.json())

  if (env.NODE_ENV === "development") {
    app.use(cors())
  }

  app.use(
    "/api",
    Router()
      .use("/categories", categoryRouter)
      .use("/transactions", transactionRouter)
      .use("/budgets", budgetRouter)
      .use("/users", userRouter),
  )

  app.listen(env.SERVER_PORT, () => {
    console.log(`Server ready on port ${env.SERVER_PORT.toString(10)}`)
  })
})()
  .then(() => {})
  .catch(console.log)
