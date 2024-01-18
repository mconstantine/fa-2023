import { Min } from "class-validator"
import {
  BaseEntity,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm"
import { Category } from "./Category"

@Entity()
export class Prediction extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id!: string

  @Min(2023)
  public year!: number

  @Min(0)
  public value!: number

  @ManyToOne(() => Category)
  public category!: Relation<Category>
}
