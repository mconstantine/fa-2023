import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from "class-validator"
import {
  Body,
  Delete,
  Get,
  JsonController,
  Param,
  Post,
  Put,
  QueryParams,
} from "routing-controllers"
import { Category } from "../models/Category"
import { In, type DeepPartial } from "typeorm"

class FindCategoryParams {
  @IsOptional()
  @IsNotEmpty()
  public query?: string
}

class CategoryCreationBody {
  @IsNotEmpty()
  public name!: string

  @IsArray()
  @IsOptional()
  public keywords?: string[]

  public toCategory(): DeepPartial<Category> {
    return {
      name: this.name,
      keywords: this.keywords ?? [],
    }
  }
}

class CategoryUpdateBody extends CategoryCreationBody {
  @IsUUID()
  public id!: string

  public override toCategory(): Omit<DeepPartial<Category>, "id"> & {
    id: string
  } {
    return {
      ...super.toCategory(),
      id: this.id,
    }
  }
}

class CategoryBulkCreationBody {
  @ValidateNested({ each: true })
  public categories!: CategoryCreationBody[]
}

@JsonController("/categories")
export class CategoryController {
  @Post("/")
  async create(@Body() body: CategoryCreationBody): Promise<Category> {
    return await Category.create(body.toCategory()).save()
  }

  @Post("/bulk")
  async createInBulk(
    @Body() body: CategoryBulkCreationBody,
  ): Promise<Category[]> {
    const categories = Category.create(body.categories)
    const insertResult = await Category.insert(categories)
    const ids: string[] = insertResult.identifiers.map((_) => _["id"])

    return await Category.find({ where: { id: In(ids) } })
  }

  @Get("/:id")
  async findOne(@Param("id") id: string): Promise<Category> {
    return await Category.findOneByOrFail({ id })
  }

  @Get("/")
  async find(@QueryParams() params: FindCategoryParams): Promise<Category[]> {
    const query = Category.createQueryBuilder("c").where("1 = 1")

    console.log(params)

    if (typeof params.query !== "undefined") {
      query.andWhere("LOWER(c.name) LIKE :query", {
        query: `%${params.query}%`,
      })
    }

    return await query.getMany()
  }

  @Put("/")
  async update(@Body() body: CategoryUpdateBody): Promise<Category> {
    const data = body.toCategory()
    const category = await Category.findOneByOrFail({ id: data.id })
    return await Category.merge<Category>(category, data).save()
  }

  @Delete("/")
  async delete(@Body() body: CategoryUpdateBody): Promise<Category> {
    const data = body.toCategory()
    const category = await Category.findOneByOrFail({ id: data.id })
    return await category.remove()
  }
}
