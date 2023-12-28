import { IsArray, IsNotEmpty, IsOptional, IsUUID } from "class-validator"
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

class CategoryCreationBody {
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

class CategoryUpdateBody extends CategoryCreationBody {
  @IsUUID()
  // @ts-expect-error doesn't need initialization
  public id: string

  override toCategory(): Omit<DeepPartial<Category>, "id"> & { id: string } {
    return {
      ...super.toCategory(),
      id: this.id,
    }
  }
}

@JsonController("/categories")
export class CategoryController {
  @Post("/")
  async create(@Body() body: CategoryCreationBody): Promise<Category> {
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

  @Put("/")
  async update(@Body() body: CategoryUpdateBody): Promise<Category> {
    const data = body.toCategory()
    const category = await Category.findOneByOrFail({ id: data.id })
    return await Category.merge(category, data).save()
  }

  @Delete("/:id")
  async delete(@Param("id") id: string): Promise<Category> {
    const category = await Category.findOneByOrFail({ id })
    return await category.remove()
  }
}
