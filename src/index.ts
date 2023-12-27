import { createExpressServer } from "routing-controllers"
import { CategoryController } from "./controllers/CategoryController"
import { AppDataSource } from "./AppDataSource"
import { ErrorHandler } from "./ErrorHandler"

AppDataSource.initialize()
  .then(() => {
    const app = createExpressServer({
      routePrefix: "/api",
      controllers: [CategoryController],
      defaultErrorHandler: false,
      middlewares: [ErrorHandler],
      cors: {
        origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
      },
    })

    app.listen(5000, () => {
      console.log("Server ready on port 5000")
    })
  })
  .catch((error) => {
    console.log(error)
    process.exit()
  })
