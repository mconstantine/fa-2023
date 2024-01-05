import { IsNotEmpty } from "class-validator"
import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm"
import { Transaction } from "./Transaction"

@Entity()
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id!: string

  @Column()
  @IsNotEmpty()
  public name!: string

  @Column({ type: "simple-array", default: "" })
  public keywords!: string[]

  @ManyToMany(() => Transaction, (transaction) => transaction.categories)
  public transactions!: Relation<Transaction[]>
}
