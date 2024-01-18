import { Min } from "class-validator"
import {
  BaseEntity,
  Column,
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

  @Column()
  @Min(2023)
  public year!: number

  @Column()
  @Min(0)
  public value!: number

  @ManyToOne(() => Category, { nullable: true })
  public category!: Relation<Category> | null
}
