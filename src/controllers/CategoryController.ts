import { IsArray, IsNotEmpty, IsOptional } from "class-validator"
import { Body, JsonController, Post } from "routing-controllers"
import { Category } from "../models/Category"

class CategoryCreationBody {
  @IsNotEmpty()
  // @ts-expect-error doesn't need initialization
  public name: string

  @IsArray()
  @IsOptional()
  // @ts-expect-error doesn't need initialization
  public keywords: string[] | null
}

@JsonController("/categories")
export class CategoryController {
  @Post("/")
  async create(@Body() data: CategoryCreationBody): Promise<Category> {
    const category = Category.create({
      ...data,
      keywords: data.keywords ?? [],
    })

    return await category.save()
  }
}
