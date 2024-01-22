import { IsOptional, IsUUID, Min, ValidateNested } from "class-validator"
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
import { In } from "typeorm"

class PredictionCreationBody {
  @Min(2023)
  public year!: number

  @IsUUID()
  @IsOptional()
  public categoryId?: string | undefined

  public value!: number
}

export class PredictionBulkCreationBody {
  @ValidateNested({ each: true })
  public predictions!: PredictionCreationBody[]

  public constructor(predictions: PredictionCreationBody[]) {
    this.predictions = predictions
  }
}

class PredictionUpdateBody extends PredictionCreationBody {
  @IsUUID()
  public id!: string
}

export class PredictionBulkUpdateBody {
  @ValidateNested({ each: true })
  public predictions!: PredictionUpdateBody[]

  public constructor(predictions: PredictionUpdateBody[]) {
    this.predictions = predictions
  }
}

@JsonController("/predictions")
export class PredictionController {
  @Post()
  public async createPrediction(
    @Body() body: PredictionCreationBody,
  ): Promise<Prediction> {
    return await Prediction.create(body).save()
  }

  @Post("/bulk")
  public async createInBulk(
    @Body() body: PredictionBulkCreationBody,
  ): Promise<Prediction[]> {
    const predictions = Prediction.create(body.predictions)
    const insertResult = await Prediction.insert(predictions)
    const ids: string[] = insertResult.identifiers.map((_) => _["id"])

    return await Prediction.find({
      where: { id: In(ids) },
      relations: ["category"],
    })
  }

  @Get("/:year")
  public async findByYear(@Param("year") year: number): Promise<Prediction[]> {
    return await Prediction.find({ where: { year }, relations: ["category"] })
  }

  @Patch()
  public async update(@Body() body: PredictionUpdateBody): Promise<Prediction> {
    const prediction = await Prediction.findOneByOrFail({ id: body.id })
    return await Prediction.merge<Prediction>(prediction, body).save()
  }

  @Patch("/bulk")
  public async updateInBulk(
    @Body() body: PredictionBulkUpdateBody,
  ): Promise<Prediction[]> {
    await Prediction.createQueryBuilder()
      .insert()
      .values(body.predictions)
      .orUpdate(["year", "categoryId", "value"], ["id"])
      .execute()

    return await Prediction.find({
      where: { id: In(body.predictions.map((_) => _.id)) },
      relations: ["category"],
    })
  }

  @Delete()
  public async delete(@Body() body: PredictionUpdateBody): Promise<Prediction> {
    const prediction = await Prediction.findOneByOrFail({ id: body.id })
    return await prediction.remove()
  }
}
