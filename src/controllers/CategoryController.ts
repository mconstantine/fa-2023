import { IsArray, IsNotEmpty, IsOptional } from "class-validator"
import {
  Body,
  Delete,
  Get,
  JsonController,
  Param,
  Post,
  Put,
} from "routing-controllers"
import { Category } from "../models/Category"
import type { DeepPartial } from "typeorm"

class CategoryBody {
  @IsNotEmpty()
  // @ts-expect-error doesn't need initialization
  public name: string

  @IsArray()
  @IsOptional()
  public keywords?: string[]

  toCategory(): DeepPartial<Category> {
    return {
      name: this.name,
      keywords: this.keywords ?? [],
    }
  }
}

@JsonController("/categories")
export class CategoryController {
  @Post("/")
  async create(@Body() body: CategoryBody): Promise<Category> {
    return await Category.create(body.toCategory()).save()
  }

  @Get("/:id")
  async findOne(@Param("id") id: string): Promise<Category> {
    return await Category.findOneByOrFail({ id })
  }

  @Get("/")
  async find(): Promise<Category[]> {
    return await Category.find()
  }

  @Put("/:id")
  async update(
    @Param("id") id: string,
    @Body() body: CategoryBody,
  ): Promise<Category> {
    const category = await Category.findOneByOrFail({ id })
    return await Category.merge(category, body.toCategory()).save()
  }

  @Delete("/:id")
  async delete(@Param("id") id: string): Promise<Category> {
    const category = await Category.findOneByOrFail({ id })
    return await category.remove()
  }
}
