import { IsNotEmpty } from "class-validator"
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id?: string

  @Column()
  @IsNotEmpty()
  // @ts-expect-error doesn't need initialization
  public name: string

  @Column({ type: "simple-array", default: "" })
  // @ts-expect-error doesn't need initialization
  public keywords: string[]
}
