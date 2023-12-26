import { createExpressServer } from "routing-controllers"
import { CategoryController } from "./controllers/CategoryController"
import { AppDataSource } from "./AppDataSource"

AppDataSource.initialize()
  .then(() => {
    const app = createExpressServer({
      controllers: [CategoryController],
    })

    app.listen(5000, () => {
      console.log("Server ready on port 5000")
    })
  })
  .catch((error) => {
    console.log(error)
    process.exit()
  })
