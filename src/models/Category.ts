import { IsNotEmpty } from "class-validator"
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  // @ts-expect-error doesn't need initialization
  public id: string

  @Column()
  @IsNotEmpty()
  // @ts-expect-error doesn't need initialization
  public name: string

  @Column("simple-array", { array: true, default: [] })
  // @ts-expect-error doesn't need initialization
  public keywords: string[]
}
