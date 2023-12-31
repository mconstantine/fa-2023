import { IsNotEmpty } from "class-validator"
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id?: string

  @Column()
  @IsNotEmpty()
  public name!: string

  @Column({ type: "simple-array", default: "" })
  public keywords!: string[]
}
