import { createExpressServer } from "routing-controllers"
import { CategoryController } from "./controllers/CategoryController"
import { AppDataSource } from "./AppDataSource"
import { ErrorHandler } from "./ErrorHandler"

AppDataSource.initialize()
  .then(() => {
    const app = createExpressServer({
      controllers: [CategoryController],
      defaultErrorHandler: false,
      middlewares: [ErrorHandler],
    })

    app.listen(5000, () => {
      console.log("Server ready on port 5000")
    })
  })
  .catch((error) => {
    console.log(error)
    process.exit()
  })
