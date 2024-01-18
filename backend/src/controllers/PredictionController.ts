import { IsUUID, Min } from "class-validator"
import {
  Body,
  Delete,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
} from "routing-controllers"
import { Prediction } from "../models/Prediction"

class PredictionCreationBody {
  @Min(2023)
  public year!: number

  @IsUUID()
  public categoryId!: string

  @Min(0)
  public value!: number
}

class PredictionUpdateBody extends PredictionCreationBody {
  @IsUUID()
  public id!: string
}

@JsonController("/predictions")
export class PredictionController {
  @Post()
  public async createPrediction(
    @Body() body: PredictionCreationBody,
  ): Promise<Prediction> {
    return await Prediction.create(body).save()
  }

  @Get("/:year")
  public async findByYear(@Param("year") year: number): Promise<Prediction[]> {
    return await Prediction.findBy({ year })
  }

  @Patch()
  public async updatePrediction(
    @Body() body: PredictionUpdateBody,
  ): Promise<Prediction> {
    const prediction = await Prediction.findOneByOrFail({ id: body.id })
    return await Prediction.merge<Prediction>(prediction, body).save()
  }

  @Delete()
  public async delete(@Body() body: PredictionUpdateBody): Promise<Prediction> {
    const prediction = await Prediction.findOneByOrFail({ id: body.id })
    return await prediction.remove()
  }
}
